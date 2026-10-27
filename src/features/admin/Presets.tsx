import { SelectableRow } from "./SelectableRow";
import { useSearchParams } from "react-router-dom";
import { useSearchFilters } from "./useSearchFilters";
import { useAdminState } from "./workspace";
import { getPresetPreview, readPresetPreviewSource } from "../bike-preview/api";
import { useState, useEffect, useId, useRef, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Plus, Search, Trash2 } from "lucide-react";
import { presetSchema } from "../catalog/model/presets";
import { usePresetBrands, usePresetOptions } from "./preset-api";
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
import { adminStaleTime } from "./api";
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
  const [params, setParams] = useSearchParams();
  const detailRequest = useRef(0);
  useEffect(
    () => () => {
      detailRequest.current++;
    },
    [],
  );
  const auth = useAuth();
  const [search, setSearch] = useAdminState("presets", "search", "");
  const [page, setPage] = useAdminState("presets", "page", 0);
  const filters = useSearchFilters(search, page);
  const [open, setOpen] = useState<Preset | null>(null);
  const [error, setError] = useState("");
  const query = useQuery({
    queryKey: ["admin-presets", auth.user!.id, filters.search, filters.page],
    staleTime: adminStaleTime,
    queryFn: async ({ signal }) => {
      const { data, error } = await requireSupabase()
        .rpc("admin_preset_page", {
          p_search: filters.search,
          p_page: filters.page,
        })
        .abortSignal(signal);
      if (error) throw error;
      return z
        .object({
          count: z.number(),
          items: z.array(
            z.object({
              id: z.uuid(),
              name: z.string(),
              label: z.string(),
              kind: z.enum(["factory", "example"]),
              published: z.boolean(),
              selectable: z.boolean(),
            }),
          ),
        })
        .parse(data);
    },
  });
  const options = usePresetBrands();
  const brands = { data: options.data?.brands };
  function create() {
    detailRequest.current++;
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
  const rows = query.data?.items;
  async function load(id: string) {
    const request = ++detailRequest.current;
    try {
      const { data, error } = await requireSupabase().rpc(
        "admin_preset_detail",
        { p_id: id },
      );
      if (error) throw error;
      if (request !== detailRequest.current) return;
      setOpen(presetSchema.parse(data));
      setParams(
        (previous) => {
          previous.set("detail", id);
          return previous;
        },
        { replace: true },
      );
    } catch (e) {
      if (request === detailRequest.current) setError(userError(e));
    }
  }
  const detailId = params.get("detail");
  useEffect(() => {
    if (!detailId) {
      detailRequest.current++;
      setOpen(null);
    } else if (open?.id !== detailId) void load(detailId);
  }, [detailId]);
  return (
    <>
      <div className="admin-toolbar">
        <label className="search-input">
          <Search size={16} />
          <input
            aria-label="Buscar bicicleta de referencia"
            maxLength={150}
            placeholder="Buscar bicicleta…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
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
                <SelectableRow key={p.id} selected={open?.id === p.id} onSelect={() => void load(p.id)}>
                  <td>
                    <button
                      className="row-button"
                      onClick={() => void load(p.id)}
                    >
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
                </SelectableRow>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {query.data && (
        <div className="pagination">
          <button
            className="button outline"
            disabled={!page}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </button>
          <span>{page + 1}</span>
          <button
            className="button outline"
            disabled={(page + 1) * 25 >= query.data.count}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
      {open && (
        <PresetEditor
          key={open.id}
          initial={open}
          brands={brands.data ?? []}
          onClose={() => {
            detailRequest.current++;
            setOpen(null);
            setParams(
              (previous) => {
                previous.delete("detail");
                return previous;
              },
              { replace: true },
            );
          }}
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
  const formId = useId();
  const auth = useAuth();
  const cache = useQueryClient();
  const [value, setValue] = useState(initial);
  const [baseline, setBaseline] = useState(JSON.stringify(initial));
  const [expected, setExpected] = useState<Preset | null>(
    initial.name ? initial : null,
  );
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
  const readOnly =
    value.published && !auth.permissions.includes("presets.publish");
  const dirty = JSON.stringify(value) !== baseline;
  const guard = useUnsavedChanges(dirty, () => save(false), busy);
  function updateItem(next: BuildItem) {
    setValue((v) => ({
      ...v,
      items: [...v.items.filter((i) => i.slot !== slot), next],
    }));
  }
  async function save(publish: boolean, selectable?: boolean) {
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
      const { data: savedId, error } = await requireSupabase().rpc(
        "save_admin_preset",
        {
          p_data: {
            ...header,
            published: value.published || publish,
            ...(selectable === undefined ? {} : { selectable }),
          },
          p_items: items,
          p_expected: expected,
        },
      );
      if (error) throw error;
      if (value.published || publish)
        void readPresetPreviewSource(savedId)
          .then((configuration) =>
            getPresetPreview(savedId, configuration, true),
          )
          .then(() =>
            cache.invalidateQueries({ queryKey: ["preset-preview", savedId] }),
          )
          .catch(() => {});
      const saved = { ...value, published: value.published || publish };
      setValue(saved);
      setBaseline(JSON.stringify(saved));
      const { data: confirmed, error: confirmationError } =
        await requireSupabase().rpc("admin_preset_detail", { p_id: savedId });
      if (confirmationError) throw confirmationError;
      const confirmedPreset = presetSchema.parse(confirmed);
      setExpected(confirmedPreset);
      setValue(confirmedPreset);
      setBaseline(JSON.stringify(confirmedPreset));
      setMessage(
        selectable === false
          ? "Prearmada retirada de nuevas selecciones."
          : selectable === true
            ? "Prearmada disponible para nuevos montajes."
            : publish
              ? "Publicación confirmada."
              : "Cambios guardados.",
      );
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["admin-presets", auth.user!.id] }),
        ...[
          "presets",
          "preset-detail",
          "preset-preview-sources",
          "preset-preview-source",
          "preset-preview-source-batch",
          "preset-preview",
        ].map((key) => cache.invalidateQueries({ queryKey: [key] })),
      ]);
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
        busy={busy}
        footer={
          <>
            <button
              type="button"
              className="button outline"
              disabled={busy}
              onClick={() => guard.request(onClose)}
            >
              Cancelar
            </button>
            <div className="panel-save-actions">
              <button
                className="button outline"
                type="submit"
                form={formId}
                disabled={
                  busy ||
                  !dirty ||
                  (value.published &&
                    !auth.permissions.includes("presets.publish"))
                }
              >
                {value.published ? "Guardar cambios" : "Guardar borrador"}
              </button>
              {value.published &&
                auth.permissions.includes("presets.publish") && (
                  <button
                    type="button"
                    className="button outline"
                    disabled={busy || dirty}
                    onClick={() => void save(false, !value.selectable)}
                  >
                    {value.selectable ? "Retirar" : "Volver a ofrecer"}
                  </button>
                )}
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
          </>
        }
        title="Bicicleta de referencia"
        onClose={() => guard.request(onClose)}
      >
        <form
          onChange={() => setMessage("")}
          id={formId}
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            void save(false);
          }}
        >
          <fieldset disabled={busy || readOnly}>
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
                onChange={(e) =>
                  setValue({ ...value, brand_id: e.target.value })
                }
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
            {value.published ? (
              <p className="muted">
                {value.selectable
                  ? "Disponible para nuevos montajes"
                  : "Retirada de nuevas selecciones"}
              </p>
            ) : (
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
            )}
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
          </fieldset>
        </form>
      </Drawer>
      {guard.dialog}
    </>
  );
}
