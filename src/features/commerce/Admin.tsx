import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Drawer } from "../../components/ui/Drawer";
import { Empty, Loading, Notice } from "../../components/ui/Feedback";
import { useSearchFilters } from "../admin/useSearchFilters";
import { Fields } from "../admin/Fields";
import { useUnsavedChanges } from "../../components/ui/UnsavedChanges";
import { useAuth } from "../auth/provider";
import { userError } from "../../lib/supabase";
import { salesRpc } from "./api";
import { money, parseMoney, limaInput, fromLimaInput, dateTime } from "./model";
const offer = z.object({
  id: z.guid(),
  sku: z.string(),
  label: z.string(),
  unit_of_sale: z.string(),
  base_price_cents: z.number(),
  stock_total: z.number(),
  available: z.number(),
  active: z.boolean(),
  revision: z.number(),
  choices: z
    .array(z.object({ variant_id: z.guid(), finish_id: z.string() }))
    .nullable(),
});
const promotion = z.object({
  id: z.guid(),
  name: z.string(),
  discount_type: z.string(),
  percentage_bps: z.number().nullable(),
  fixed_discount_cents: z.number().nullable(),
  starts_at: z.string(),
  ends_at: z.string(),
  active: z.boolean(),
  revision: z.number(),
  offer_ids: z.array(z.guid()),
});
type OfferRecord = z.infer<typeof offer>;
type PromotionRecord = z.infer<typeof promotion>;
export default function CommercialAdmin({
  promotions = false,
}: {
  promotions?: boolean;
}) {
  const auth = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [edit, setEdit] = useState<
    OfferRecord | PromotionRecord | "new" | null
  >(null);
  const client = useQueryClient();
  const filters = useSearchFilters(search, page, auth.user?.id ?? "");
  const offers = useQuery({
    queryKey: [
      "sales",
      "admin-offers",
      auth.user?.id,
      filters.search,
      filters.page,
    ],
    enabled: !promotions,
    queryFn: ({ signal }) =>
      salesRpc(
        "sales_admin_offers",
        { p_search: filters.search, p_page: filters.page },
        z.object({ count: z.number(), items: z.array(offer) }),
        signal,
      ),
  });
  const campaigns = useQuery({
    queryKey: ["sales", "promotions", auth.user?.id, page],
    enabled: promotions,
    queryFn: ({ signal }) =>
      salesRpc(
        "sales_promotions",
        { p_page: filters.page },
        z.object({ count: z.number(), items: z.array(promotion) }),
        signal,
      ),
  });
  const data = promotions ? campaigns : offers;
  const rows = promotions
    ? (campaigns.data?.items ?? [])
    : (offers.data?.items ?? []);
  async function saved() {
    setEdit(null);
    await Promise.all(
      [
        "admin-offers",
        "promotions",
        "offers",
        "cart-prices",
        "promotion-choices",
      ].map((key) => client.invalidateQueries({ queryKey: ["sales", key] })),
    );
  }
  return (
    <div className="sales-stack">
      <div className="section-heading">
        <p className="sales-demo">Precios y stock de demostración · PEN</p>
        <button className="button dark" onClick={() => setEdit("new")}>
          {promotions ? "Crear promoción" : "Crear oferta"}
        </button>
      </div>
      {!promotions && (
        <label className="field">
          Buscar
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </label>
      )}
      {data.isPending ? (
        <Loading />
      ) : data.error ? (
        <Notice onRetry={() => void data.refetch()}>
          No se pudo recuperar la lista.
        </Notice>
      ) : !rows.length ? (
        <Empty title="Sin registros" />
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{promotions ? "Campaña" : "Producto"}</th>
                <th>{promotions ? "Descuento" : "Precio"}</th>
                <th>{promotions ? "Vigencia" : "Disponibles / stock"}</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <button className="text-button" onClick={() => setEdit(r)}>
                      {"label" in r ? r.label : r.name}
                    </button>
                  </td>
                  <td>
                    {"base_price_cents" in r
                      ? money(r.base_price_cents)
                      : r.discount_type === "fixed"
                        ? money(r.fixed_discount_cents ?? 0)
                        : `${(r.percentage_bps ?? 0) / 100}%`}
                  </td>
                  <td>
                    {"stock_total" in r
                      ? `${r.available} / ${r.stock_total}`
                      : dateTime(r.ends_at)}
                  </td>
                  <td>{r.active ? "Activa" : "Inactiva"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {
        <div className="pagination">
          <button disabled={!page} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </button>
          <span>{page + 1}</span>
          <button
            disabled={
              (page + 1) * 25 >=
              ((promotions ? campaigns.data?.count : offers.data?.count) ?? 0)
            }
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </button>
        </div>
      }
      {edit &&
        (promotions ? (
          <PromotionEditor
            key={edit === "new" ? "new" : edit.id}
            initial={edit === "new" ? null : (edit as PromotionRecord)}
            onClose={() => setEdit(null)}
            onSaved={saved}
          />
        ) : (
          <OfferEditor
            key={edit === "new" ? "new" : edit.id}
            initial={edit === "new" ? null : (edit as OfferRecord)}
            onClose={() => setEdit(null)}
            onSaved={saved}
          />
        ))}
    </div>
  );
}
function OfferEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial: OfferRecord | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const auth = useAuth();
  const [id] = useState(() => initial?.id ?? crypto.randomUUID());
  const [values, setValues] = useState<Record<string, unknown>>({
    sku: initial?.sku ?? "",
    label: initial?.label ?? "",
    unit: initial?.unit_of_sale ?? "unit",
    price: String((initial?.base_price_cents ?? 0) / 100),
    stock: initial?.stock_total ?? 0,
    active: initial?.active ?? true,
  });
  const [choices, setChoices] = useState(initial?.choices ?? []);
  const [search, setSearch] = useState("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const filters = useSearchFilters(search, 0, auth.user?.id ?? "");
  const options = useQuery({
    queryKey: ["sales", "admin-choices", filters.search],
    queryFn: ({ signal }) =>
      salesRpc(
        "sales_admin_choices",
        { p_search: filters.search },
        z.array(
          z.object({
            variant_id: z.guid(),
            label: z.string(),
            allowed_finishes: z.object({
              options: z.array(z.object({ id: z.string(), label: z.string() })),
            }),
          }),
        ),
        signal,
      ),
  });
  async function save() {
    setBusy(true);
    setError("");
    try {
      const price = parseMoney(String(values.price));
      if (price < 1) throw new Error("sales_invalid_amount");
      if (
        !Number.isInteger(Number(values.stock)) ||
        Number(values.stock) < 0 ||
        Number(values.stock) > 1000000
      )
        throw new Error("sales_invalid_stock");
      await salesRpc(
        "sales_save_offer",
        {
          p_revision: initial?.revision ?? 0,
          p_data: {
            id,
            sku: values.sku,
            label: values.label,
            unit_of_sale: values.unit,
            base_price_cents: price,
            stock_total: Number(values.stock),
            active: values.active,
            choices,
          },
        },
        z.guid(),
        undefined,
        auth.user?.id,
      );
      await onSaved();
      return true;
    } catch (e) {
      setError(userError(e));
      return false;
    } finally {
      setBusy(false);
    }
  }
  const guard = useUnsavedChanges(dirty, save, busy);
  return (
    <>
      <Drawer
        title={initial ? "Editar oferta" : "Crear oferta"}
        busy={busy}
        onClose={() => guard.request(onClose)}
        footer={
          <button
            className="button dark"
            disabled={busy || !choices.length}
            onClick={() => void save()}
          >
            {busy ? "Guardando…" : "Guardar oferta"}
          </button>
        }
      >
        <div className="sales-stack">
          {error && <p role="alert">{error}</p>}
          {initial && <p>SKU: {initial.sku}</p>}
          <Fields
            fields={[
              ...(!initial
                ? [{ key: "sku", label: "SKU", kind: "text" as const }]
                : []),
              { key: "label", label: "Nombre comercial", kind: "text" },
              { key: "price", label: "Precio demo (S/)", kind: "text" },
              { key: "stock", label: "Stock demo", kind: "number" },
              { key: "active", label: "Oferta activa", kind: "boolean" },
            ]}
            value={values}
            onChange={(v) => {
              setValues(v);
              setDirty(true);
            }}
          />
          <label className="field">
            Unidad de venta
            <select
              disabled={!!initial}
              value={String(values.unit)}
              onChange={(e) => {
                setValues((v) => ({ ...v, unit: e.target.value }));
                setDirty(true);
              }}
            >
              <option value="unit">Unidad</option>
              <option value="pair">Pareja</option>
              <option value="set">Conjunto</option>
            </select>
          </label>
          <label className="field">
            Buscar versión del catálogo
            <input value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <p>Relaciona solo versiones del mismo producto, medida y acabado.</p>
          {choices.map((c) => (
            <div
              className="sales-actions"
              key={c.variant_id + ":" + c.finish_id}
            >
              <span>
                {options.data?.find((v) => v.variant_id === c.variant_id)
                  ?.label ?? "Versión vinculada"}{" "}
                · {c.finish_id}
              </span>
              <button
                className="text-button"
                onClick={() => {
                  setChoices((a) => a.filter((x) => x !== c));
                  setDirty(true);
                }}
              >
                Quitar vínculo
              </button>
            </div>
          ))}
          <select
            aria-label="Añadir versión y acabado"
            value=""
            onChange={(e) => {
              if (!e.target.value) return;
              const [variant_id, finish_id] = e.target.value.split("|");
              setChoices((a) =>
                a.some(
                  (x) =>
                    x.variant_id === variant_id && x.finish_id === finish_id,
                )
                  ? a
                  : [...a, { variant_id, finish_id }],
              );
              setDirty(true);
            }}
          >
            <option value="">Añadir versión / acabado</option>
            {options.data?.flatMap((v) =>
              v.allowed_finishes.options.map((f) => (
                <option
                  key={v.variant_id + "|" + f.id}
                  value={v.variant_id + "|" + f.id}
                >
                  {v.label} · {f.label}
                </option>
              )),
            )}
          </select>
          {options.error && (
            <button onClick={() => void options.refetch()}>
              Reintentar versiones
            </button>
          )}
        </div>
      </Drawer>
      {guard.dialog}
    </>
  );
}
function PromotionEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial: PromotionRecord | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const auth = useAuth();
  const [id] = useState(() => initial?.id ?? crypto.randomUUID());
  const [values, setValues] = useState<Record<string, unknown>>({
    name: initial?.name ?? "",
    type: initial?.discount_type ?? "percentage",
    value:
      initial?.discount_type === "fixed"
        ? String((initial.fixed_discount_cents ?? 0) / 100)
        : String((initial?.percentage_bps ?? 1000) / 100),
    start: limaInput(initial?.starts_at ?? new Date().toISOString()),
    end: limaInput(
      initial?.ends_at ?? new Date(Date.now() + 7 * 86400000).toISOString(),
    ),
    active: initial?.active ?? true,
  });
  const [selected, setSelected] = useState<string[]>(initial?.offer_ids ?? []);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const filters = useSearchFilters(search, page, auth.user?.id ?? "");
  const choices = useQuery({
    queryKey: ["sales", "promotion-choices", filters.search, filters.page],
    queryFn: ({ signal }) =>
      salesRpc(
        "sales_promotion_choices",
        { p_search: filters.search, p_page: filters.page },
        z.object({
          count: z.number(),
          items: z.array(
            z.object({
              id: z.guid(),
              label: z.string(),
              base_price_cents: z.number(),
            }),
          ),
        }),
        signal,
      ),
  });
  async function save() {
    setBusy(true);
    setError("");
    try {
      const amount = parseMoney(String(values.value));
      if (amount < 1 || (values.type === "percentage" && amount > 9999))
        throw new Error("sales_invalid_discount");
      await salesRpc(
        "sales_save_promotion",
        {
          p_revision: initial?.revision ?? 0,
          p_data: {
            id,
            name: values.name,
            discount_type: values.type,
            percentage_bps: values.type === "percentage" ? amount : null,
            fixed_discount_cents: values.type === "fixed" ? amount : null,
            starts_at: fromLimaInput(String(values.start)),
            ends_at: fromLimaInput(String(values.end)),
            active: values.active,
            offer_ids: selected,
          },
        },
        z.guid(),
        undefined,
        auth.user?.id,
      );
      await onSaved();
      return true;
    } catch (e) {
      setError(userError(e));
      return false;
    } finally {
      setBusy(false);
    }
  }
  const guard = useUnsavedChanges(dirty, save, busy);
  return (
    <>
      <Drawer
        title={initial ? "Editar promoción" : "Crear promoción"}
        busy={busy}
        onClose={() => guard.request(onClose)}
        footer={
          <button
            className="button dark"
            disabled={busy || !selected.length}
            onClick={() => void save()}
          >
            Guardar promoción
          </button>
        }
      >
        <div className="sales-stack">
          {error && <p role="alert">{error}</p>}
          <Fields
            fields={[
              { key: "name", label: "Nombre", kind: "text" },
              {
                key: "value",
                label:
                  values.type === "percentage"
                    ? "Porcentaje (%)"
                    : "Descuento por unidad (S/)",
                kind: "text",
              },
              { key: "active", label: "Promoción activa", kind: "boolean" },
            ]}
            value={values}
            onChange={(v) => {
              setValues(v);
              setDirty(true);
            }}
          />
          <label className="field">
            Tipo
            <select
              value={String(values.type)}
              onChange={(e) => {
                setValues((v) => ({ ...v, type: e.target.value }));
                setDirty(true);
              }}
            >
              <option value="percentage">Porcentaje</option>
              <option value="fixed">Importe fijo</option>
            </select>
          </label>
          {[
            ["start", "Desde (hora de Lima)"],
            ["end", "Hasta (hora de Lima)"],
          ].map(([key, label]) => (
            <label className="field" key={key}>
              {label}
              <input
                type="datetime-local"
                value={String(values[key])}
                onChange={(e) => {
                  setValues((v) => ({ ...v, [key]: e.target.value }));
                  setDirty(true);
                }}
              />
            </label>
          ))}
          <label className="field">
            Buscar ofertas
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
          </label>
          <p>{selected.length} ofertas seleccionadas</p>
          {choices.data?.items.map((o) => (
            <label className="check-label" key={o.id}>
              <input
                type="checkbox"
                checked={selected.includes(o.id)}
                onChange={(e) => {
                  setSelected((a) =>
                    e.target.checked
                      ? [...a, o.id]
                      : a.filter((x) => x !== o.id),
                  );
                  setDirty(true);
                }}
              />
              {o.label}
            </label>
          ))}
          <div className="sales-actions">
            <button disabled={!page} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </button>
            <button
              disabled={(page + 1) * 25 >= (choices.data?.count ?? 0)}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </button>
          </div>
        </div>
      </Drawer>
      {guard.dialog}
    </>
  );
}
