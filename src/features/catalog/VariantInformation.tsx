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
  return (
    <>
      <details open>
        <summary>Características</summary>
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
