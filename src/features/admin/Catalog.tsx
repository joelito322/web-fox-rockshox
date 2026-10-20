import { useState, type FormEvent } from "react";
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
const draftFinishes = {
  default_finish_id: "factory",
  custom_color_enabled: false,
  options: [
    { id: "factory", label: "De fábrica", material: { color: "#252a25" } },
  ],
};
export default function Catalog() {
  const auth = useAuth();
  const cache = useQueryClient();
  const [category, setCategory] = useState<Category | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [panel, setPanel] = useState<"component" | "variant" | "brand" | null>(
    null,
  );
  const [model, setModel] = useState<Model | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [variant, setVariant] = useState<EditableVariant | null>(null);
  const [baseline, setBaseline] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const query = useQuery({
    queryKey: ["admin-catalog", auth.user!.id, category, search, page],
    queryFn: async () => {
      const { data, error } = await requireSupabase().rpc("admin_catalog", {
        p_category: category || null,
        p_search: search,
        p_page: page,
      });
      if (error) throw error;
      return resultSchema.parse(data);
    },
  });
  const value =
    panel === "brand" ? brand : panel === "variant" ? variant : model;
  const dirty = !!panel && JSON.stringify(value) !== baseline;
  const guard = useUnsavedChanges(dirty, () => save(false), busy);
  function show(
    kind: NonNullable<typeof panel>,
    record: Model | Brand | EditableVariant,
  ) {
    setMessage("");
    setPanel(kind);
    setBaseline(JSON.stringify(record));
    setError("");
    if (kind === "brand") setBrand(record as Brand);
    else if (kind === "variant") setVariant(record as EditableVariant);
    else setModel(record as Model);
  }
  function newModel() {
    const b = query.data?.brands[0];
    if (!b) {
      setError("Crea una marca antes de añadir un componente.");
      return;
    }
    show("component", {
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
    });
  }
  function newVariant() {
    if (!model) return;
    show("variant", {
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
    });
  }
  async function save(publish: boolean) {
    if (!panel || !value) return false;
    setBusy(true);
    setError("");
    try {
      let payload: Record<string, unknown> = {
        ...value,
        published: value.published || publish,
      };
      if (panel === "component" && model) {
        if (!model.name.trim() || !model.slug.trim()) {
          setError("Completa el nombre y el enlace del modelo.");
          return false;
        }
        z.array(sourceSchema).parse(model.sources);
        const { brands: _, component_variants: __, ...rest } = model;
        payload = { ...rest, published: model.published || publish };
      }
      if (panel === "variant" && variant && model) {
        specificationSchemas[model.category].parse(variant.specs);
        finishesSchema.parse(variant.allowed_finishes);
        z.array(sourceSchema).parse(variant.sources);
        if (!variant.label.trim()) {
          setError("Indica la versión de la variante.");
          return false;
        }
      }
      const { data, error: failure } = await requireSupabase().rpc(
        "save_catalog",
        { p_kind: panel, p_data: payload },
      );
      if (failure) throw failure;
      setBaseline(JSON.stringify({ ...value, published: payload.published }));
      await cache.invalidateQueries({
        queryKey: ["admin-catalog", auth.user!.id],
      });
      await Promise.all(
        [
          "catalog",
          "component",
          "catalog-facets",
          "preset-brands",
          "presets",
          "preset-detail",
          "preset-options",
        ].map((key) => cache.invalidateQueries({ queryKey: [key] })),
      );
      if (panel === "component" && model) {
        setModel({ ...model, published: !!payload.published });
        if (data !== model.id) throw new Error("unexpected_record");
      }
      if (panel === "variant" && variant)
        setVariant({ ...variant, published: !!payload.published });
      if (panel === "brand" && brand)
        setBrand({ ...brand, published: !!payload.published });
      setMessage(publish ? "Publicación confirmada." : "Cambios guardados.");
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
  const close = () => guard.request(() => setPanel(null));
  return (
    <>
      <div className="admin-toolbar">
        <div className="inline-actions">
          <select
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
              aria-label="Buscar modelo"
              value={search}
              placeholder="Buscar modelo…"
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
          </label>
        </div>
        <div className="inline-actions">
          <button
            className="button outline"
            onClick={() =>
              guard.request(() =>
                show("brand", {
                  id: crypto.randomUUID(),
                  name: "",
                  slug: "",
                  region: null,
                  published: false,
                }),
              )
            }
          >
            Crear marca
          </button>
          <button
            className="button dark"
            disabled={busy || query.isFetching}
            onClick={() => guard.request(newModel)}
          >
            <Plus size={15} /> Componente
          </button>
        </div>
      </div>
      {message && (
        <p className="success-notice" role="status">
          {message}
        </p>
      )}
      {!panel && error && <Notice>{error}</Notice>}
      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <Notice onRetry={() => void query.refetch()}>
          No se pudo cargar el catálogo.
        </Notice>
      ) : !query.data.components.length ? (
        <Empty title="Sin componentes en esta selección" />
      ) : (
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
                <tr key={c.id}>
                  <td>
                    <button
                      className="row-button"
                      onClick={() => guard.request(() => show("component", c))}
                    >
                      {c.name}
                    </button>
                  </td>
                  <td>
                    <button
                      className="text-button"
                      onClick={() =>
                        guard.request(() =>
                          show(
                            "brand",
                            query.data.brands.find((b) => b.id === c.brand_id)!,
                          ),
                        )
                      }
                    >
                      {c.brands.name}
                    </button>
                  </td>
                  <td>{categoryLabels[c.category]}</td>
                  <td>{c.component_variants.length}</td>
                  <td>{c.published ? "Publicado" : "Borrador"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
          disabled={(query.data?.components.length ?? 0) < 25}
          onClick={() => setPage((p) => p + 1)}
        >
          Siguiente
        </button>
      </div>
      {panel && value && (
        <Drawer
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
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              void save(false);
            }}
          >
            {panel === "brand" && brand && (
              <>
                <label className="field">
                  Nombre
                  <input
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
                <label className="field">
                  Nombre
                  <input
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
                    disabled={model.published}
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
                      model.published || !!model.component_variants.length
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
                    value={model.technical_notes ?? ""}
                    onChange={(e) =>
                      setModel({
                        ...model,
                        technical_notes: e.target.value || null,
                      })
                    }
                  />
                </label>
                <Fields
                  fields={sourceFields}
                  value={{ sources: model.sources }}
                  onChange={(v) =>
                    setModel({
                      ...model,
                      sources: v.sources as Model["sources"],
                    })
                  }
                />
                <h3>Variantes</h3>
                <div className="piece-options">
                  {(
                    query.data?.components.find((c) => c.id === model.id)
                      ?.component_variants ?? model.component_variants
                  ).map((v) => (
                    <button
                      type="button"
                      key={v.id}
                      onClick={() => guard.request(() => show("variant", v))}
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
                  disabled={
                    !query.data?.components.some((c) => c.id === model.id)
                  }
                  onClick={() => guard.request(newVariant)}
                >
                  <Plus size={14} /> Añadir variante
                </button>
              </>
            )}
            {panel === "variant" && variant && model && (
              <>
                <p className="eyebrow">{model.name}</p>
                <label className="field">
                  Versión
                  <input
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
                    value={variant.manufacturer_code ?? ""}
                    onChange={(e) =>
                      setVariant({
                        ...variant,
                        manufacturer_code: e.target.value || null,
                      })
                    }
                  />
                </label>
                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={variant.selectable}
                    onChange={(e) =>
                      setVariant({ ...variant, selectable: e.target.checked })
                    }
                  />{" "}
                  Disponible para nuevos montajes
                </label>
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
                          show("variant", {
                            ...variant,
                            id: crypto.randomUUID(),
                            label: variant.label + " · Nueva versión",
                            published: false,
                            selectable: true,
                          }),
                        )
                      }
                    >
                      Crear nueva versión
                    </button>
                  </>
                )}
                <details className="form-group">
                  <summary>Características</summary>
                  <Fields
                    fields={specificationFields[model.category]}
                    value={variant.specs}
                    onChange={(specs) => setVariant({ ...variant, specs })}
                    disabled={variant.published}
                  />
                </details>
                <Fields
                  fields={sourceFields}
                  value={{ sources: variant.sources }}
                  onChange={(v) =>
                    setVariant({
                      ...variant,
                      sources: v.sources as EditableVariant["sources"],
                    })
                  }
                />
                <details className="form-group">
                  <summary>Acabados</summary>
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
                    disabled={variant.published}
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
                      disabled={variant.published}
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
                </details>
                <details className="form-group">
                  <summary>Representación</summary>
                  <label className="field">
                    Recurso existente
                    <select
                      disabled={variant.published}
                      value={variant.visual_asset_id ?? ""}
                      onChange={(e) =>
                        setVariant({
                          ...variant,
                          visual_asset_id: e.target.value || null,
                        })
                      }
                    >
                      <option value="">Sin recurso asignado</option>
                      {query.data?.assets.map((a) => (
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
                      disabled={variant.published}
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
                </details>
                <details className="form-group">
                  <summary>Precio de referencia</summary>
                  <label className="checkbox-field">
                    <input
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
                </details>
              </>
            )}
            {error && <Notice>{error}</Notice>}
            <div className="panel-save-actions">
              <button
                className="button outline"
                disabled={
                  busy ||
                  (value.published &&
                    !auth.permissions.includes("catalog.publish"))
                }
                type="submit"
              >
                {value.published ? "Guardar cambios" : "Guardar borrador"}
              </button>
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
          </form>
        </Drawer>
      )}
      {guard.dialog}
    </>
  );
}
