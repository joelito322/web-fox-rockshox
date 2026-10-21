import { ArrowUpRight } from "lucide-react";
import type { ComponentModel, Variant } from "./model";
import { SpecificationDetails } from "./Specifications";
import { specificationFields } from "./model/specifications";
export function VariantInformation({
  component,
  variant,
}: {
  component: Omit<ComponentModel, "component_variants">;
  variant: Variant;
}) {
  const year = variant.model_year;
  const generationYear = variant.generation?.match(/\bMY\s*(\d{2})\b/i)?.[1];
  const showYear = year != null && !variant.generation?.includes(String(year)) && generationYear !== String(year).slice(-2);
  return (
    <>
      <details open>
        <summary>Características</summary>
        {(variant.generation || showYear) && (
          <dl className="spec-list">
            {variant.generation && <div><dt>Generación</dt><dd>{variant.generation}</dd></div>}
            {showYear && <div><dt>Año</dt><dd>{year}</dd></div>}
          </dl>
        )}
        <SpecificationDetails
          fields={specificationFields[component.category].filter(
            (f) => f.key !== "maintenance",
          )}
          value={variant.specs}
        />
      </details>
      {variant.price_reference && (
        <section className="price-reference">
          <h3>Precio de referencia</h3>
          <strong>
            {new Intl.NumberFormat("es", {
              style: "currency",
              currency: variant.price_reference.currency,
            }).format(variant.price_reference.amount)}
          </strong>
          <p>
            {variant.price_reference.market} · {variant.price_reference.as_of}
          </p>
          <a
            href={variant.price_reference.source_url}
            target="_blank"
            rel="noreferrer"
          >
            Consultar fuente <ArrowUpRight size={14} />
          </a>
        </section>
      )}
      <details>
        <summary>Acabados</summary>
        <div className="finish-list">
          {variant.allowed_finishes.options.map((f) => (
            <span key={f.id}>
              <i style={{ background: f.material.color }} />
              {f.label}
            </span>
          ))}
        </div>
      </details>
      <details>
        <summary>Mantenimiento y fuentes</summary>
        <SpecificationDetails
          fields={specificationFields[component.category].filter(
            (f) => f.key === "maintenance",
          )}
          value={variant.specs}
        />
        <p>
          {component.technical_notes ??
            "Consulta la documentación de la versión elegida."}
        </p>
        {variant.sources.map((s, i) => (
          <a
            className="source-link"
            key={i}
            href={s.url}
            target="_blank"
            rel="noreferrer"
          >
            {s.note ?? "Documentación del fabricante"}{" "}
            <ArrowUpRight size={14} />
          </a>
        ))}
      </details>
    </>
  );
}
