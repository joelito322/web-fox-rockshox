import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { ArrowUpRight, Search } from "lucide-react";
import CatalogPage from "./Pages";
import { readCachedVariants } from "./api";
import { sourceSchema, type SelectedVariant } from "./model";
import { VariantInformation } from "./VariantInformation";
import {
  slotLabels,
  itemSchema,
  type Configuration,
} from "../configurator/model";
import { requireSupabase } from "../../lib/supabase";
import { PresetPreview } from "../bike-preview/Preview";
import { readCachedPresetPreviewSources } from "../bike-preview/api";
import { Drawer } from "../../components/ui/Drawer";
import { Loading, Notice, Empty } from "../../components/ui/Feedback";
import { CatalogHeading } from "./CatalogHeading";
const versionSchema = z.object({
  id: z.uuid(),
  label: z.string(),
  model_year: z.number().nullable(),
});
const familySchema = z.object({
  brand_id: z.uuid(),
  brand_name: z.string(),
  family_key: z.string(),
  name: z.string(),
  kind: z.enum(["factory", "example"]),
  image_key: z.string().nullable(),
  versions: z.array(versionSchema).min(1),
});
const listSchema = z.object({
  count: z.number(),
  families: z.array(familySchema),
});
type Family = z.infer<typeof familySchema>;
const presetSchema = z.object({
  brand_id: z.uuid(),
  family_key: z.string(),
  id: z.uuid(),
  name: z.string(),
  label: z.string(),
  kind: z.enum(["factory", "example"]),
  sources: z.array(sourceSchema),
  model_year: z.number().nullable(),
  selectable: z.boolean(),
  bike_preset_items: z.array(
    z.object({
      slot: itemSchema.shape.slot,
      variant_id: z.uuid(),
      finish_id: z.string(),
      custom_color: z.string().nullable(),
    }),
  ),
});
export default function BicyclesPage() {
  const client = useQueryClient();
  const [params, setParams] = useSearchParams();
  const frames = params.get("view") === "frames";
  const search = params.get("q") ?? "",
    page = Math.max(0, Math.floor(Number(params.get("page")) || 0)),
    brand = params.get("brand"),
    discipline = params.get("discipline");
  const [draftSearch, setDraftSearch] = useState(search);
  useEffect(() => {
    setDraftSearch(search);
  }, [search]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (draftSearch === search) return;
      setParams(
        (current) => {
          if (draftSearch) current.set("q", draftSearch);
          else current.delete("q");
          current.delete("page");
          return current;
        },
        { replace: true },
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [draftSearch, search, setParams]);
  const query = useQuery({
    staleTime: 300_000,
    queryKey: ["presets", search, page, brand, discipline],
    enabled: !frames,
    queryFn: async ({ signal }) => {
      const { data, error } = await requireSupabase()
        .rpc("list_preset_families", {
          p_search: search,
          p_page: page,
          p_brand: z.uuid().safeParse(brand).success ? brand : null,
          p_discipline: ["enduro", "downhill"].includes(discipline ?? "")
            ? discipline
            : null,
        })
        .abortSignal(signal);
      if (error) throw error;
      return listSchema.parse(data);
    },
  });
  const previewIds = [
    ...new Set(
      query.data?.families.flatMap((f) => f.versions.map((v) => v.id)) ?? [],
    ),
  ].sort();
  const previewSources = useQuery({
    queryKey: ["preset-preview-sources", previewIds],
    enabled: !frames && previewIds.length > 0,
    staleTime: 300_000,
    queryFn: ({ signal }) =>
      readCachedPresetPreviewSources(client, previewIds, signal),
  });
  const brands = useQuery({
    queryKey: ["preset-brands"],
    enabled: !frames,
    staleTime: 300000,
    queryFn: async ({ signal }) => {
      const { data, error } = await requireSupabase()
        .from("brands")
        .select("id,name")
        .order("name")
        .abortSignal(signal);
      if (error) throw error;
      return z.array(z.object({ id: z.uuid(), name: z.string() })).parse(data);
    },
  });
  function filter(key: string, value: string) {
    setParams(
      (p) => {
        if (value) p.set(key, value);
        else p.delete(key);
        if (key !== "page") p.delete("page");
        return p;
      },
      { replace: true },
    );
  }
  function open(id: string) {
    setParams((p) => {
      p.set("preset", id);
      return p;
    });
  }
  return (
    <div className="discovery-page bicycles-page">
      <div className="content bicycles-heading">
        <CatalogHeading kind="bicycles" />
        <div className="segmented">
          <button
            className={!frames ? "selected" : ""}
            aria-pressed={!frames}
            onClick={() => setParams({})}
          >
            Bicicletas de referencia
          </button>
          <button
            className={frames ? "selected" : ""}
            aria-pressed={frames}
            onClick={() => setParams({ view: "frames" })}
          >
            Cuadros
          </button>
        </div>
      </div>
      {frames ? (
        <CatalogPage frames />
      ) : (
        <div className="content preset-list">
          <div className="catalog-toolbar">
            <label className="search-input">
              <Search size={18} />
              <input
                aria-label="Buscar bicicletas"
                placeholder="Buscar bicicleta…"
                value={draftSearch}
                maxLength={150}
                onChange={(e) => setDraftSearch(e.target.value)}
              />
            </label>
          </div>
          <div className="catalog-filters">
            <label>
              Marca
              <select
                value={brand ?? ""}
                onChange={(e) => filter("brand", e.target.value)}
              >
                <option value="">Todas</option>
                {brands.data?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Disciplina
              <select
                value={discipline ?? ""}
                onChange={(e) => filter("discipline", e.target.value)}
              >
                <option value="">Todas</option>
                <option value="enduro">Enduro</option>
                <option value="downhill">Descenso</option>
              </select>
            </label>
          </div>
          {query.isPending ? (
            <Loading />
          ) : query.error ? (
            <Notice onRetry={() => void query.refetch()}>
              No se pudieron cargar las bicicletas.
            </Notice>
          ) : !query.data.families.length ? (
            <Empty title="Sin bicicletas en esta selección">
              <button className="text-button" onClick={() => setParams({})}>
                Limpiar filtros
              </button>
            </Empty>
          ) : (
            <div className="preset-grid">
              {query.data.families.map((f) => (
                <FamilyCard
                  key={`${f.brand_id}:${f.family_key}:${f.kind}`}
                  family={f}
                  sources={previewSources.data}
                  onOpen={open}
                />
              ))}
            </div>
          )}
          {query.data && query.data.count > 24 && (
            <div className="pagination">
              <button
                className="button outline"
                disabled={!page}
                onClick={() => filter("page", String(page - 1))}
              >
                Anterior
              </button>
              <span>{page + 1}</span>
              <button
                className="button outline"
                disabled={(page + 1) * 24 >= query.data.count}
                onClick={() => filter("page", String(page + 1))}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}
      {params.get("preset") && (
        <PresetDetails
          key={params.get("preset")}
          id={params.get("preset")!}
          families={query.data?.families ?? []}
          onClose={() =>
            setParams(
              (p) => {
                p.delete("preset");
                return p;
              },
              { replace: true },
            )
          }
          onVersion={open}
        />
      )}
    </div>
  );
}
function FamilyCard({
  family,
  sources,
  onOpen,
}: {
  family: Family;
  sources?: Record<string, Configuration>;
  onOpen: (id: string) => void;
}) {
  const [id, setId] = useState(family.versions[0].id);
  useEffect(() => {
    if (!family.versions.some((v) => v.id === id)) setId(family.versions[0].id);
  }, [family.versions, id]);
  const displayName =
    family.kind === "example"
      ? family.name.replace(/\s*·\s*Montaje ATLAS$/, "")
      : family.name;
  return (
    <article className="preset-card bicycle-card">
      <button
        className="bicycle-media"
        onClick={() => onOpen(id)}
        aria-label={`Ver montaje de ${family.name}`}
      >
        <PresetPreview
          key={id}
          id={id}
          name={displayName}
          source={sources?.[id] ?? null}
        />
        <span className="bicycle-kind">
          {family.kind === "factory" ? "Montaje de fábrica" : "Ejemplo ATLAS"}
        </span>
        <span className="bicycle-media-arrow">
          <ArrowUpRight size={22} />
        </span>
      </button>
      <div>
        {family.brand_name !== "ATLAS" && (
          <p className="eyebrow">{family.brand_name}</p>
        )}
        <h2>
          <button className="row-button" onClick={() => onOpen(id)}>
            {displayName}
          </button>
        </h2>
        <label className="field">
          Versión
          <select value={id} onChange={(e) => setId(e.target.value)}>
            {family.versions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
        <div className="inline-actions">
          <button className="button outline" onClick={() => onOpen(id)}>
            Ver montaje
          </button>
          <Link className="button dark" to={`/configurador?preset=${id}`}>
            Personalizar <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
function PresetDetails({
  id,
  families,
  onClose,
  onVersion,
}: {
  id: string;
  families: Family[];
  onClose: () => void;
  onVersion: (id: string) => void;
}) {
  const client = useQueryClient();
  const query = useQuery({
    staleTime: 300_000,
    queryKey: ["preset-detail", id],
    queryFn: async ({ signal }) => {
      const { data, error } = await requireSupabase()
        .from("bike_presets")
        .select(
          "id,brand_id,family_key,name,label,kind,sources,model_year,selectable,bike_preset_items(slot,variant_id,finish_id,custom_color)",
        )
        .eq("id", id)
        .eq("published", true)
        .abortSignal(signal)
        .single();
      if (error) throw error;
      const preset = presetSchema.parse(data);
      const knownVersions = families.find(
        (f) =>
          f.brand_id === preset.brand_id &&
          f.family_key === preset.family_key &&
          f.kind === preset.kind,
      )?.versions;
      const [variants, versions] = await Promise.all([
        readCachedVariants(
          client,
          preset.bike_preset_items.map((i) => i.variant_id),
          signal,
        ),
        knownVersions
          ? Promise.resolve(knownVersions)
          : (async () => {
              const siblings = await requireSupabase()
                .from("bike_presets")
                .select("id,label,model_year")
                .eq("brand_id", preset.brand_id)
                .eq("family_key", preset.family_key)
                .eq("kind", preset.kind)
                .eq("published", true)
                .eq("selectable", true)
                .order("label")
                .order("id")
                .abortSignal(signal);
              if (siblings.error) throw siblings.error;
              return z.array(versionSchema).parse(siblings.data);
            })(),
      ]);
      return {
        ...preset,
        variants,
        versions,
      };
    },
  });
  const versions =
    query.data?.versions ??
    families.find((f) => f.versions.some((v) => v.id === id))?.versions ??
    [];
  return (
    <Drawer title="Detalle de la bicicleta" onClose={onClose}>
      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <Notice onRetry={() => void query.refetch()}>
          La bicicleta no está disponible.
        </Notice>
      ) : (
        <>
          <p className="eyebrow">
            {query.data.kind === "factory"
              ? "Montaje de fábrica"
              : "Ejemplo ATLAS"}
          </p>
          <h2 className="detail-title">{query.data.name}</h2>
          {versions.some((v) => v.id === id) ? (
            <label className="field">
              Versión
              <select value={id} onChange={(e) => onVersion(e.target.value)}>
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p>{query.data.label}</p>
          )}
          {query.data.selectable &&
          query.data.bike_preset_items.every((i) =>
            query.data.variants.some(
              (v) => v.id === i.variant_id && v.selectable,
            ),
          ) ? (
            <Link
              className="button dark full"
              to={`/configurador?preset=${id}`}
            >
              Personalizar esta bicicleta
            </Link>
          ) : (
            <Notice>
              Hay referencias retiradas; elige otro montaje para personalizar.
            </Notice>
          )}
          <h3>Montaje</h3>
          {query.data.bike_preset_items.map((item) => (
            <PresetPiece
              key={item.slot}
              label={slotLabels[item.slot]}
              variant={query.data.variants.find(
                (v) => v.id === item.variant_id,
              )}
            />
          ))}
          {query.data.sources.map((s, i) => (
            <a
              className="source-link"
              href={s.url}
              target="_blank"
              rel="noreferrer"
              key={i}
            >
              {s.note ?? "Referencia del montaje"} <ArrowUpRight size={14} />
            </a>
          ))}
        </>
      )}
    </Drawer>
  );
}
function PresetPiece({
  label,
  variant,
}: {
  label: string;
  variant?: SelectedVariant;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <details
      className="piece-information"
      onToggle={(event) => setExpanded(event.currentTarget.open)}
    >
      <summary>
        {label}
        {variant ? ` · ${variant.component.name}` : ""}
      </summary>
      {expanded && (variant ? (
        <>
          <p className="eyebrow">{variant.component.brands.name}</p>
          <h3>{variant.component.name}</h3>
          <p>{variant.label}</p>
          <VariantInformation component={variant.component} variant={variant} />
        </>
      ) : (
        <p className="muted">Referencia sin resolver.</p>
      ))}
    </details>
  );
}
