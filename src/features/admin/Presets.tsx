import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Plus, Search, Trash2 } from "lucide-react";
import { presetSchema } from "../catalog/model/presets";
import { usePresetOptions } from "./preset-api";
import { useAuth } from "../auth/provider";
import {
  slots,
  slotLabels,
  slotCategories,
  type BuildItem,
  type Slot,
} from "../configurator/model";
import { requireSupabase, userError } from "../../lib/supabase";
import { Drawer } from "../../components/ui/Drawer";
import { useUnsavedChanges } from "../../components/ui/UnsavedChanges";
import { Loading, Notice, Empty } from "../../components/ui/Feedback";
import { Fields, sourceFields } from "./Fields";
type Preset = z.infer<typeof presetSchema>;
function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
export default function Presets() {
  const auth = useAuth();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<Preset | null>(null);
  const [error, setError] = useState("");
  const query = useQuery({
    queryKey: ["admin-presets", auth.user!.id],
    queryFn: async () => {
      const { data, error } = await requireSupabase().rpc("admin_presets");
      if (error) throw error;
      return z.array(presetSchema).parse(data);
    },
  });
  const options = usePresetOptions();
  const brands = { data: options.data?.brands };
  function create() {
    if (!brands.data?.length) {
      setError("Crea una marca antes de añadir bicicletas de referencia.");
      return;
    }
    setOpen({
      id: crypto.randomUUID(),
      name: "",
      slug: "",
      brand_id: brands.data[0].id,
      family_key: "",
      label: "",
      model_year: null,
      image_key: null,
      kind: "example",
      sources: [],
      published: false,
      selectable: true,
      items: [],
    });
  }
  const rows = query.data?.filter((p) =>
    (p.name + " " + p.label).toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="admin-toolbar">
        <label className="search-input">
          <Search size={16} />
          <input
            aria-label="Buscar bicicleta de referencia"
            placeholder="Buscar bicicleta…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <button
          className="button dark"
          disabled={options.isPending || !!options.error}
          onClick={create}
        >
          <Plus size={16} /> Bicicleta de referencia
        </button>
      </div>
      {options.error && (
        <Notice onRetry={() => void options.refetch()}>
          No se pudieron cargar las marcas y las piezas.
        </Notice>
      )}
      {error && <Notice>{error}</Notice>}
      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <Notice onRetry={() => void query.refetch()}>
          No se pudieron cargar las bicicletas.
        </Notice>
      ) : !rows?.length ? (
        <Empty title="Sin bicicletas en esta selección" />
      ) : (
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Bicicleta</th>
                <th>Versión</th>
                <th>Tipo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>
                    <button className="row-button" onClick={() => setOpen(p)}>
                      {p.name}
                    </button>
                  </td>
                  <td>{p.label}</td>
                  <td>{p.kind === "factory" ? "Fábrica" : "Ejemplo ATLAS"}</td>
                  <td>
                    {p.published
                      ? p.selectable
                        ? "Publicada"
                        : "Retirada"
                      : "Borrador"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open && (
        <PresetEditor
          key={open.id}
          initial={open}
          brands={brands.data ?? []}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}
function PresetEditor({
  initial,
  brands,
  onClose,
}: {
  initial: Preset;
  brands: { id: string; name: string }[];
  onClose: () => void;
}) {
  const auth = useAuth();
  const cache = useQueryClient();
  const [value, setValue] = useState(initial);
  const [baseline, setBaseline] = useState(JSON.stringify(initial));
  const [slot, setSlot] = useState<Slot>("frame");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const candidates = usePresetOptions(slotCategories[slot], search, page);
  const details = usePresetOptions(
    undefined,
    "",
    0,
    value.items.map((i) => i.variantId),
  );
  const item = value.items.find((i) => i.slot === slot);
  const selected = details.data?.components
    .flatMap((c) => c.component_variants.map((v) => ({ ...v, component: c })))
    .find((v) => v.id === item?.variantId);
  const guard = useUnsavedChanges(
    JSON.stringify(value) !== baseline,
    () => save(false),
    busy,
  );
  function updateItem(next: BuildItem) {
    setValue((v) => ({
      ...v,
      items: [...v.items.filter((i) => i.slot !== slot), next],
    }));
  }
  async function save(publish: boolean) {
    if (busy) return false;
    setBusy(true);
    setError("");
    try {
      if (
        !value.name.trim() ||
        !value.label.trim() ||
        !value.slug ||
        !value.family_key
      ) {
        setError(
          "Completa el nombre, la versión y la familia de la bicicleta.",
        );
        return false;
      }
      presetSchema.parse(value);
      const { items, ...header } = value;
      const { error } = await requireSupabase().rpc("save_preset", {
        p_data: { ...header, published: value.published || publish },
        p_items: items,
      });
      if (error) throw error;
      const saved = { ...value, published: value.published || publish };
      setValue(saved);
      setBaseline(JSON.stringify(saved));
      setMessage(publish ? "Publicación confirmada." : "Cambios guardados.");
      await cache.invalidateQueries({
        queryKey: ["admin-presets", auth.user!.id],
      });
      await cache.invalidateQueries({ queryKey: ["presets"] });
      await cache.invalidateQueries({ queryKey: ["preset-detail"] });
      return true;
    } catch (e) {
      setError(
        e instanceof z.ZodError
          ? "Revisa los datos y los enlaces de las fuentes."
          : userError(e),
      );
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Drawer
        title="Bicicleta de referencia"
        onClose={() => guard.request(onClose)}
      >
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            void save(false);
          }}
        >
          <label className="field">
            Nombre
            <input
              required
              maxLength={150}
              value={value.name}
              onChange={(e) =>
                setValue({
                  ...value,
                  name: e.target.value,
                  slug: value.published
                    ? value.slug
                    : slugify(e.target.value + " " + value.label),
                  family_key: value.published
                    ? value.family_key
                    : slugify(e.target.value),
                })
              }
            />
          </label>
          <label className="field">
            Versión / talla
            <input
              required
              value={value.label}
              onChange={(e) =>
                setValue({
                  ...value,
                  label: e.target.value,
                  slug: value.published
                    ? value.slug
                    : slugify(value.name + " " + e.target.value),
                })
              }
            />
          </label>
          <label className="field">
            Familia
            <input
              required
              value={value.family_key}
              onChange={(e) =>
                setValue({ ...value, family_key: slugify(e.target.value) })
              }
            />
          </label>
          <label className="field">
            Enlace
            <input
              required
              value={value.slug}
              onChange={(e) =>
                setValue({ ...value, slug: slugify(e.target.value) })
              }
            />
          </label>
          <label className="field">
            Marca
            <select
              value={value.brand_id}
              onChange={(e) => setValue({ ...value, brand_id: e.target.value })}
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Tipo
            <select
              value={value.kind}
              onChange={(e) =>
                setValue({ ...value, kind: e.target.value as Preset["kind"] })
              }
            >
              <option value="example">Ejemplo ATLAS</option>
              <option value="factory">Montaje de fábrica</option>
            </select>
          </label>
          <label className="field">
            Año
            <input
              type="number"
              min={1990}
              max={2200}
              value={value.model_year ?? ""}
              onChange={(e) =>
                setValue({
                  ...value,
                  model_year: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </label>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={value.selectable}
              onChange={(e) =>
                setValue({ ...value, selectable: e.target.checked })
              }
            />{" "}
            Disponible para nuevos montajes
          </label>
          <Fields
            fields={sourceFields}
            value={{ sources: value.sources }}
            onChange={(v) =>
              setValue({ ...value, sources: v.sources as Preset["sources"] })
            }
          />
          <h3>Montaje</h3>
          <label className="field">
            Pieza
            <select
              value={slot}
              onChange={(e) => {
                setSlot(e.target.value as Slot);
                setSearch("");
                setPage(0);
              }}
            >
              {slots.map((s) => (
                <option key={s} value={s}>
                  {value.items.some((i) => i.slot === s) ? "✓ " : ""}
                  {slotLabels[s]}
                </option>
              ))}
            </select>
          </label>
          {selected && item && (
            <section className="selected-piece">
              <p>{selected.component.brands.name}</p>
              <h4>
                {selected.component.name} · {selected.label}
              </h4>
              <label className="field">
                Acabado
                <select
                  value={item.finishId}
                  onChange={(e) =>
                    updateItem({
                      ...item,
                      finishId: e.target.value,
                      customColor: null,
                    })
                  }
                >
                  {selected.allowed_finishes.options.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>
              {selected.allowed_finishes.custom_color_enabled && (
                <label className="color-field">
                  Color personalizado
                  <input
                    type="color"
                    value={
                      item.customColor ??
                      selected.allowed_finishes.options.find(
                        (f) => f.id === item.finishId,
                      )?.material.color ??
                      "#252a25"
                    }
                    onChange={(e) =>
                      updateItem({ ...item, customColor: e.target.value })
                    }
                  />
                </label>
              )}
              <button
                type="button"
                className="text-button danger"
                onClick={() =>
                  setValue({
                    ...value,
                    items: value.items.filter((i) => i.slot !== slot),
                  })
                }
              >
                <Trash2 size={14} /> Quitar pieza
              </button>
            </section>
          )}
          <label className="field">
            Buscar alternativa
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
          </label>
          {candidates.isPending ? (
            <Loading />
          ) : candidates.error ? (
            <Notice>No se pudieron cargar las piezas.</Notice>
          ) : (
            <div className="piece-options">
              {candidates.data.components.flatMap((c) =>
                c.component_variants.map((v) => (
                  <button
                    type="button"
                    key={v.id}
                    disabled={v.id === item?.variantId}
                    onClick={() =>
                      updateItem({
                        slot,
                        variantId: v.id,
                        finishId: v.allowed_finishes.default_finish_id,
                        customColor: null,
                      })
                    }
                  >
                    <span>
                      <small>{c.brands.name}</small>
                      <strong>{c.name}</strong>
                      <span>
                        {v.label}
                        {!v.published
                          ? " · Borrador"
                          : !v.selectable
                            ? " · Retirada"
                            : ""}
                      </span>
                    </span>
                  </button>
                )),
              )}
            </div>
          )}
          <div className="pagination">
            <button
              type="button"
              className="button outline"
              disabled={!page}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </button>
            <span>{page + 1}</span>
            <button
              type="button"
              className="button outline"
              disabled={
                !candidates.data || (page + 1) * 24 >= candidates.data.count
              }
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </button>
          </div>
          {error && <Notice>{error}</Notice>}
          {message && (
            <p className="success-notice" role="status">
              {message}
            </p>
          )}
          <div className="panel-save-actions">
            <button
              className="button outline"
              type="submit"
              disabled={
                busy ||
                (value.published &&
                  !auth.permissions.includes("presets.publish"))
              }
            >
              {value.published ? "Guardar cambios" : "Guardar borrador"}
            </button>
            {!value.published &&
              auth.permissions.includes("presets.publish") && (
                <button
                  type="button"
                  className="button dark"
                  disabled={busy}
                  onClick={() => void save(true)}
                >
                  Publicar
                </button>
              )}
          </div>
        </form>
      </Drawer>
      {guard.dialog}
    </>
  );
}
