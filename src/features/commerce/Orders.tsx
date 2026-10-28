import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/provider";
import { Drawer, DrawerActions } from "../../components/ui/Drawer";
import { Empty, Loading, Notice } from "../../components/ui/Feedback";
import { SpecificationDetails } from "../catalog/Specifications";
import { specificationFields } from "../catalog/model/specifications";
import { slotLabels, type Slot } from "../configurator/model";
import { z } from "zod";
import { categories } from "../catalog/model";
import { Fields } from "../admin/Fields";
import { userError } from "../../lib/supabase";
import {
  demoPayment,
  getOrder,
  getQuote,
  listOrders,
  listQuotes,
  salesRpc,
  transition,
} from "./api";
import {
  money,
  orderStatusLabel,
  dateTime,
  dateOnly,
  orderSchema,
  parseMoney,
  quoteSchema,
  statusLabels,
  type Order,
  type Quote,
} from "./model";
export default function Orders({ admin = false }: { admin?: boolean }) {
  const auth = useAuth();
  if (auth.loading) return <Loading />;
  if (!auth.user)
    return (
      <div className="content">
        <h1>Mis pedidos</h1>
        <Link
          to="/entrar"
          onClick={() => sessionStorage.setItem("atlas:intent", "/mis-pedidos")}
        >
          Entrar
        </Link>
      </div>
    );
  return (
    <OrdersContent
      key={`${auth.user.id}:${auth.permissions.join(":")}`}
      admin={admin}
    />
  );
}
function OrdersContent({ admin }: { admin: boolean }) {
  const auth = useAuth();
  const [params, setParams] = useSearchParams();
  const canOrders = !admin || auth.permissions.includes("sales.orders.manage");
  const canQuotes = !admin || auth.permissions.includes("sales.quotes.manage");
  const quotes =
    canQuotes && (!canOrders || params.get("tab") === "cotizaciones");
  const page = Math.max(0, Math.floor(Number(params.get("page")) || 0));
  const detailId = params.get(quotes ? "quote" : "order");
  const query = useQuery<
    | Awaited<ReturnType<typeof listOrders>>
    | Awaited<ReturnType<typeof listQuotes>>
  >({
    queryKey: [
      "sales",
      quotes ? "quotes" : "orders",
      auth.user?.id,
      admin,
      page,
    ],
    queryFn: ({ signal }) =>
      quotes
        ? listQuotes(admin, page, signal)
        : listOrders(admin, page, signal),
    enabled: quotes ? canQuotes : canOrders,
  });
  function update(values: Record<string, string | null>) {
    setParams((p) => {
      for (const [key, value] of Object.entries(values)) {
        if (value) p.set(key, value);
        else p.delete(key);
      }
      return p;
    });
  }
  return (
    <div className={admin ? "sales-stack" : "content sales-stack"}>
      {!admin && <h1>Mis pedidos</h1>}
      <p className="sales-demo">Demostración · sin cobros reales</p>
      <nav className="segmented" aria-label="Compras">
        {canOrders && (
          <button
            className={!quotes ? "active" : ""}
            onClick={() =>
              update({ tab: null, page: null, quote: null, order: null })
            }
          >
            Pedidos
          </button>
        )}
        {canQuotes && (
          <button
            className={quotes ? "active" : ""}
            onClick={() =>
              update({
                tab: "cotizaciones",
                page: null,
                quote: null,
                order: null,
              })
            }
          >
            Cotizaciones
          </button>
        )}
      </nav>
      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <Notice onRetry={() => void query.refetch()}>
          No se pudo recuperar la lista.
        </Notice>
      ) : !query.data.items.length ? (
        <Empty title={quotes ? "Sin cotizaciones" : "Sin pedidos"}>
          <Link to="/componentes">Explorar componentes</Link>
        </Empty>
      ) : (
        <>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Referencia</th>
                  <th>Estado</th>
                  <th>{quotes ? "Servicio" : "Total"}</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {query.data.items.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <button
                        className="text-button"
                        onClick={() =>
                          update({ [quotes ? "quote" : "order"]: row.id })
                        }
                      >
                        {row.id.slice(0, 8).toUpperCase()}
                      </button>
                    </td>
                    <td>{orderStatusLabel(row.status, row.delivery_method)}</td>
                    <td>
                      {"total_cents" in row
                        ? money(row.total_cents)
                        : row.assembly_requested
                          ? "Armado y entrega"
                          : "Entrega"}
                    </td>
                    <td>{dateOnly(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <button
              disabled={!page}
              onClick={() => update({ page: String(page - 1) })}
            >
              Anterior
            </button>
            <span>{page + 1}</span>
            <button
              disabled={(page + 1) * 25 >= query.data.count}
              onClick={() => update({ page: String(page + 1) })}
            >
              Siguiente
            </button>
          </div>
        </>
      )}
      {detailId && (
        <Drawer
          title={quotes ? "Cotización" : "Pedido"}
          onClose={() => update({ quote: null, order: null })}
        >
          {quotes ? (
            <QuoteDetails key={detailId} id={detailId} admin={admin} />
          ) : (
            <OrderDetails key={detailId} id={detailId} admin={admin} />
          )}
        </Drawer>
      )}
    </div>
  );
}
function OrderDetails({ id, admin }: { id: string; admin: boolean }) {
  const auth = useAuth();
  const query = useQuery({
    queryKey: ["sales", "order", auth.user?.id, id],
    queryFn: ({ signal }) => getOrder(id, signal),
    refetchInterval: 30_000,
  });
  return query.isPending ? (
    <Loading />
  ) : query.error ? (
    <Notice onRetry={() => void query.refetch()}>
      No se pudo recuperar el pedido.
    </Notice>
  ) : (
    <OrderActions order={query.data} admin={admin} />
  );
}
function OrderActions({ order, admin }: { order: Order; admin: boolean }) {
  const auth = useAuth();
  const client = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [method, setMethod] = useState("yape_demo");
  const [reason, setReason] = useState("");
  const payment = useRef<{
    key: string;
    result: string;
    method: string;
  } | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  async function act(work: () => Promise<Order>) {
    setBusy(true);
    setError("");
    try {
      const next = await work();
      if (!alive.current) return;
      client.setQueryData(
        ["sales", "order", auth.user?.id, order.id],
        orderSchema.parse(next),
      );
      await client.invalidateQueries({ queryKey: ["sales", "orders"] });
      await client.invalidateQueries({ queryKey: ["sales", "offers"] });
      await client.invalidateQueries({ queryKey: ["sales", "cart-prices"] });
    } catch (e) {
      setError(userError(e));
    } finally {
      setBusy(false);
    }
  }
  async function pay(result: string) {
    if (
      payment.current &&
      (payment.current.method !== method || payment.current.result !== result)
    ) {
      setError(
        "Reintenta primero el resultado anterior o recarga el pedido para comprobarlo.",
      );
      return;
    }
    payment.current ??= { key: crypto.randomUUID(), result, method };
    await act(async () => {
      const next = await demoPayment(
        order.id,
        payment.current!.key,
        method,
        result,
        auth.user?.id,
      );
      payment.current = null;
      return next;
    });
  }
  const next: Record<string, string> = {
    confirmed: "preparing",
    preparing: "ready",
    ready: "delivered",
  };
  return (
    <div className="sales-stack">
      <p className="sales-demo">
        Pedido de demostración · {order.id.slice(0, 8).toUpperCase()}
      </p>
      <h2>{orderStatusLabel(order.status, order.delivery_method)}</h2>
      {order.status === "pending" && (
        <p>Reserva hasta {dateTime(order.reservation_expires_at)}</p>
      )}
      {order.items.map((i) => (
        <article className="sales-cart-line" key={i.id}>
          <strong>{i.label_snapshot}</strong>
          <span>
            {i.quantity} ×{" "}
            {money(i.base_unit_price_cents - i.unit_discount_cents)} ·{" "}
            {i.finish_snapshot}
          </span>
        </article>
      ))}
      <p>
        Armado: {money(order.assembly_fee_cents)} · Entrega:{" "}
        {money(order.delivery_fee_cents)}
      </p>
      <strong>Total: {money(order.total_cents)}</strong>
      {error && (
        <p role="alert" className="notice">
          {error}
        </p>
      )}
      {!admin && order.status === "pending" && (
        <fieldset disabled={busy}>
          <legend>Simular pago · sin cobros</legend>
          <div className="sales-actions">
            {[
              ["yape_demo", "Yape"],
              ["transfer_demo", "Transferencia"],
              ["card_demo", "Tarjeta"],
            ].map(([value, label]) => (
              <button
                key={value}
                aria-pressed={method === value}
                className={method === value ? "button dark" : "button outline"}
                onClick={() => setMethod(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <p>No ingreses datos bancarios. El resultado es una simulación.</p>
        </fieldset>
      )}
      {(order.status === "pending" ||
        (admin && order.status === "confirmed")) && (
        <fieldset disabled={busy}>
          <label className="field">
            Motivo de cancelación
            <input
              value={reason}
              maxLength={2000}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
        </fieldset>
      )}

      <DrawerActions busy={busy}>
        {(order.status === "pending" || (admin && !!next[order.status])) && (
          <div className="sales-stack">
            {!admin && order.status === "pending" && (
              <div className="sales-actions">
                <button
                  className="button dark"
                  onClick={() => void pay("approved")}
                >
                  Simular aprobación
                </button>
                <button onClick={() => void pay("rejected")}>
                  Simular rechazo
                </button>
                <button onClick={() => void pay("cancelled")}>
                  Cancelar simulación
                </button>
              </div>
            )}{" "}
            {(order.status === "pending" ||
              (admin && order.status === "confirmed")) && (
              <button
                className="button outline"
                disabled={reason.trim().length < 3}
                onClick={() =>
                  void act(() =>
                    transition(
                      order.id,
                      order.revision,
                      "cancelled",
                      reason,
                      auth.user?.id,
                    ),
                  )
                }
              >
                Cancelar pedido
              </button>
            )}{" "}
            {admin && next[order.status] && (
              <button
                className="button dark"
                disabled={busy}
                onClick={() =>
                  void act(() =>
                    transition(
                      order.id,
                      order.revision,
                      next[order.status],
                      "",
                      auth.user?.id,
                    ),
                  )
                }
              >
                {orderStatusLabel(next[order.status], order.delivery_method)}
              </button>
            )}
          </div>
        )}
      </DrawerActions>
      <details>
        <summary>Seguimiento</summary>
        {order.events.map((e) => (
          <p key={e.id}>
            {e.to_status
              ? orderStatusLabel(e.to_status, order.delivery_method)
              : "Actualización del pedido"}{" "}
            · {dateTime(e.created_at)}
          </p>
        ))}
      </details>
      <details>
        <summary>Intentos de pago demo</summary>
        {order.payments.map((p) => (
          <p key={p.id}>
            {statusLabels[p.status] ?? p.status} · {dateTime(p.created_at)}
          </p>
        ))}
      </details>
    </div>
  );
}
function QuoteDetails({ id, admin }: { id: string; admin: boolean }) {
  const auth = useAuth();
  const query = useQuery({
    queryKey: ["sales", "quote", auth.user?.id, id],
    queryFn: ({ signal }) => getQuote(id, signal),
  });
  return query.isPending ? (
    <Loading />
  ) : query.error ? (
    <Notice onRetry={() => void query.refetch()}>
      No se pudo recuperar la cotización.
    </Notice>
  ) : (
    <QuoteActions quote={query.data} admin={admin} />
  );
}
const technicalSelection = z.object({
  slot: z.string(),
  technical: z.object({
    category: z.enum(categories),
    name: z.string(),
    specs: z.record(z.string(), z.unknown()),
  }),
});
function QuoteSelection({ selection }: { selection: unknown[] }) {
  return (
    <details>
      <summary>Composición que se revisa</summary>
      {selection.map((raw, index) => {
        const parsed = technicalSelection.safeParse(raw);
        if (!parsed.success)
          return (
            <p key={index}>
              Ficha técnica no disponible en esta versión. Solicita una nueva
              cotización.
            </p>
          );
        const { slot, technical } = parsed.data;
        return (
          <details key={slot}>
            <summary>
              {slotLabels[slot as Slot] ?? slot} · {technical.name}
            </summary>
            <SpecificationDetails
              fields={specificationFields[technical.category].filter(
                (f) => f.key !== "maintenance",
              )}
              value={technical.specs}
            />
          </details>
        );
      })}
    </details>
  );
}
function QuoteActions({ quote, admin }: { quote: Quote; admin: boolean }) {
  const auth = useAuth();
  const client = useQueryClient();
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const [values, setValues] = useState<Record<string, unknown>>({
    assembly: "0",
    delivery: "0",
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function review(status: string) {
    setBusy(true);
    setError("");
    try {
      const next = await salesRpc(
        "sales_review_quote",
        {
          p_id: quote.id,
          p_revision: quote.revision,
          p_status: status,
          p_assembly_fee: parseMoney(String(values.assembly)),
          p_delivery_fee: parseMoney(String(values.delivery)),
          p_notes: values.notes,
        },
        quoteSchema,
        undefined,
        auth.user?.id,
      );
      if (!alive.current) return;
      client.setQueryData(["sales", "quote", auth.user?.id, quote.id], next);
      await client.invalidateQueries({ queryKey: ["sales", "quotes"] });
    } catch (e) {
      setError(userError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="sales-stack">
      <h2>
        {quote.status === "quoted" && quote.expired
          ? "Vencida"
          : statusLabels[quote.status]}{" "}
        · versión {quote.version}
      </h2>
      <p>
        {quote.assembly_requested
          ? "Armado sujeto a revisión técnica"
          : "Entrega de componentes"}
      </p>
      {quote.assembly_requested && (
        <QuoteSelection selection={quote.selection_snapshot} />
      )}
      {quote.merchandise_snapshot.map((l) => (
        <p key={l.offer_id}>
          {l.quantity} × {l.label} · {money(l.subtotal_cents)}
        </p>
      ))}
      <p>
        {quote.contact_snapshot.name} · {quote.contact_snapshot.contact}
      </p>
      {quote.delivery_method === "shipping" && (
        <p>{Object.values(quote.delivery_snapshot).join(" · ")}</p>
      )}
      <p>
        Armado:{" "}
        {quote.assembly_fee_cents === null
          ? "Por cotizar"
          : money(quote.assembly_fee_cents)}
      </p>
      <p>
        Entrega:{" "}
        {quote.delivery_fee_cents === null
          ? "Por cotizar"
          : money(quote.delivery_fee_cents)}
      </p>
      {quote.status === "quoted" && quote.expires_at && (
        <p>Vigencia hasta {dateTime(quote.expires_at)} · hora de Lima</p>
      )}
      {quote.review_notes && <p>{quote.review_notes}</p>}
      {error && <p role="alert">{error}</p>}
      {admin && quote.status === "requested" && (
        <fieldset disabled={busy}>
          <Fields
            fields={[
              { key: "assembly", label: "Armado (S/)", kind: "text" },
              { key: "delivery", label: "Entrega (S/)", kind: "text" },
              {
                key: "notes",
                label: "Revisión técnica y condiciones",
                kind: "text",
              },
            ]}
            value={values}
            onChange={setValues}
          />
          <p>
            Publicar confirma la revisión de la composición y sus condiciones.
          </p>
        </fieldset>
      )}

      <DrawerActions busy={busy}>
        {admin && quote.status === "requested" && (
          <div className="sales-actions">
            <button
              className="button dark"
              onClick={() => void review("quoted")}
            >
              Publicar cotización
            </button>
            <button
              className="button outline"
              onClick={() => void review("rejected")}
            >
              Rechazar solicitud
            </button>
          </div>
        )}{" "}
        {!admin && quote.status === "quoted" && !quote.expired && (
          <Link className="button dark" to={"/comprar?quote=" + quote.id}>
            Revisar y aceptar
          </Link>
        )}
      </DrawerActions>
      {!admin && quote.status === "superseded" && (
        <Link to="/mis-pedidos?tab=cotizaciones">
          Ver la versión vigente en mis cotizaciones
        </Link>
      )}
      {!admin &&
        quote.status !== "superseded" &&
        (quote.expired ||
          ["requested", "quoted", "rejected", "consumed"].includes(
            quote.status,
          )) && (
          <Link to={"/comprar?revisar=" + quote.id}>
            Solicitar una nueva versión
          </Link>
        )}
    </div>
  );
}
