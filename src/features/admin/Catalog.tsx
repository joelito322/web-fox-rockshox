import { SelectableRow } from "./SelectableRow";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAdminState } from "./workspace";
import { useState, useId, useEffect, useRef, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Plus, Search } from "lucide-react";
import { useAuth } from "../auth/provider";
import {
  categories,
  categoryLabels,
  finishesSchema,
  sourceSchema,
  variantSchema,
  type Category,
} from "../catalog/model";
import {
  specificationFields,
  specificationSchemas,
} from "../catalog/model/specifications";
import { requireSupabase, userError } from "../../lib/supabase";
import { Drawer } from "../../components/ui/Drawer";
import { useUnsavedChanges } from "../../components/ui/UnsavedChanges";
import { Loading, Notice, Empty } from "../../components/ui/Feedback";
import { Fields, sourceFields } from "./Fields";
import { adminStaleTime } from "./api";
import { useSearchFilters } from "./useSearchFilters";
const editableVariantSchema = variantSchema.omit({ visual_assets: true });
const brandSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  region: z.string().nullable(),
  published: z.boolean(),
});
const modelSchema = z.object({
  id: z.uuid(),
  brand_id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  category: z.enum(categories),
  description: z.string(),
  technical_notes: z.string().nullable(),
  image_key: z.string().nullable(),
  disciplines: z.array(z.string()),
  sources: z.array(sourceSchema),
  published: z.boolean(),
  brands: z.object({ name: z.string() }),
  component_variants: z.array(editableVariantSchema),
  variant_count: z.number().optional(),
});
const resultSchema = z.object({
  brands: z.array(brandSchema),
  assets: z.array(
    z.object({
      id: z.uuid(),
      kind: z.string(),
      reference_notes: z.string().nullable(),
      published: z.boolean(),
    }),
  ),
  components: z.array(modelSchema),
});
type Model = z.infer<typeof modelSchema>;
type Brand = z.infer<typeof brandSchema>;
type EditableVariant = z.infer<typeof editableVariantSchema>;
function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
function visualLabel(notes: string | null | undefined) {
  return (
    notes?.split(" · Aproximación")[0].split(". ")[0] ||
    "Representación de componente"
  );
}
const draftFinishes = {
  default_finish_id: "factory",
  custom_color_enabled: false,
  options: [
    { id: "factory", label: "De fábrica", material: { color: "#252a25" } },
  ],
};
export default function Catalog({
  view = "component",
}: {
  view?: "component" | "brand" | "asset";
}) {
  const [params, setParams] = useSearchParams();
  const detailRequest = useRef(0);
  useEffect(
    () => () => {
      detailRequest.current++;
    },
    [],
  );
  const navigate = useNavigate();
  const formId = useId();
  const auth = useAuth();
  const cache = useQueryClient();
  const [category, setCategory] = useAdminState<Category | "">(
    view,
    "category",
    "",
  );
  const [search, setSearch] = useAdminState<string>(view, "search", "");
  const [page, setPage] = useAdminState<number>(view, "page", 0);
  const [panel, setPanel] = useState<"component" | "variant" | "brand" | null>(
    null,
  );
  const [model, setModel] = useState<Model | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [variant, setVariant] = useState<EditableVariant | null>(null);
  const [baseline, setBaseline] = useState("");
  const [selected, setSelected] = useAdminState(view, "selected", "");
  const [editorTab, setEditorTab] = useState("general");
  const [expected, setExpected] = useState<Record<string, unknown> | null>(
    null,
  );
  function editable(record: Model | Brand | EditableVariant) {
    const {
      brands: _brands,
      component_variants: _variants,
      variant_count: _count,
      ...rest
    } = record as Model;
    return rest;
  }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fieldMessages = (prefix: string) =>
    Object.fromEntries(
      Object.entries(fieldErrors)
        .filter(([key]) => key.startsWith(prefix + "."))
        .map(([key, value]) => [key.slice(prefix.length + 1), value]),
    );
  function validateFields<T>(
    schema: z.ZodType<T>,
    data: unknown,
    prefix: string,
  ) {
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      setFieldErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [
            [prefix, ...issue.path].join("."),
            issue.code === "too_small"
              ? "El valor es menor al permitido."
              : issue.code === "too_big"
                ? "El valor supera el límite permitido."
                : "Revisa este valor y su formato.",
          ]),
        ),
      );
      throw parsed.error;
    }
    return parsed.data;
  }
  const [message, setMessage] = useState("");
  const [brandFilter, setBrandFilter] = useAdminState(
    view,
    "brand",
    params.get("brand") ?? "",
  );
  const [status, setStatus] = useAdminState(view, "status", "");
  const [resource, setResource] = useState<Record<string, unknown> | null>(
    null,
  );
  const [assetSearch, setAssetSearch] = useState("");
  const [assetPage, setAssetPage] = useState(0);
  const assetFilters = useSearchFilters(assetSearch, assetPage);
  const assetOptions = useQuery({
    queryKey: [
      "admin-assets-options",
      auth.user!.id,
      assetFilters.search,
      assetFilters.page,
    ],
    enabled: panel === "variant",
    staleTime: adminStaleTime,
    queryFn: async ({ signal }) => {
      const { data, error } = await requireSupabase()
        .rpc("admin_catalog_page", {
          p_kind: "asset",
          p_search: assetFilters.search,
          p_page: assetFilters.page,
        })
        .abortSignal(signal);
      if (error) throw error;
      return z
        .object({ items: resultSchema.shape.assets, count: z.number() })
        .parse(data);
    },
  });
  const filters = useSearchFilters(
    search,
    page,
    `${category}:${brandFilter}:${status}`,
  );
  const query = useQuery({
    queryKey: [
      "admin-catalog",
      auth.user!.id,
      view,
      category,
      brandFilter,
      status,
      filters.search,
      filters.page,
    ],
    staleTime: adminStaleTime,
    queryFn: async ({ signal }) => {
      const { data, error } = await requireSupabase()
        .rpc("admin_catalog_page", {
          p_kind: view,
          p_brand: brandFilter || null,
          p_status: status,
          p_category: category || null,
          p_search: filters.search,
          p_page: filters.page,
        })
        .abortSignal(signal);
      if (error) throw error;
      return {
        ...resultSchema.parse({
          brands: data.brands,
          assets: [],
          components: view === "component" ? data.items : [],
        }),
        count: Number(data.count),
        brandRows:
          view === "brand" ? z.array(brandSchema).parse(data.items) : [],
        assetRows:
          view === "asset" ? resultSchema.shape.assets.parse(data.items) : [],
      };
    },
  });
  const value =
    panel === "brand" ? brand : panel === "variant" ? variant : model;
  const readOnly =
    !!value?.published && !auth.permissions.includes("catalog.publish");
  const dirty =
    !!panel &&
    (JSON.stringify(value) !== baseline ||
      (expected === null &&
        !!(panel === "variant"
          ? variant?.label.trim()
          : panel === "component"
            ? model?.name.trim()
            : brand?.name.trim())));
  const guard = useUnsavedChanges(dirty, () => save(false), busy);
  function show(
    kind: NonNullable<typeof panel>,
    record: Model | Brand | EditableVariant,
    existing = true,
  ) {
    detailRequest.current++;
    setMessage("");
    setPanel(kind);
    setSelected(record.id);
    setEditorTab("general");
    setFieldErrors({});
    setExpected(existing ? editable(record) : null);
    if (existing)
      setParams(
        (previous) => {
          previous.set(
            "detail",
            kind === "variant"
              ? (record as EditableVariant).component_id
              : record.id,
          );
          if (kind === "variant") previous.set("variant", record.id);
          else previous.delete("variant");
          return previous;
        },
        { replace: true },
      );
    setBaseline(JSON.stringify(record));
    setError("");
    if (kind === "brand") setBrand(record as Brand);
    else if (kind === "variant") setVariant(record as EditableVariant);
    else setModel(record as Model);
  }
  async function openModel(id: string, variantId?: string) {
    const request = ++detailRequest.current;
    try {
      const record = await cache.fetchQuery({
        queryKey: ["admin-detail", auth.user!.id, "component", id],
        staleTime: adminStaleTime,
        queryFn: async () => {
          const { data, error } = await requireSupabase().rpc(
            "admin_catalog_detail",
            { p_kind: "component", p_id: id },
          );
          if (error) throw error;
          return modelSchema.parse(data);
        },
      });
      if (request !== detailRequest.current) return;
      const selected = record.component_variants.find(
        (v) => v.id === variantId,
      );
      setModel(record);
      show(selected ? "variant" : "component", selected ?? record);
      setParams(
        (previous) => {
          previous.set("detail", id);
          if (selected) previous.set("variant", selected.id);
          else previous.delete("variant");
          return previous;
        },
        { replace: true },
      );
    } catch (error) {
      if (request === detailRequest.current) setError(userError(error));
    }
  }
  const detailId = params.get("detail");
  const variantId = params.get("variant");
  useEffect(() => {
    if (!detailId) {
      detailRequest.current++;
      setPanel(null);
      setResource(null);
      return;
    }
    if (view === "asset") {
      if (resource?.id !== detailId) void openAsset(detailId);
    } else if (view === "brand") {
      if (panel === "brand" && brand?.id === detailId) return;
      const request = ++detailRequest.current;
      void requireSupabase()
        .rpc("admin_catalog_detail", { p_kind: "brand", p_id: detailId })
        .then(({ data, error }) => {
          if (request !== detailRequest.current) return;
          if (error) setError(userError(error));
          else show("brand", brandSchema.parse(data));
        });
    } else if (
      !((panel === "component" && model?.id === detailId && !variantId) ||
        (panel === "variant" && variant?.id === variantId && model?.id === detailId))
    ) void openModel(detailId, variantId ?? undefined);
  }, [detailId, variantId]);
  useEffect(() => {
    const brand = params.get("brand");
    if (brand) {
      setBrandFilter(brand);
      setPage(0);
    }
  }, [params.get("brand")]);
  async function openAsset(id: string) {
    const request = ++detailRequest.current;
    try {
      const { data, error } = await requireSupabase().rpc(
        "admin_catalog_detail",
        { p_kind: "asset", p_id: id },
      );
      if (error) throw error;
      if (request !== detailRequest.current) return;
      setResource(data);
      setSelected(id);
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
  function newModel() {
    const b = query.data?.brands[0];
    if (!b) {
      setError("Crea una marca antes de añadir un componente.");
      return;
    }
    show(
      "component",
      {
        id: crypto.randomUUID(),
        brand_id: b.id,
        name: "",
        slug: "",
        category: category || "fork",
        description: "",
        technical_notes: null,
        image_key: null,
        disciplines: [],
        sources: [],
        published: false,
        brands: { name: b.name },
        component_variants: [],
      },
      false,
    );
  }
  function newVariant() {
    if (!model) return;
    show(
      "variant",
      {
        id: crypto.randomUUID(),
        component_id: model.id,
        label: "",
        model_year: null,
        generation: null,
        manufacturer_code: null,
        image_key: null,
        sources: [],
        specs_schema_version: 1,
        specs: {},
        price_reference: null,
        allowed_finishes: structuredClone(draftFinishes),
        visual_asset_id: null,
        representation: "approximate",
        published: false,
        selectable: true,
      },
      false,
    );
  }
  async function save(publish: boolean, selectable?: boolean) {
    if (!panel || !value || busy) return false;
    setFieldErrors({});
    setBusy(true);
    setError("");
    try {
      let payload: Record<string, unknown> = {
        ...value,
        published: value.published || publish,
        ...(selectable === undefined ? {} : { selectable }),
      };
      if (panel === "component" && model) {
        if (!model.name.trim() || !model.slug.trim()) {
          setError("Completa el nombre y el enlace del modelo.");
          return false;
        }
        validateFields(z.array(sourceSchema), model.sources, "sources");
        const { brands: _, component_variants: __, ...rest } = model;
        payload = { ...rest, published: model.published || publish };
      }
      if (panel === "variant" && variant && model) {
        validateFields(
          specificationSchemas[model.category],
          variant.specs,
          "specs",
        );
        validateFields(
          finishesSchema,
          variant.allowed_finishes,
          "allowed_finishes",
        );
        validateFields(z.array(sourceSchema), variant.sources, "sources");
        if (!variant.label.trim()) {
          setError("Indica la versión de la variante.");
          return false;
        }
      }
      const { data, error: failure } = await requireSupabase().rpc(
        "save_admin_catalog",
        { p_kind: panel, p_data: payload, p_expected: expected },
      );
      if (failure) throw failure;
      setBaseline(JSON.stringify({ ...value, published: payload.published }));
      setExpected(editable({ ...value, published: !!payload.published }));
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["admin-catalog", auth.user!.id] }),
        cache.invalidateQueries({ queryKey: ["admin-detail", auth.user!.id] }),
        ...[
          "catalog",
          "component",
          "catalog-facets",
          "preset-brands",
          "presets",
          "preset-detail",
          "preset-options",
        ].map((key) => cache.invalidateQueries({ queryKey: [key] })),
      ]);
      if (panel === "component" && model) {
        setModel({ ...model, published: !!payload.published });
        if (data !== model.id) throw new Error("unexpected_record");
      }
      if (panel === "variant" && variant)
        setVariant({ ...variant, published: !!payload.published });
      if (panel === "brand" && brand)
        setBrand({ ...brand, published: !!payload.published });
      const { data: fresh, error: readError } = await requireSupabase().rpc(
        "admin_catalog_detail",
        {
          p_kind: panel === "brand" ? "brand" : "component",
          p_id: panel === "brand" ? value.id : model!.id,
        },
      );
      if (readError) throw readError;
      const confirmed =
        panel === "brand" ? brandSchema.parse(fresh) : modelSchema.parse(fresh);
      if (panel !== "brand") setModel(confirmed as Model);
      const record =
        panel === "variant"
          ? (confirmed as Model).component_variants.find(
              (v) => v.id === value.id,
            )!
          : confirmed;
      setExpected(editable(record));
      setBaseline(JSON.stringify(record));
      if (panel === "brand") setBrand(record as Brand);
      else if (panel === "variant") setVariant(record as EditableVariant);
      setMessage(
        selectable === false
          ? "Variante retirada de nuevas selecciones."
          : selectable === true
            ? "Variante disponible para nuevos montajes."
            : publish
              ? "Publicación confirmada."
              : "Cambios guardados.",
      );
      return true;
    } catch (e) {
      setError(
        e instanceof z.ZodError
          ? "Revisa las medidas, acabados y fuentes. Los enlaces deben ser completos y las medidas válidas."
          : userError(e),
      );
      return false;
    } finally {
      setBusy(false);
    }
  }
  const close = () =>
    guard.request(() => {
      detailRequest.current++;
      setPanel(null);
      setParams(
        (previous) => {
          previous.delete("detail");
          previous.delete("variant");
          return previous;
        },
        { replace: true },
      );
    });
  return (
    <>
      <div className="admin-toolbar">
        {view === "component" && (
          <select
            aria-label="Filtrar por marca"
            value={brandFilter}
            onChange={(e) => {
              setBrandFilter(e.target.value);
              setPage(0);
            }}
          >
            <option value="">Todas las marcas</option>
            {query.data?.brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}
        <select
          aria-label="Filtrar por estado"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0);
          }}
        >
          <option value="">Todos los estados</option>
          <option value="published">Publicado</option>
          <option value="draft">Borrador</option>
        </select>
        <div className="inline-actions">
          <select
            hidden={view !== "component"}
            aria-label="Categoría"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as Category | "");
              setPage(0);
            }}
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {categoryLabels[c]}
              </option>
            ))}
          </select>
          <label className="search-input">
            <Search size={16} />
            <input
              aria-label={
                view === "component"
                  ? "Buscar modelo"
                  : view === "brand"
                    ? "Buscar marca"
                    : "Buscar recurso"
              }
              value={search}
              placeholder={
                view === "component"
                  ? "Buscar modelo…"
                  : view === "brand"
                    ? "Buscar marca…"
                    : "Buscar recurso…"
              }
              maxLength={150}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
          </label>
        </div>
        <div className="inline-actions" hidden={view === "asset"}>
          <button
            className="button outline"
            onClick={() =>
              guard.request(() =>
                show(
                  "brand",
                  {
                    id: crypto.randomUUID(),
                    name: "",
                    slug: "",
                    region: null,
                    published: false,
                  },
                  false,
                ),
              )
            }
          >
            Crear marca
          </button>
          <button
            className="button dark"
            hidden={view !== "component"}
            disabled={busy || query.isFetching}
            onClick={() => guard.request(newModel)}
          >
            <Plus size={15} /> Componente
          </button>
        </div>
      </div>
      {message && !panel && (
        <p className="success-notice" role="status">
          {message}
        </p>
      )}
      {view !== "component" && query.data && (
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{view === "brand" ? "Marca" : "Representación"}</th>
                <th>Estado</th>
                {view === "asset" && <th>Tipo</th>}
              </tr>
            </thead>
            <tbody>
              {view === "brand"
                ? query.data.brandRows.map((b) => (
                    <SelectableRow
                      key={b.id}
                      selected={selected === b.id}
                      onSelect={() => guard.request(() => show("brand", b))}
                    >
                      <td>
                        <button
                          className="row-button"
                          onClick={() => guard.request(() => show("brand", b))}
                        >
                          {b.name}
                        </button>
                      </td>
                      <td>{b.published ? "Publicado" : "Borrador"}</td>
                    </SelectableRow>
                  ))
                : query.data.assetRows.map((a) => (
                    <SelectableRow
                      key={a.id}
                      selected={selected === a.id}
                      onSelect={() => void openAsset(a.id)}
                    >
                      <td>
                        <button
                          className="row-button"
                          onClick={() => void openAsset(a.id)}
                        >
                          {visualLabel(a.reference_notes)}
                        </button>
                      </td>
                      <td>{a.published ? "Publicado" : "Borrador"}</td>
                      <td>
                        {a.kind === "glb"
                          ? "Modelo importado"
                          : "Modelo paramétrico"}
                      </td>
                    </SelectableRow>
                  ))}
            </tbody>
          </table>
        </div>
      )}
      {!panel && error && <Notice>{error}</Notice>}
      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <Notice onRetry={() => void query.refetch()}>
          No se pudo cargar el catálogo.
        </Notice>
      ) : query.data.count === 0 ? (
        <Empty title="Sin componentes en esta selección" />
      ) : view === "component" ? (
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Modelo</th>
                <th>Marca</th>
                <th>Categoría</th>
                <th>Variantes</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {query.data.components.map((c) => (
                <SelectableRow
                  key={c.id}
                  selected={selected === c.id}
                  onSelect={() =>
                    guard.request(() => {
                      void openModel(c.id);
                    })
                  }
                >
                  <td>
                    <button
                      className="row-button"
                      onClick={() => guard.request(() => void openModel(c.id))}
                    >
                      {c.name}
                    </button>
                  </td>
                  <td>
                    <button
                      className="text-button"
                      onClick={() =>
                        guard.request(() =>
                          navigate(`/administracion/marcas?detail=${c.brand_id}`),
                        )
                      }
                    >
                      {c.brands.name}
                    </button>
                  </td>
                  <td>{categoryLabels[c.category]}</td>
                  <td>{c.variant_count ?? c.component_variants.length}</td>
                  <td>{c.published ? "Publicado" : "Borrador"}</td>
                </SelectableRow>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
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
          disabled={(page + 1) * 25 >= (query.data?.count ?? 0)}
          onClick={() => setPage((p) => p + 1)}
        >
          Siguiente
        </button>
      </div>
      {resource && (
        <Drawer
          title="Representación 3D"
          onClose={() => {
            setResource(null);
            setParams(
              (previous) => {
                previous.delete("detail");
                return previous;
              },
              { replace: true },
            );
          }}
        >
          <h3>{visualLabel(resource.reference_notes as string | null)}</h3>
          <dl className="spec-list">
            <div>
              <dt>Tipo</dt>
              <dd>
                {resource.kind === "glb"
                  ? "Modelo importado"
                  : "Modelo paramétrico"}
              </dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>{resource.published ? "Publicado" : "Borrador"}</dd>
            </div>
          </dl>
          {typeof resource.reference_notes === "string" && (
            <details className="form-group">
              <summary>Notas de representación</summary>
              <p>{String(resource.reference_notes)}</p>
            </details>
          )}
          <h3>Variantes relacionadas</h3>
          {(
            resource.variants as {
              id: string;
              label: string;
              component_name: string;
              component_id: string;
            }[]
          ).map((v) => (
            <p key={v.id}>
              <button
                className="text-button"
                onClick={() =>
                  navigate(
                    `/administracion/catalogo?detail=${v.component_id}&variant=${v.id}`,
                  )
                }
              >
                {v.component_name} · {v.label}
              </button>
            </p>
          ))}
        </Drawer>
      )}
      {panel && value && (
        <Drawer
          busy={busy}
          footer={
            <>
              <button
                type="button"
                className="button outline"
                disabled={busy}
                onClick={close}
              >
                Cancelar
              </button>
              <div className="panel-save-actions">
                <button
                  className="button outline"
                  disabled={
                    busy ||
                    !dirty ||
                    (value.published &&
                      !auth.permissions.includes("catalog.publish"))
                  }
                  type="submit"
                  form={formId}
                >
                  {value.published ? "Guardar cambios" : "Guardar borrador"}
                </button>
                {panel === "variant" &&
                  variant?.published &&
                  auth.permissions.includes("catalog.publish") && (
                    <button
                      type="button"
                      className="button outline"
                      disabled={busy || dirty}
                      onClick={() => void save(false, !variant.selectable)}
                    >
                      {variant.selectable ? "Retirar" : "Volver a ofrecer"}
                    </button>
                  )}
                {!value.published &&
                  auth.permissions.includes("catalog.publish") && (
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
          title={
            panel === "brand"
              ? "Marca"
              : panel === "variant"
                ? "Variante"
                : "Componente"
          }
          onClose={close}
        >
          <form
            onChange={() => setMessage("")}
            id={formId}
            onInvalidCapture={() => setEditorTab("general")}
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              void save(false);
            }}
          >
            <fieldset disabled={busy}>
              {readOnly && (
                <p className="muted">
                  Este registro publicado se muestra en lectura.
                </p>
              )}
              {panel === "variant" && model && (
                <button
                  type="button"
                  className="back-link"
                  onClick={() =>
                    guard.request(() => {
                      void openModel(model.id);
                    })
                  }
                >
                  ← {model.name}
                </button>
              )}
              {panel === "brand" && brand && (
                <>
                  <label className="field">
                    Nombre
                    <input
                      disabled={readOnly}
                      required
                      value={brand.name}
                      onChange={(e) =>
                        setBrand({
                          ...brand,
                          name: e.target.value,
                          slug: brand.published
                            ? brand.slug
                            : slugify(e.target.value),
                        })
                      }
                    />
                  </label>
                  <label className="field">
                    Enlace
                    <input
                      disabled={readOnly}
                      required
                      value={brand.slug}
                      onChange={(e) =>
                        setBrand({ ...brand, slug: slugify(e.target.value) })
                      }
                    />
                  </label>
                  <label className="field">
                    Región
                    <input
                      disabled={readOnly}
                      value={brand.region ?? ""}
                      onChange={(e) =>
                        setBrand({ ...brand, region: e.target.value || null })
                      }
                    />
                  </label>
                </>
              )}
              {panel === "component" && model && (
                <>
                  <nav
                    className="admin-panel-tabs"
                    aria-label="Secciones del componente"
                  >
                    {[
                      ["general", "General"],
                      ["variants", "Variantes"],
                      ["sources", "Fuentes"],
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={editorTab === key}
                        disabled={key === "variants" && expected === null}
                        onClick={() => setEditorTab(key)}
                      >
                        {label}
                      </button>
                    ))}
                  </nav>
                  <div hidden={editorTab !== "general"}>
                    <label className="field">
                      Nombre
                      <input
                        disabled={readOnly}
                        required
                        maxLength={150}
                        value={model.name}
                        onChange={(e) =>
                          setModel({
                            ...model,
                            name: e.target.value,
                            slug: model.published
                              ? model.slug
                              : slugify(e.target.value),
                          })
                        }
                      />
                    </label>
                    <label className="field">
                      Enlace
                      <input
                        disabled={readOnly}
                        required
                        value={model.slug}
                        onChange={(e) =>
                          setModel({ ...model, slug: slugify(e.target.value) })
                        }
                      />
                    </label>
                    <label className="field">
                      Marca
                      <select
                        value={model.brand_id}
                        disabled={readOnly || model.published}
                        onChange={(e) =>
                          setModel({ ...model, brand_id: e.target.value })
                        }
                      >
                        {query.data?.brands.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      Categoría
                      <select
                        value={model.category}
                        disabled={
                          readOnly ||
                          model.published ||
                          !!model.component_variants.length
                        }
                        onChange={(e) =>
                          setModel({
                            ...model,
                            category: e.target.value as Category,
                          })
                        }
                      >
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {categoryLabels[c]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      Descripción
                      <textarea
                        disabled={readOnly}
                        value={model.description}
                        onChange={(e) =>
                          setModel({ ...model, description: e.target.value })
                        }
                      />
                    </label>
                    <div className="inline-actions">
                      {[
                        ["enduro", "Enduro"],
                        ["downhill", "Descenso"],
                      ].map(([v, label]) => (
                        <label className="checkbox-field" key={v}>
                          <input
                            disabled={readOnly}
                            type="checkbox"
                            checked={model.disciplines.includes(v)}
                            onChange={(e) =>
                              setModel({
                                ...model,
                                disciplines: e.target.checked
                                  ? [...model.disciplines, v]
                                  : model.disciplines.filter((d) => d !== v),
                              })
                            }
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                    <label className="field">
                      Notas técnicas
                      <textarea
                        disabled={readOnly}
                        value={model.technical_notes ?? ""}
                        onChange={(e) =>
                          setModel({
                            ...model,
                            technical_notes: e.target.value || null,
                          })
                        }
                      />
                    </label>
                  </div>
                  <div hidden={editorTab !== "sources"}>
                    <Fields
                      disabled={readOnly}
                      fields={sourceFields}
                      errors={fieldErrors}
                      value={{ sources: model.sources }}
                      onChange={(v) =>
                        setModel({
                          ...model,
                          sources: v.sources as Model["sources"],
                        })
                      }
                    />
                  </div>
                  <div hidden={editorTab !== "variants"}>
                    <h3>Variantes</h3>
                    <div className="piece-options">
                      {model.component_variants.map((v) => (
                        <button
                          type="button"
                          key={v.id}
                          onClick={() =>
                            guard.request(() => show("variant", v))
                          }
                        >
                          {v.label}
                          <span>
                            {v.published
                              ? v.selectable
                                ? "Publicada"
                                : "Retirada"
                              : "Borrador"}
                          </span>
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="text-button"
                      disabled={expected === null}
                      onClick={() => guard.request(newVariant)}
                    >
                      <Plus size={14} /> Añadir variante
                    </button>
                  </div>
                </>
              )}
              {panel === "variant" && variant && model && (
                <>
                  <p className="eyebrow">{model.name}</p>
                  <label className="field">
                    Versión
                    <input
                      disabled={readOnly}
                      required
                      value={variant.label}
                      onChange={(e) =>
                        setVariant({ ...variant, label: e.target.value })
                      }
                    />
                  </label>
                  <label className="field">
                    Año
                    <input
                      disabled={readOnly}
                      type="number"
                      min={1990}
                      max={2200}
                      value={variant.model_year ?? ""}
                      onChange={(e) =>
                        setVariant({
                          ...variant,
                          model_year: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                    />
                  </label>
                  <label className="field">
                    Generación
                    <input
                      disabled={readOnly}
                      value={variant.generation ?? ""}
                      onChange={(e) =>
                        setVariant({
                          ...variant,
                          generation: e.target.value || null,
                        })
                      }
                    />
                  </label>
                  <label className="field">
                    Referencia del fabricante
                    <input
                      disabled={readOnly}
                      value={variant.manufacturer_code ?? ""}
                      onChange={(e) =>
                        setVariant({
                          ...variant,
                          manufacturer_code: e.target.value || null,
                        })
                      }
                    />
                  </label>
                  {variant.published ? (
                    <p className="muted">
                      {variant.selectable
                        ? "Disponible para nuevos montajes"
                        : "Retirada de nuevas selecciones"}
                    </p>
                  ) : (
                    <label className="checkbox-field">
                      <input
                        disabled={readOnly}
                        type="checkbox"
                        checked={variant.selectable}
                        onChange={(e) =>
                          setVariant({
                            ...variant,
                            selectable: e.target.checked,
                          })
                        }
                      />{" "}
                      Disponible para nuevos montajes
                    </label>
                  )}
                  {variant.published && (
                    <>
                      <p className="muted">
                        Medidas, acabados y representación conservan la versión
                        publicada.
                      </p>
                      <button
                        type="button"
                        className="button outline full"
                        onClick={() =>
                          guard.request(() =>
                            show(
                              "variant",
                              {
                                ...variant,
                                id: crypto.randomUUID(),
                                label: variant.label + " · Nueva versión",
                                published: false,
                                selectable: true,
                              },
                              false,
                            ),
                          )
                        }
                      >
                        Crear nueva versión
                      </button>
                    </>
                  )}
                  <nav
                    className="admin-panel-tabs"
                    aria-label="Secciones de la variante"
                  >
                    {[
                      ["general", "Características"],
                      ["finishes", "Acabados"],
                      ["visual", "Modelo 3D"],
                      ["price", "Precio"],
                    ].map(([key, label]) => (
                      <button
                        type="button"
                        key={key}
                        aria-pressed={editorTab === key}
                        onClick={() => setEditorTab(key)}
                      >
                        {label}
                      </button>
                    ))}
                  </nav>
                  <section
                    className="form-group"
                    hidden={editorTab !== "general"}
                  >
                    <h3>Características</h3>
                    <Fields
                      fields={specificationFields[model.category]}
                      errors={fieldMessages("specs")}
                      value={variant.specs}
                      onChange={(specs) => setVariant({ ...variant, specs })}
                      disabled={readOnly || variant.published}
                    />
                  </section>
                  <Fields
                    disabled={readOnly}
                    fields={sourceFields}
                    errors={fieldErrors}
                    value={{ sources: variant.sources }}
                    onChange={(v) =>
                      setVariant({
                        ...variant,
                        sources: v.sources as EditableVariant["sources"],
                      })
                    }
                  />
                  <section
                    className="form-group"
                    hidden={editorTab !== "finishes"}
                  >
                    <h3>Acabados</h3>
                    <Fields
                      fields={[
                        {
                          key: "custom_color_enabled",
                          label: "Permitir color personalizado",
                          kind: "boolean",
                        },
                        {
                          key: "options",
                          label: "Acabados de fábrica",
                          kind: "records",
                          children: [
                            {
                              key: "id",
                              label: "Referencia del acabado",
                              kind: "text",
                            },
                            { key: "label", label: "Nombre", kind: "text" },
                            {
                              key: "material",
                              label: "Material visual",
                              kind: "group",
                              children: [
                                {
                                  key: "color",
                                  label: "Color hexadecimal",
                                  kind: "text",
                                },
                                {
                                  key: "metalness",
                                  label: "Metalizado",
                                  kind: "number",
                                  min: 0,
                                  max: 1,
                                },
                                {
                                  key: "roughness",
                                  label: "Rugosidad",
                                  kind: "number",
                                  min: 0,
                                  max: 1,
                                },
                              ],
                            },
                          ],
                        },
                      ]}
                      value={variant.allowed_finishes}
                      disabled={readOnly || variant.published}
                      onChange={(v) =>
                        setVariant({
                          ...variant,
                          allowed_finishes:
                            v as EditableVariant["allowed_finishes"],
                        })
                      }
                    />
                    <label className="field">
                      Acabado inicial
                      <select
                        disabled={readOnly || variant.published}
                        value={variant.allowed_finishes.default_finish_id}
                        onChange={(e) =>
                          setVariant({
                            ...variant,
                            allowed_finishes: {
                              ...variant.allowed_finishes,
                              default_finish_id: e.target.value,
                            },
                          })
                        }
                      >
                        {variant.allowed_finishes.options.map((f, i) => (
                          <option key={i} value={f.id}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </section>
                  <section
                    className="form-group"
                    hidden={editorTab !== "visual"}
                  >
                    <h3>Modelo 3D</h3>
                    <label className="field">
                      Buscar representación
                      <input
                        disabled={readOnly}
                        value={assetSearch}
                        onChange={(e) => {
                          setAssetSearch(e.target.value);
                          setAssetPage(0);
                        }}
                      />
                    </label>
                    <div className="inline-actions">
                      <button
                        type="button"
                        disabled={assetPage === 0}
                        onClick={() => setAssetPage((p) => p - 1)}
                      >
                        Anterior
                      </button>
                      <button
                        type="button"
                        disabled={
                          (assetPage + 1) * 25 >=
                          (assetOptions.data?.count ?? 0)
                        }
                        onClick={() => setAssetPage((p) => p + 1)}
                      >
                        Siguiente
                      </button>
                    </div>
                    <label className="field">
                      Recurso existente
                      <select
                        disabled={readOnly || variant.published}
                        value={variant.visual_asset_id ?? ""}
                        onChange={(e) =>
                          setVariant({
                            ...variant,
                            visual_asset_id: e.target.value || null,
                          })
                        }
                      >
                        <option value="">Sin recurso asignado</option>
                        {variant.visual_asset_id &&
                          !assetOptions.data?.items.some(
                            (a) => a.id === variant.visual_asset_id,
                          ) && (
                            <option value={variant.visual_asset_id}>
                              Representación asignada
                            </option>
                          )}
                        {assetOptions.data?.items.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.reference_notes ??
                              (a.kind === "procedural"
                                ? "Modelo paramétrico"
                                : "Modelo importado")}
                            {a.published ? "" : " · Borrador"}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      Fidelidad
                      <select
                        disabled={readOnly || variant.published}
                        value={variant.representation}
                        onChange={(e) =>
                          setVariant({
                            ...variant,
                            representation: e.target
                              .value as EditableVariant["representation"],
                          })
                        }
                      >
                        <option value="reference">Referencia</option>
                        <option value="approximate">Aproximada</option>
                        <option value="generic">Genérica</option>
                      </select>
                    </label>
                  </section>
                  <section
                    className="form-group"
                    hidden={editorTab !== "price"}
                  >
                    <h3>Precio de referencia</h3>
                    <label className="checkbox-field">
                      <input
                        disabled={readOnly}
                        type="checkbox"
                        checked={!!variant.price_reference}
                        onChange={(e) =>
                          setVariant({
                            ...variant,
                            price_reference: e.target.checked
                              ? {
                                  amount: 1,
                                  currency: "USD",
                                  market: "",
                                  source_url: "",
                                  as_of: new Date().toISOString().slice(0, 10),
                                }
                              : null,
                          })
                        }
                      />{" "}
                      Incluir referencia
                    </label>
                    {variant.price_reference && (
                      <Fields
                        disabled={readOnly}
                        fields={[
                          {
                            key: "amount",
                            label: "Importe",
                            kind: "number",
                            min: 0.01,
                          },
                          { key: "currency", label: "Moneda", kind: "text" },
                          { key: "market", label: "Mercado", kind: "text" },
                          { key: "source_url", label: "Fuente", kind: "text" },
                          {
                            key: "as_of",
                            label: "Fecha (AAAA-MM-DD)",
                            kind: "text",
                          },
                        ]}
                        value={variant.price_reference}
                        onChange={(v) =>
                          setVariant({
                            ...variant,
                            price_reference:
                              v as EditableVariant["price_reference"],
                          })
                        }
                      />
                    )}
                  </section>
                </>
              )}
              {panel === "brand" && brand && (
                <button
                  type="button"
                  className="text-button"
                  onClick={() =>
                    guard.request(() =>
                      navigate(`/administracion/catalogo?brand=${brand.id}`),
                    )
                  }
                >
                  Ver componentes de esta marca
                </button>
              )}
              {message && (
                <p role="status" className="success-notice">
                  {message}
                </p>
              )}
              {error && <Notice>{error}</Notice>}
            </fieldset>
          </form>
        </Drawer>
      )}
      {guard.dialog}
    </>
  );
}
