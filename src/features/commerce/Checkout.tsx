import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "../auth/provider";
import { useBuilds, readBuild } from "../garage/api";
import { Loading } from "../../components/ui/Feedback";
import { Fields } from "../admin/Fields";
import { userError } from "../../lib/supabase";
import { useCommerce } from "./Provider";
import { CartContents } from "./Cart";
import { createOrder, getQuote, salesRpc, summarize } from "./api";
import {
  money,
  conditionLabels,
  type Address,
  type Contact,
  type CartLine,
  type Summary,
} from "./model";
const contactFields = [
  { key: "name", label: "Destinatario", kind: "text" as const },
  {
    key: "contact",
    label: "Correo o teléfono de contacto",
    kind: "text" as const,
  },
];
const addressFields = [
  { key: "address", label: "Dirección", kind: "text" as const },
  { key: "city", label: "Distrito / ciudad", kind: "text" as const },
  { key: "region", label: "Región", kind: "text" as const },
];
export default function Checkout() {
  const auth = useAuth();
  return (
    <CheckoutContent
      key={`${auth.user?.id}:${auth.roleId}:${[...auth.permissions].sort().join(":")}`}
    />
  );
}
function CheckoutContent() {
  const auth = useAuth();
  const cart = useCommerce()!;
  const navigate = useNavigate();
  const client = useQueryClient();
  const [params] = useSearchParams();
  const quoteId = params.get("quote") ?? undefined;
  const revising = params.get("revisar") ?? undefined;
  const sourceQuote = quoteId ?? revising;
  const quote = useQuery({
    queryKey: ["sales", "quote", auth.user?.id, sourceQuote],
    enabled: !!sourceQuote && !!auth.user,
    queryFn: ({ signal }) => getQuote(sourceQuote!, signal),
  });
  const [contact, setContact] = useState<Contact>({ name: "", contact: "" });
  const [address, setAddress] = useState<Address>({});
  const [delivery, setDelivery] = useState("pickup");
  const [assembly, setAssembly] = useState(false);
  const [buildId, setBuildId] = useState("");
  const builds = useBuilds();
  const [useCurrentCart, setUseCurrentCart] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const key = useRef(crypto.randomUUID());
  const captured = useRef<{ lines: CartLine[]; revision?: number } | null>(
    null,
  );
  const generation = useRef(0);
  useEffect(() => {
    generation.current++;
    setSummary(null);
    setError("");
    key.current = crypto.randomUUID();
    return () => {
      generation.current++;
    };
  }, [auth.user?.id]);
  useEffect(() => {
    if (!quote.data) return;
    setContact(quote.data.contact_snapshot);
    setAddress(quote.data.delivery_snapshot as Address);
    setDelivery(quote.data.delivery_method);
    setAssembly(quote.data.assembly_requested);
  }, [quote.data]);
  function edit() {
    setSummary(null);
    key.current = crypto.randomUUID();
  }
  const needsQuote =
    !quoteId && (!!revising || assembly || delivery === "shipping");
  const lines =
    quote.data && !useCurrentCart
      ? quote.data.merchandise_snapshot.map(({ offer_id, quantity }) => ({
          offer_id,
          quantity,
        }))
      : cart.lines;
  async function prepare() {
    const gen = generation.current;
    setBusy(true);
    setError("");
    try {
      if (needsQuote) {
        let selection: unknown[] = [];
        let source: string | null = null;
        if (assembly) {
          if (buildId) {
            const build = await readBuild(buildId);
            if (gen !== generation.current) return;
            selection = build.configuration.items;
            source = buildId;
          } else if (revising && quote.data?.assembly_requested) {
            selection = quote.data.selection_snapshot;
          } else throw new Error("sales_assembly_selection_required");
        }
        const id = await salesRpc(
          "sales_request_quote",
          {
            p_id: key.current,
            p_lines: lines,
            p_contact: contact,
            p_delivery: delivery,
            p_address: delivery === "pickup" ? {} : address,
            p_assembly: assembly,
            p_selection: selection,
            p_build_id: source,
            p_previous: revising ?? null,
            p_revision: revising ? quote.data?.revision : null,
          },
          z.guid(),
          undefined,
          auth.user?.id,
        );
        if (gen === generation.current)
          navigate("/mis-pedidos?tab=cotizaciones&quote=" + id);
        return;
      }
      const result = await summarize(
        lines,
        contact,
        delivery,
        delivery === "pickup" ? {} : address,
        quoteId,
        auth.user?.id,
      );
      if (gen === generation.current) {
        setSummary(result);
        captured.current = {
          lines: structuredClone(lines),
          revision: quoteId ? undefined : cart.revision,
        };
      }
    } catch (e) {
      if (gen === generation.current) setError(userError(e));
    } finally {
      if (gen === generation.current) setBusy(false);
    }
  }
  async function confirm() {
    if (!summary || !captured.current) return;
    const gen = generation.current;
    setBusy(true);
    setError("");
    try {
      const saved = captured.current;
      const id = await createOrder(
        key.current,
        summary.hash,
        saved.lines,
        summary.contact,
        summary.delivery,
        summary.address as Address,
        saved.revision,
        quoteId,
        auth.user?.id,
      );
      if (gen === generation.current) {
        await client.invalidateQueries({
          queryKey: ["sales", "cart", auth.user?.id],
        });
        await client.invalidateQueries({ queryKey: ["sales", "quotes"] });
        if (gen === generation.current) navigate("/mis-pedidos?order=" + id);
      }
    } catch (e) {
      if (gen === generation.current) setError(userError(e));
    } finally {
      if (gen === generation.current) setBusy(false);
    }
  }
  if (auth.loading) return <Loading />;
  if (!auth.user)
    return (
      <div className="content narrow">
        <h1>Tu selección</h1>
        <CartContents />
        <Link
          className="button dark"
          to="/entrar"
          onClick={() =>
            sessionStorage.setItem(
              "atlas:intent",
              "/comprar" +
                (sourceQuote
                  ? `?${quoteId ? "quote" : "revisar"}=${encodeURIComponent(sourceQuote)}`
                  : ""),
            )
          }
        >
          Entrar para continuar
        </Link>
      </div>
    );
  if (sourceQuote && quote.isPending) return <Loading />;
  return (
    <div className="content sales-checkout">
      <header>
        <h1>{quoteId ? "Aceptar cotización" : "Revisar pedido"}</h1>
        <p className="sales-note">Sin cobros reales</p>
      </header>
      {error && (
        <p role="alert" className="notice">
          {error}
        </p>
      )}
      {quote.error && <p role="alert">No se pudo recuperar la cotización.</p>}
      <div className="sales-checkout-grid">
        <section className="sales-stack">
          {!quoteId && <CartContents />}
          {revising && (
            <label className="check-label">
              <input
                type="checkbox"
                checked={useCurrentCart}
                onChange={(e) => {
                  setUseCurrentCart(e.target.checked);
                  edit();
                }}
              />
              Usar mi carrito actual en lugar de las piezas cotizadas
            </label>
          )}
          <fieldset disabled={busy || !!quoteId}>
            <Fields
              fields={contactFields}
              value={contact}
              onChange={(v) => {
                setContact(v as Contact);
                edit();
              }}
            />
            <div className="sales-actions">
              {["pickup", "shipping"].map((value) => (
                <button
                  type="button"
                  key={value}
                  className={
                    delivery === value ? "button dark" : "button outline"
                  }
                  onClick={() => {
                    setDelivery(value);
                    edit();
                  }}
                >
                  {value === "pickup" ? "Retiro" : "Envío por cotizar"}
                </button>
              ))}
            </div>
            {delivery === "shipping" && (
              <Fields
                fields={addressFields}
                value={address}
                onChange={(v) => {
                  setAddress(v);
                  edit();
                }}
              />
            )}
            {!quoteId && (
              <>
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={assembly}
                    onChange={(e) => {
                      setAssembly(e.target.checked);
                      edit();
                    }}
                  />
                  Solicitar armado con revisión técnica
                </label>
                {assembly && (
                  <label className="field">
                    Montaje que quieres armar
                    <select
                      value={buildId}
                      onChange={(e) => {
                        setBuildId(e.target.value);
                        edit();
                      }}
                    >
                      <option value="">Seleccionar montaje guardado</option>
                      {builds.data?.builds.map((b) => (
                        <option value={b.id} key={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <Link to="/mis-bicicletas">Ver mis montajes</Link>
                  </label>
                )}
              </>
            )}
          </fieldset>
        </section>
        <aside className="sales-summary">
          {summary ? (
            <>
              <h2>Resumen</h2>
              {summary.lines.map((l) => (
                <p key={l.offer_id}>
                  <span>
                    {l.quantity} × {l.label}
                    {l.item_condition && (
                      <>
                        <br />
                        <small className="sales-condition">
                          {conditionLabels[l.item_condition]}
                        </small>
                      </>
                    )}
                  </span>
                  <strong>{money(l.subtotal_cents)}</strong>
                </p>
              ))}
              <p>
                Armado <strong>{money(summary.assembly_fee_cents)}</strong>
              </p>
              <p>
                Entrega <strong>{money(summary.delivery_fee_cents)}</strong>
              </p>
              <p>
                Total <strong>{money(summary.total_cents)}</strong>
              </p>
              <button
                className="button dark"
                disabled={busy}
                onClick={() => void confirm()}
              >
                {busy ? "Creando…" : "Crear pedido"}
              </button>
              <button disabled={busy} className="text-button" onClick={edit}>
                Revisar resumen de nuevo
              </button>
            </>
          ) : (
            <>
              <h2>
                {needsQuote ? "Solicitar cotización" : "Antes de confirmar"}
              </h2>
              <p>
                {needsQuote
                  ? "Armado y envío se cotizan antes de aceptar el pedido."
                  : "El precio y la disponibilidad se comprobarán en servidor."}
              </p>
              <button
                className="button dark"
                disabled={busy || !lines.length || !!quote.error}
                onClick={() => void prepare()}
              >
                {busy
                  ? "Consultando…"
                  : !quoteId &&
                      (!!revising || assembly || delivery === "shipping")
                    ? "Solicitar cotización"
                    : "Ver resumen"}
              </button>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
