import { useId } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { SpecField } from "../catalog/model/specifications";

export function Fields({
  fields,
  value,
  onChange,
  disabled = false,
  errors = {},
}: {
  fields: SpecField[];
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  disabled?: boolean;
  errors?: Record<string, string>;
}) {
  const errorPrefix = useId();
  const nested = (prefix: string) =>
    Object.fromEntries(
      Object.entries(errors)
        .filter(([key]) => key.startsWith(prefix + "."))
        .map(([key, value]) => [key.slice(prefix.length + 1), value]),
    );
  return (
    <>
      {fields.map((field) => {
        const message = errors[field.key];
        const errorId = `${errorPrefix}-${field.key}`;
        const control = (() => {
          const current = value[field.key];
          const update = (next: unknown) =>
            onChange({ ...value, [field.key]: next });
          if (field.kind === "group")
            return (
              <details className="form-group" key={field.key}>
                <summary>{field.label}</summary>
                <Fields
                  fields={field.children!}
                  errors={nested(field.key)}
                  value={
                    current && typeof current === "object"
                      ? (current as Record<string, unknown>)
                      : {}
                  }
                  onChange={update}
                  disabled={disabled}
                />
              </details>
            );
          if (field.kind === "records") {
            const entries = Array.isArray(current)
              ? (current as Record<string, unknown>[])
              : [];
            return (
              <fieldset
                className="record-list"
                key={field.key}
                disabled={disabled}
              >
                <legend>{field.label}</legend>
                {entries.map((entry, index) => (
                  <div className="record" key={index}>
                    <Fields
                      fields={field.children!}
                      errors={nested(`${field.key}.${index}`)}
                      value={entry}
                      onChange={(next) =>
                        update(entries.map((e, i) => (i === index ? next : e)))
                      }
                    />
                    <button
                      type="button"
                      className="text-button danger"
                      onClick={() =>
                        update(entries.filter((_, i) => i !== index))
                      }
                    >
                      <Trash2 size={14} /> Quitar
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="text-button"
                  onClick={() => update([...entries, {}])}
                >
                  <Plus size={14} /> Añadir
                </button>
              </fieldset>
            );
          }
          if (field.options)
            return (
              <label className="field" key={field.key}>
                {field.label}
                <select
                  aria-invalid={!!message}
                  aria-describedby={message ? errorId : undefined}
                  disabled={disabled}
                  value={typeof current === "string" ? current : ""}
                  onChange={(e) => update(e.target.value || null)}
                >
                  <option value="">Sin confirmar</option>
                  {field.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            );
          if (field.kind === "boolean")
            return (
              <label className="field" key={field.key}>
                {field.label}
                <select
                  aria-invalid={!!message}
                  aria-describedby={message ? errorId : undefined}
                  disabled={disabled}
                  value={
                    current === true ? "yes" : current === false ? "no" : ""
                  }
                  onChange={(e) =>
                    update(e.target.value ? e.target.value === "yes" : null)
                  }
                >
                  <option value="">Sin confirmar</option>
                  <option value="yes">Sí</option>
                  <option value="no">No</option>
                </select>
              </label>
            );
          if (field.kind === "list")
            return (
              <ListField
                key={field.key}
                field={field}
                value={Array.isArray(current) ? current : []}
                onChange={update}
                disabled={disabled}
              />
            );
          return (
            <label className="field" key={field.key}>
              {field.label}
              <input
                aria-invalid={!!message}
                aria-describedby={message ? errorId : undefined}
                disabled={disabled}
                type={
                  field.kind === "number"
                    ? "number"
                    : ["url", "source_url"].includes(field.key)
                      ? "url"
                      : "text"
                }
                min={field.min}
                max={field.max}
                step={field.integer ? 1 : "any"}
                maxLength={2000}
                value={
                  typeof current === "string" || typeof current === "number"
                    ? current
                    : ""
                }
                onChange={(e) =>
                  update(
                    e.target.value === ""
                      ? null
                      : field.kind === "number"
                        ? Number(e.target.value)
                        : e.target.value,
                  )
                }
              />
            </label>
          );
        })();
        return (
          <div
            key={field.key}
            className={message ? "field-invalid" : undefined}
          >
            {control}
            {message && (
              <small className="field-error" id={errorId} role="alert">
                {message}
              </small>
            )}
          </div>
        );
      })}
    </>
  );
}
function ListField({
  field,
  value,
  onChange,
  disabled,
}: {
  field: SpecField;
  value: unknown[];
  onChange: (value: unknown) => void;
  disabled: boolean;
}) {
  return (
    <fieldset className="record-list" disabled={disabled}>
      <legend>{field.label}</legend>
      {value.map((v, i) => (
        <div className="inline-actions" key={i}>
          <input
            aria-label={`${field.label} ${i + 1}`}
            type={field.key === "sprocket_teeth" ? "number" : "text"}
            min={1}
            step={1}
            value={typeof v === "number" || typeof v === "string" ? v : ""}
            onChange={(e) =>
              onChange(
                value.map((item, j) =>
                  j === i
                    ? field.key === "sprocket_teeth"
                      ? Number(e.target.value)
                      : e.target.value
                    : item,
                ),
              )
            }
          />
          <button
            type="button"
            className="icon-button"
            aria-label={`Quitar ${field.label.toLowerCase()} ${i + 1}`}
            onClick={() => onChange(value.filter((_, j) => j !== i))}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="text-button"
        onClick={() =>
          onChange([...value, field.key === "sprocket_teeth" ? 1 : ""])
        }
      >
        <Plus size={14} /> Añadir
      </button>
    </fieldset>
  );
}
export const sourceFields: SpecField[] = [
  {
    key: "sources",
    label: "Fuentes",
    kind: "records",
    children: [
      { key: "url", label: "Enlace oficial", kind: "text" },
      {
        key: "consulted_at",
        label: "Fecha de consulta (AAAA-MM-DD)",
        kind: "text",
      },
      { key: "note", label: "Referencia", kind: "text" },
      { key: "fields", label: "Datos respaldados", kind: "list" },
    ],
  },
];
