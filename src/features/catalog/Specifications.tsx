import { displaySpec } from "./model";
import type { SpecField } from "./model/specifications";
export function SpecificationDetails({
  fields,
  value,
}: {
  fields: SpecField[];
  value: Record<string, unknown>;
}) {
  return (
    <>
      {fields
        .filter((f) => value[f.key] != null)
        .map((f) => {
          const current = value[f.key];
          if (f.kind === "group")
            return (
              <section className="spec-group" key={f.key}>
                <h4>{f.label}</h4>
                <SpecificationDetails
                  fields={f.children!}
                  value={current as Record<string, unknown>}
                />
              </section>
            );
          if (f.kind === "records")
            return (
              <section className="spec-group" key={f.key}>
                <h4>{f.label}</h4>
                {(current as Record<string, unknown>[]).map((record, i) => (
                  <SpecificationDetails
                    key={i}
                    fields={f.children!}
                    value={record}
                  />
                ))}
              </section>
            );
          return (
            <dl className="spec-list" key={f.key}>
              <div>
                <dt>{f.label}</dt>
                <dd>
                  {["url", "source_url"].includes(f.key) &&
                  typeof current === "string" &&
                  /^https?:\/\//.test(current) ? (
                    <a href={current} target="_blank" rel="noreferrer">
                      Consultar documentación
                    </a>
                  ) : (
                    (f.options?.find((o) => o.value === current)?.label ??
                    displaySpec(current))
                  )}
                </dd>
              </div>
            </dl>
          );
        })}
    </>
  );
}
