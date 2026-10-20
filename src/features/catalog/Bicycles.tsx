import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { ArrowUpRight, Search } from "lucide-react";
import CatalogPage from "./Pages";
import { readVariants } from "./api";
import { sourceSchema, type SelectedVariant } from "./model";
import { VariantInformation } from "./VariantInformation";
import { slotLabels, itemSchema } from "../configurator/model";
import { requireSupabase } from "../../lib/supabase";
import { BikeIllustration } from "../../components/BikeIllustration";
import { Drawer } from "../../components/ui/Drawer";
import { Loading, Notice, Empty } from "../../components/ui/Feedback";
import { modelImages } from "../../data/images";
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
  const [params, setParams] = useSearchParams();
  const frames = params.get("view") === "frames";
  const search = params.get("q") ?? "",
    page = Math.max(0, Math.floor(Number(params.get("page")) || 0)),
    brand = params.get("brand"),
    discipline = params.get("discipline");
  const query = useQuery({
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
  const brands = useQuery({
    queryKey: ["preset-brands"],
    enabled: !frames,
    staleTime: 300000,
    queryFn: async () => {
      const { data, error } = await requireSupabase()
        .from("brands")
        .select("id,name")
        .order("name");
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
    <>
      <div className="content bicycles-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">El punto de partida</p>
            <h1>
              Bicicletas<span className="title-dot">.</span>
            </h1>
          </div>
        </div>
        <div className="segmented">
          <button
            className={!frames ? "selected" : ""}
            onClick={() => setParams({})}
          >
            Bicicletas de referencia
          </button>
          <button
            className={frames ? "selected" : ""}
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
                value={search}
                maxLength={150}
                onChange={(e) => filter("q", e.target.value)}
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
    </>
  );
}
function FamilyCard({
  family,
  onOpen,
}: {
  family: Family;
  onOpen: (id: string) => void;
}) {
  const [id, setId] = useState(family.versions[0].id);
  useEffect(() => {
    if (!family.versions.some((v) => v.id === id)) setId(family.versions[0].id);
  }, [family.versions, id]);
  const photo = modelImages[family.image_key ?? ""];
  return (
    <article className="preset-card">
      {photo ? (
        <img
          className="preset-photo"
          src={photo}
          alt={family.name}
          loading="lazy"
        />
      ) : (
        <BikeIllustration />
      )}
      <div>
        <p className="eyebrow">
          {family.brand_name} ·{" "}
          {family.kind === "factory" ? "Montaje de fábrica" : "Ejemplo ATLAS"}
        </p>
        <h2>
          <button className="row-button" onClick={() => onOpen(id)}>
            {family.name}
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
  const query = useQuery({
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
      const preset = presetSchema.parse(data),
        variants = await readVariants(
          preset.bike_preset_items.map((i) => i.variant_id),
          signal,
        );
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
      return {
        ...preset,
        variants,
        versions: z.array(versionSchema).parse(siblings.data),
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
  return (
    <details className="piece-information">
      <summary>
        {label}
        {variant ? ` · ${variant.component.name}` : ""}
      </summary>
      {variant ? (
        <>
          <p className="eyebrow">{variant.component.brands.name}</p>
          <h3>{variant.component.name}</h3>
          <p>{variant.label}</p>
          <VariantInformation component={variant.component} variant={variant} />
        </>
      ) : (
        <p className="muted">Referencia sin resolver.</p>
      )}
    </details>
  );
}
