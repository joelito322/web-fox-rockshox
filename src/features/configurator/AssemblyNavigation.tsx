import { useEffect, useState } from "react";
import { Check, Circle, AlertTriangle, CircleHelp } from "lucide-react";
import {
  assemblyGroups,
  entryFor,
  groupFor,
  pairedSlot,
  wheelSetups,
  type WheelSetup,
} from "./model/guided";
import {
  slotLabels,
  slots,
  type Configuration,
  type Slot,
  type VariantMap,
  type MountWarning,
} from "./model";

export function AssemblyIndex({
  configuration,
  variants,
  slot,
  warnings = [],
  onSelect,
}: {
  configuration: Configuration;
  variants: VariantMap;
  slot: Slot;
  warnings?: MountWarning[];
  onSelect: (slot: Slot) => void;
}) {
  const [expanded, setExpanded] = useState(
    () => matchMedia("(min-width:981px)").matches,
  );
  useEffect(() => {
    const media = matchMedia("(min-width:981px)");
    const update = () => setExpanded(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return (
    <aside className="assembly-index" aria-label="Piezas del montaje">
      <details
        open={expanded}
        onToggle={(e) => setExpanded(e.currentTarget.open)}
      >
        <summary>
          Piezas del montaje{" "}
          <span>
            {configuration.items.length}/{slots.length}
          </span>
        </summary>
        <div className="assembly-index-body">
          {assemblyGroups.map((group) => {
            const positions = group.entries.flatMap((e) => e.slots) as Slot[];
            const count = positions.filter((s) =>
              configuration.items.some((i) => i.slot === s),
            ).length;
            return (
              <section key={group.id}>
                <h2>
                  {group.label}
                  <span>
                    {count}/{positions.length}
                  </span>
                </h2>
                {positions.map((s) => {
                  const item = configuration.items.find((i) => i.slot === s);
                  const variant = item ? variants[item.variantId] : undefined;
                  const affected = warnings.filter((w) => w.slots?.includes(s));
                  const hasConflict = affected.some((w) => w.level === "conflict");
                  return (
                    <button
                      key={s}
                      aria-label={slotLabels[s]}
                      aria-describedby={`assembly-piece-${s}${affected.length ? ` assembly-warning-${s}` : ""}`}
                      className={slot === s ? "selected" : ""}
                      aria-pressed={slot === s}
                      onClick={() => {
                        onSelect(s);
                        if (!matchMedia("(min-width:981px)").matches) {
                          setExpanded(false);
                          requestAnimationFrame(() => {
                            const heading =
                              document.getElementById("assembly-selection");
                            heading?.focus({ preventScroll: true });
                            heading?.scrollIntoView({ block: "nearest" });
                          });
                        }
                      }}
                    >
                      <span className={item ? "slot-complete" : "slot-empty"}>
                        {item ? <Check size={13} /> : <Circle size={11} />}
                      </span>
                      <span className="assembly-piece-copy" id={`assembly-piece-${s}`}>
                        <strong>{slotLabels[s]}</strong>
                        <small>
                          {variant
                            ? `${variant.component.brands.name} · ${variant.component.name}`
                            : "Sin elegir"}
                        </small>
                        {variant && (
                          <small className="index-variant">
                            {variant.label}
                          </small>
                        )}
                      </span>
                      {!!affected.length && <span className={`assembly-warning ${hasConflict ? "conflict" : "unknown"}`}>
                        {hasConflict ? <AlertTriangle size={14} aria-hidden="true" /> : <CircleHelp size={14} aria-hidden="true" />}
                        <span className="assembly-warning-label" id={`assembly-warning-${s}`}>{hasConflict ? "Incompatibilidad detectada" : "Dato por confirmar"}</span>
                      </span>}
                    </button>
                  );
                })}
              </section>
            );
          })}
        </div>
      </details>
    </aside>
  );
}
export function AssemblyNavigation({
  slot,
  onSelect,
  wheelSetup,
  onWheelSetup,
  frameSize,
  onFrameSize,
  linked,
  onLinked,
}: {
  slot: Slot;
  onSelect: (slot: Slot) => void;
  wheelSetup: WheelSetup;
  onWheelSetup: (setup: WheelSetup) => void;
  frameSize: string;
  onFrameSize: (size: string) => void;
  linked: boolean;
  onLinked: (linked: boolean) => void;
}) {
  const group = groupFor(slot),
    entry = entryFor(slot);
  const positions = entry.slots as Slot[];
  return (
    <div className="assembly-navigation">
      <div
        className="assembly-wheel-tabs"
        role="group"
        aria-label="Medida de ruedas"
      >
        {wheelSetups.map((option) => (
          <button
            key={option.value}
            aria-pressed={wheelSetup === option.value}
            onClick={() => onWheelSetup(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {slot === "frame" && (
        <div
          className="assembly-size-tabs"
          role="group"
          aria-label="Talla del cuadro"
        >
          <span>Talla</span>
          {["all", "M", "L"].map((size) => (
            <button
              key={size}
              aria-pressed={frameSize === size}
              onClick={() => onFrameSize(size)}
            >
              {size === "all" ? "Todas" : size}
            </button>
          ))}
        </div>
      )}
      {wheelSetup === "mixed" && (
        <p className="assembly-context">29" delante · 27,5" detrás</p>
      )}
      <nav className="assembly-groups" aria-label="Grupos de montaje">
        {assemblyGroups.map((g) => (
          <button
            key={g.id}
            aria-pressed={group.id === g.id}
            onClick={() => onSelect(g.entries[0].slots[0])}
          >
            {g.label}
          </button>
        ))}
      </nav>
      {group.entries.length > 1 && (
        <nav
          className="assembly-categories"
          aria-label={`Piezas de ${group.label.toLowerCase()}`}
        >
          {group.entries.map((e) => (
            <button
              key={e.label}
              aria-pressed={(e.slots as Slot[]).includes(slot)}
              onClick={() => onSelect(e.slots[0])}
            >
              {e.label}
            </button>
          ))}
        </nav>
      )}
      {positions.length === 2 && (
        <div className="assembly-pair">
          {pairedSlot(slot) && (
            <label>
              <input
                type="checkbox"
                checked={linked}
                onChange={(e) => onLinked(e.target.checked)}
              />
              Aplicar a ambos lados
            </label>
          )}
          <div role="group" aria-label="Posición">
            {positions.map((s, index) => (
              <button
                key={s}
                aria-pressed={slot === s}
                onClick={() => onSelect(s)}
              >
                {index === 0 ? "Delante" : "Detrás"}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
