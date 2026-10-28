import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Drawer } from "../../components/ui/Drawer";
import { userError } from "../../lib/supabase";
import { salesRpc } from "./api";
import { useCommerce } from "./Provider";
import { lineSchema } from "./model";
import { useAuth } from "../auth/provider";
import type { VariantMap } from "../configurator/model";
import type { Configuration } from "../configurator/model";
import { slotLabels } from "../configurator/model";
const conversionSchema = z.object({
  lines: z.array(lineSchema),
  positions: z.array(
    z.object({ slot: z.string(), offer_id: z.guid(), quantity: z.number() }),
  ),
  unresolved: z.array(z.string()),
});
export function MontagePurchase({
  configuration,
  variants = {},
}: {
  configuration: Configuration;
  variants?: VariantMap;
}) {
  const commerce = useCommerce();
  const auth = useAuth();
  return commerce ? (
    <Convert
      key={`${auth.user?.id}:${auth.permissions.join(":")}`}
      configuration={configuration}
      variants={variants}
    />
  ) : null;
}
function Convert({
  configuration,
  variants,
}: {
  configuration: Configuration;
  variants: VariantMap;
}) {
  const commerce = useCommerce()!;
  const navigate = useNavigate();
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const [result, setResult] = useState<
    | (z.infer<typeof conversionSchema> & { names: Record<string, string> })
    | null
  >(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  async function inspect() {
    setBusy(true);
    setError("");
    try {
      const data = await salesRpc(
        "sales_convert_selection",
        { p_selection: configuration.items },
        conversionSchema,
      );
      if (!alive.current) return;
      const names = Object.fromEntries(
        data.lines.map((line) => [
          line.offer_id,
          [
            ...new Set(
              data.positions
                .filter((p) => p.offer_id === line.offer_id)
                .map((p) => {
                  const item = configuration.items.find(
                    (i) => i.slot === p.slot,
                  );
                  const variant = item ? variants[item.variantId] : undefined;
                  return variant
                    ? `${variant.component.brands.name} ${variant.component.name} · ${variant.label}`
                    : (slotLabels[p.slot as keyof typeof slotLabels] ?? p.slot);
                }),
            ),
          ].join(" / "),
        ]),
      );
      setResult({ ...data, names });
      setSelected(data.lines.map((l) => l.offer_id));
    } catch (e) {
      setError(userError(e));
    } finally {
      setBusy(false);
    }
  }
  async function add(replace: boolean) {
    if (!result) return;
    setBusy(true);
    setError("");
    try {
      await commerce.add(
        result.lines.filter((l) => selected.includes(l.offer_id)),
        replace,
      );
      if (!alive.current) return;
      setResult(null);
      navigate("/comprar");
    } catch (e) {
      setError(userError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        className="button outline small"
        disabled={busy || !configuration.items.length}
        onClick={() => void inspect()}
      >
        Comprar componentes
      </button>
      {error && !result && <span role="alert">{error}</span>}
      {result && (
        <Drawer
          title="Componentes de tu montaje"
          busy={busy}
          onClose={() => setResult(null)}
          footer={
            <div className="sales-actions">
              <button
                className="button dark"
                disabled={!selected.length || busy}
                onClick={() => void add(false)}
              >
                Sumar al carrito
              </button>
              {commerce.lines.length > 0 && (
                <button
                  className="button outline"
                  disabled={!selected.length || busy}
                  onClick={() => void add(true)}
                >
                  Reemplazar carrito completo
                </button>
              )}
            </div>
          }
        >
          <p>
            Se añadirán solo los artículos seleccionados. No se guarda ni se
            modifica el montaje.
          </p>
          {commerce.lines.length > 0 && (
            <p className="notice">
              Reemplazar elimina todo el contenido anterior del carrito.
            </p>
          )}
          {error && <p role="alert">{error}</p>}
          {result.lines.map((l) => (
            <label className="check-label" key={l.offer_id}>
              <input
                type="checkbox"
                checked={selected.includes(l.offer_id)}
                onChange={(e) =>
                  setSelected((a) =>
                    e.target.checked
                      ? [...a, l.offer_id]
                      : a.filter((id) => id !== l.offer_id),
                  )
                }
              />
              {l.quantity} × {result.names[l.offer_id]}
            </label>
          ))}
          {result.unresolved.length > 0 && (
            <section className="notice">
              <h3>Sin oferta para esta selección</h3>
              {result.unresolved.map((slot) => (
                <p key={slot}>
                  {slotLabels[slot as keyof typeof slotLabels] ?? slot}
                </p>
              ))}
              <p>
                Un color personalizado o una referencia genérica no equivale a
                un producto vendible.
              </p>
            </section>
          )}
        </Drawer>
      )}
    </>
  );
}
