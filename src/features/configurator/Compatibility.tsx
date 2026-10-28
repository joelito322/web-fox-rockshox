import { CompatibilityAlternatives } from "./CompatibilityAlternatives";
import type { SelectedVariant } from "../catalog/model";
import type { Configuration, VariantMap } from "./model";
import { useRef, useState } from "react";
import { AlertTriangle, CircleHelp, ChevronRight } from "lucide-react";
import { Drawer } from "../../components/ui/Drawer";
import { slotLabels, type MountWarning, type Slot } from "./model";
import "./compatibility.css";

export function Compatibility({
  warnings,
  hasParts,
  onSelect,
  configuration,
  variants,
  onApply,
  disabled = false,
}: {
  warnings: MountWarning[];
  hasParts: boolean;
  onSelect: (slot: Slot) => void;
  configuration?: Configuration;
  variants?: VariantMap;
  disabled?: boolean;
  onApply?: (slot: Slot, variant: SelectedVariant, code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [alternative, setAlternative] = useState<{
    code: string;
    slot: Slot;
  }>();
  const selection = useRef<Slot>();
  const conflicts = warnings.filter((w) => w.level === "conflict");
  const unknowns = warnings.filter((w) => w.level === "unknown");
  const label =
    [
      conflicts.length
        ? `${conflicts.length} ${conflicts.length === 1 ? "incompatibilidad" : "incompatibilidades"}`
        : "",
      unknowns.length
        ? `${unknowns.length} ${unknowns.length === 1 ? "dato por confirmar" : "datos por confirmar"}`
        : "",
    ]
      .filter(Boolean)
      .join(" · ") ||
    (hasParts
      ? "Sin incompatibilidades detectadas"
      : "Selecciona piezas para comprobar el montaje");
  return (
    <>
      <section
        className={`compatibility-summary${conflicts.length ? " has-conflicts" : ""}`}
        aria-label="Estado de compatibilidad"
      >
        {conflicts.length ? (
          <AlertTriangle size={17} aria-hidden="true" />
        ) : (
          <CircleHelp size={17} aria-hidden="true" />
        )}
        <span role="status" aria-live="polite" aria-atomic="true">
          {label}
        </span>
        {hasParts && (
          <button
            className="text-button"
            onClick={() => {
              selection.current = undefined;
              setOpen(true);
            }}
          >
            Ver detalles <ChevronRight size={14} aria-hidden="true" />
          </button>
        )}
      </section>
      {open && (
        <Drawer title="Compatibilidad" onClose={() => setOpen(false)}>
          <p className="muted compatibility-intro">
            El montaje y el guardado siguen disponibles. Las comprobaciones
            dependen de las medidas documentadas.
          </p>
          {(
            [
              { title: "Incompatibilidades", notes: conflicts },
              { title: "Datos por confirmar", notes: unknowns },
            ] as const
          ).map(
            (group) =>
              group.notes.length > 0 && (
                <section className="compatibility-group" key={group.title}>
                  <h3>
                    {group.title} <span>{group.notes.length}</span>
                  </h3>
                  {group.notes.map((warning) => (
                    <article
                      className={`compatibility-card ${warning.level}`}
                      key={warning.code}
                    >
                      <p>{warning.message}</p>
                      {warning.details && (
                        <dl>
                          {warning.details.map((detail) => (
                            <div key={detail.label}>
                              <dt>{detail.label}</dt>
                              <dd>{detail.value}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      {warning.sourceUrl && (
                        <a
                          href={warning.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Ver especificación del fabricante ↗
                        </a>
                      )}
                      {warning.level === "conflict" &&
                        configuration &&
                        variants &&
                        onApply &&
                        !!warning.slots?.length && (
                          <>
                            <button
                              className="button dark small"
                              disabled={disabled}
                              onClick={() =>
                                setAlternative((current) =>
                                  current?.code === warning.code
                                    ? undefined
                                    : {
                                        code: warning.code,
                                        slot:
                                          warning.slots!.find(
                                            (slot) =>
                                              slot !== "frame" &&
                                              configuration.items.some(
                                                (item) => item.slot === slot,
                                              ),
                                          ) ?? warning.slots![0],
                                      },
                                )
                              }
                            >
                              {alternative?.code === warning.code
                                ? "Ocultar alternativas"
                                : "Ver alternativas"}
                            </button>
                            {alternative?.code === warning.code && (
                              <>
                                <div
                                  className="compatibility-actions"
                                  role="group"
                                  aria-label="Posición que quieres sustituir"
                                >
                                  {warning.slots
                                    .filter((slot) =>
                                      configuration.items.some(
                                        (item) => item.slot === slot,
                                      ),
                                    )
                                    .map((slot) => (
                                      <button
                                        key={slot}
                                        className="button outline small"
                                        aria-pressed={slot === alternative.slot}
                                        onClick={() =>
                                          setAlternative({
                                            code: warning.code,
                                            slot,
                                          })
                                        }
                                      >
                                        {slotLabels[slot]}
                                      </button>
                                    ))}
                                </div>
                                <CompatibilityAlternatives
                                  key={`${warning.code}:${alternative.slot}`}
                                  configuration={configuration}
                                  variants={variants}
                                  warning={warning}
                                  slot={alternative.slot}
                                  disabled={disabled}
                                  onApply={(slot, variant, code) => {
                                    selection.current = undefined;
                                    setOpen(false);
                                    setAlternative(undefined);
                                    onApply(slot, variant, code);
                                  }}
                                />
                              </>
                            )}
                          </>
                        )}
                      {!!warning.slots?.length && (
                        <div className="compatibility-actions">
                          {warning.slots.map((slot) => (
                            <button
                              className="button outline small"
                              key={slot}
                              onClick={() => {
                                selection.current = slot;
                                setOpen(false);
                                onSelect(slot);
                                // Drawer restores the originating trigger first; then focus the chosen picker.
                                requestAnimationFrame(() =>
                                  requestAnimationFrame(() => {
                                    if (selection.current !== slot) return;
                                    const heading =
                                      document.getElementById(
                                        "assembly-selection",
                                      );
                                    heading?.focus({ preventScroll: true });
                                    heading?.scrollIntoView({
                                      block: "nearest",
                                    });
                                  }),
                                );
                              }}
                            >
                              Cambiar {slotLabels[slot].toLocaleLowerCase()}
                            </button>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </section>
              ),
          )}
          {!warnings.length && (
            <p>
              No se detectaron incompatibilidades con los datos disponibles. La
              representación 3D no certifica el encaje mecánico.
            </p>
          )}
        </Drawer>
      )}
    </>
  );
}
