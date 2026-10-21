import { useCallback, useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  Search,
  SlidersHorizontal,
  Layers3,
  GitCompareArrows,
} from "lucide-react";
import {
  categoryGroups,
  displaySpec,
  specLabels,
  categoryLabels,
  categories,
  selectVariant,
  type ComponentModel,
  type Category,
} from "./model";
import {
  useCatalogCards, useComponent, useHistoricalVariant, useFacets, filterKeys,
} from "./api";
import type { CatalogCard } from "./api";
import { componentImage } from "../../data/images";
import { Drawer } from "../../components/ui/Drawer";
import { Empty, Loading, Notice } from "../../components/ui/Feedback";
import { VariantInformation } from "./VariantInformation";
import { useComparison } from "../compare";
import { CatalogHeading } from "./CatalogHeading";

function ProductCard({
  component,
  onOpen,
}: {
  component: CatalogCard;
  onOpen: () => void;
}) {
  const photo = componentImage(component);
  return (
    <button className="product-card" onClick={onOpen}>
      <div className="product-media">
        {photo ? (
          <img
            src={photo}
            alt={`${component.brands.name} ${component.name}`}
            loading="lazy"
          />
        ) : (
          <Layers3 size={54} strokeWidth={0.8} />
        )}
        <span className="category-badge">
          {categoryLabels[component.category]}
        </span>
        <span className="product-discipline">
          {component.disciplines.map(displaySpec).join(" / ")}
        </span>
      </div>
      <div className="product-copy">
        <p>{component.brands.name}</p>
        <h2>{component.name}</h2>
        <div className="card-specs">
          {(component.category === "frame"
            ? ["size_label", "wheel_front"]
            : component.category === "fork"
              ? ["travel_mm", "wheel_format"]
              : component.category === "shock"
                ? ["spring_type", "eye_to_eye_mm"]
                : component.category === "brake"
                  ? ["piston_count", "fluid"]
                  : component.category === "tire"
                    ? ["commercial_size", "casing"]
                    : component.category === "rotor"
                      ? ["rotor_diameter_mm", "rotor_mount"]
                      : ["speed_count", "material"]
          ).map((key) => {
            const values = [
              ...new Set(
                component.component_variants
                  .map((v) => v.specs[key])
                  .filter(
                    (v) =>
                      v !== null && v !== undefined && typeof v !== "object",
                  ),
              ),
            ];
            return values.length ? (
              <span key={key}>
                {(
                  specLabels[key] ??
                  (key === "commercial_size" ? "Medida" : "Referencia")
                ).replace(" (mm)", "")}
                : {values.slice(0, 3).map(displaySpec).join(" / ")}
                {key.endsWith("_mm") ? " mm" : ""}
                {values.length > 3 ? ` · ${values.length - 3} más` : ""}
              </span>
            ) : null;
          })}
        </div>
        <div className="product-footer">
          <span>
            {component.component_variants.length}{" "}
            {component.component_variants.length === 1
              ? "variante"
              : "variantes"}
          </span>
          <span className="card-arrow">
            <ArrowUpRight size={18} />
          </span>
        </div>
      </div>
    </button>
  );
}
export default function CatalogPage({ frames = false }: { frames?: boolean }) {
  const [params, setParams] = useSearchParams();
  const { slug: routeSlug } = useParams();
  const slug = frames ? (params.get("detail") ?? undefined) : routeSlug;
  const navigate = useNavigate();
  const selected = params.get("category");
  const category = frames
    ? "frame"
    : categories.includes(selected as Category)
      ? (selected as Category)
      : undefined;
  const search = params.get("q") ?? "";
  const page = Math.max(0, Math.floor(Number(params.get("page")) || 0));
  const [draftSearch, setDraftSearch] = useState(search);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const facets = useFacets(category);
  const selectedSpecs = Object.fromEntries(
    filterKeys
      .filter((key) => params.has(key))
      .map((key) => [key, params.get(key)!]),
  );
  const query = useCatalogCards(category, search, page, {
    brand: params.get("brand") ?? undefined,
    discipline: params.get("discipline") ?? undefined,
    specs: selectedSpecs,
  });
  function updateFilter(key: string, value: string) {
    setParams((p) => {
      if (value) p.set(key, value);
      else p.delete(key);
      p.delete("page");
      return p;
    });
  }
  const detail = useComponent(slug);
  const compare = useComparison();
  useEffect(() => {
    setDraftSearch(search);
  }, [search]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (draftSearch !== search)
        setParams(
          (p) => {
            if (draftSearch) p.set("q", draftSearch);
            else p.delete("q");
            p.delete("page");
            return p;
          },
          { replace: true },
        );
    }, 300);
    return () => clearTimeout(t);
  }, [draftSearch, search, setParams]);
  const close = useCallback(() => {
    if (frames)
      setParams(
        (p) => {
          p.delete("detail");
          p.delete("variant");
          return p;
        },
        { replace: true },
      );
    else navigate(`/componentes${location.search}`, { replace: true });
  }, [navigate, frames, setParams]);
  function chooseCategory(value?: Category) {
    setParams((p) => {
      if (value) p.set("category", value);
      else p.delete("category");
      p.delete("page");
      filterKeys.forEach((key) => p.delete(key));
      return p;
    });
    setFiltersOpen(false);
  }
  function open(component: CatalogCard) {
    if (frames)
      setParams((p) => {
        p.set("detail", component.slug);
        p.delete("variant");
        return p;
      });
    else
      navigate(`/componentes/${component.slug}${location.search}`, {
        replace: !!slug,
      });
  }
  return (
    <div
      className={`content catalog-page${frames ? " frames-catalog" : " discovery-page"}`}
    >
      {!frames && (
        <CatalogHeading kind="components">
          <Link className="compare-link" to="/comparar">
            <GitCompareArrows size={18} /> Comparar{" "}
            <span>{compare.items.length}/3</span>
          </Link>
        </CatalogHeading>
      )}
      <div className="catalog-toolbar">
        <label className="search-input">
          <Search size={18} />
          <input
            aria-label="Buscar componentes"
            placeholder="Buscar un modelo…"
            value={draftSearch}
            onChange={(e) => setDraftSearch(e.target.value)}
          />
        </label>
        <button
          className="button outline mobile-filter"
          aria-expanded={filtersOpen}
          aria-controls="catalog-categories"
          onClick={() => setFiltersOpen((v) => !v)}
        >
          <SlidersHorizontal size={16} /> Categorías
        </button>
        <span className="muted results-count">
          {query.data ? `${query.data.count} modelos` : ""}
        </span>
      </div>
      {facets.data && (
        <div className="catalog-filters">
          <label>
            Marca
            <select
              value={params.get("brand") ?? ""}
              onChange={(e) => updateFilter("brand", e.target.value)}
            >
              <option value="">Todas</option>
              {facets.data.brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Disciplina
            <select
              value={params.get("discipline") ?? ""}
              onChange={(e) => updateFilter("discipline", e.target.value)}
            >
              <option value="">Todas</option>
              {facets.data.disciplines.map((d) => (
                <option key={d} value={d}>
                  {displaySpec(d)}
                </option>
              ))}
            </select>
          </label>
          {category &&
            filterKeys
              .filter((key) => (facets.data.specs[key]?.length ?? 0) > 0)
              .map((key) => (
                <label key={key}>
                  {specLabels[key] ??
                    (key === "commercial_size"
                      ? "Medida comercial"
                      : "Referencia")}
                  <select
                    value={params.get(key) ?? ""}
                    onChange={(e) => updateFilter(key, e.target.value)}
                  >
                    <option value="">Todas</option>
                    {facets.data.specs[key].map((v) => (
                      <option key={String(v)} value={String(v)}>
                        {displaySpec(v)}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
          {(search ||
            params.get("brand") ||
            params.get("discipline") ||
            Object.keys(selectedSpecs).length > 0) && (
            <button
              className="text-button"
              onClick={() =>
                setParams(
                  category
                    ? { category, ...(frames ? { view: "frames" } : {}) }
                    : {},
                )
              }
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}
      <div className="catalog-layout">
        {!frames && (
          <aside
            id="catalog-categories"
            className={`category-list ${filtersOpen ? "open" : ""}`}
            aria-label="Categorías"
          >
            <button
              className={!category ? "selected" : ""}
              onClick={() => chooseCategory()}
            >
              Todas las piezas <ArrowUpRight size={14} />
            </button>
            {categoryGroups.map((group) => (
              <div className="category-group" key={group.label}>
                <h2>{group.label}</h2>
                {group.categories.map((c) => (
                  <button
                    key={c}
                    className={category === c ? "selected" : ""}
                    onClick={() => chooseCategory(c)}
                  >
                    {categoryLabels[c]}
                    {category === c && <span className="active-mark" />}
                  </button>
                ))}
              </div>
            ))}
          </aside>
        )}
        <section className="catalog-results" aria-label="Resultados">
          {query.isPending ? (
            <Loading label="Cargando catálogo" />
          ) : query.error ? (
            <Notice onRetry={() => void query.refetch()}>
              El catálogo no está disponible en este momento.
            </Notice>
          ) : !query.data.components.length ? (
            <Empty title="Sin piezas en esta selección">
              Prueba otra categoría o un nombre diferente.
            </Empty>
          ) : (
            <div className="product-grid">
              {query.data.components.map((c) => (
                <ProductCard key={c.id} component={c} onOpen={() => open(c)} />
              ))}
            </div>
          )}
          {!!query.data && query.data.count > 24 && (
            <div className="pagination">
              <button
                className="button outline"
                disabled={page === 0}
                onClick={() =>
                  setParams((p) => {
                    p.set("page", String(page - 1));
                    return p;
                  })
                }
              >
                <ArrowLeft size={16} /> Anterior
              </button>
              <span>{page + 1}</span>
              <button
                className="button outline"
                disabled={(page + 1) * 24 >= query.data.count}
                onClick={() =>
                  setParams((p) => {
                    p.set("page", String(page + 1));
                    return p;
                  })
                }
              >
                Siguiente <ArrowRight size={16} />
              </button>
            </div>
          )}
        </section>
      </div>
      {slug && (
        <Drawer title="Detalle de la pieza" onClose={close}>
          {detail.isPending ? (
            <Loading />
          ) : detail.error ? (
            <Notice onRetry={() => void detail.refetch()}>
              La pieza no está disponible.
            </Notice>
          ) : (
            <ComponentDetails component={detail.data} />
          )}
        </Drawer>
      )}
    </div>
  );
}
export function ComponentDetails({ component }: { component: ComponentModel }) {
  const [params, setParams] = useSearchParams();
  const compare = useComparison();
  const [notice, setNotice] = useState("");
  const historical = useHistoricalVariant(component, params.get("variant"));
  const requested = component.component_variants.find(
    (v) => v.id === params.get("variant"),
  ) ?? historical.data;
  const available = component.component_variants.filter((v) => v.selectable);
  const variant = requested ?? available[0] ?? component.component_variants[0];
  const choices =
    requested && !requested.selectable
      ? [requested, ...available]
      : available.length
        ? available
        : variant
          ? [variant]
          : [];
  const photo = componentImage(component, variant);
  if (historical.isFetching && !requested) return <Loading />;
  if (historical.error && !requested)
    return (
      <Notice onRetry={() => void historical.refetch()}>
        La versión solicitada no está disponible.
      </Notice>
    );
  if (!variant) return <Empty title="Sin variantes disponibles" />;
  return (
    <>
      <div className="detail-media">
        {photo ? (
          <img src={photo} alt={`${component.brands.name} ${component.name}`} />
        ) : (
          <Layers3 size={82} strokeWidth={0.7} />
        )}
      </div>
      {photo && <p className="representation-label">Referencia visual</p>}
      <p className="eyebrow">{component.brands.name}</p>
      <h2 className="detail-title">{component.name}</h2>
      <p className="muted">{component.description}</p>
      <label className="field">
        Versión
        <select
          value={variant.id}
          onChange={(e) =>
            setParams(
              (p) => {
                p.set("variant", e.target.value);
                return p;
              },
              { replace: true },
            )
          }
        >
          {choices.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
              {!v.selectable ? " · Referencia anterior" : ""}
            </option>
          ))}
        </select>
      </label>
      <span className="representation-label">
        {variant.representation === "generic"
          ? "Representación genérica"
          : "Representación aproximada"}
      </span>
      <div className="detail-actions">
        {variant.selectable ? (
          <Link
            className="button dark"
            to={`/configurador?variant=${variant.id}`}
          >
            Probar en mi bicicleta <ArrowUpRight size={18} />
          </Link>
        ) : (
          <p className="muted">Retirada de nuevos montajes</p>
        )}
        <button
          className="button outline"
          onClick={() =>
            setNotice(
              compare.add(selectVariant(component, variant)) ||
                "Añadida a la comparación.",
            )
          }
        >
          <GitCompareArrows size={17} /> Comparar
        </button>
      </div>
      {notice && <p role="status">{notice}</p>}
      <VariantInformation component={component} variant={variant} />
    </>
  );
}
