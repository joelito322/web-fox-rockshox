import reviewedLimits from "./frame-fork-limits.json";
import type { SelectedVariant } from "../../catalog/model";
import type { MountWarning, Slot } from "./index";

/** Positions identify the actual relationship, never the currently open picker. */
export function warningPositions(code: string): Slot[] {
  if (code.startsWith("missing_") || code.startsWith("retired_"))
    return [code.replace(/^(missing|retired)_/, "") as Slot];
  for (const position of ["front", "rear"] as const) {
    if (!code.startsWith(`${position}_`)) continue;
    if (code.includes("frame_wheel"))
      return ["frame", `${position}_rim`, `${position}_tire`];
    if (code.includes("wheel_mismatch") || code.includes("wheel_unknown"))
      return [`${position}_rim`, `${position}_tire`];
    if (code.includes("rotor_mount"))
      return [`${position}_rotor`, `${position}_hub`];
    if (code.includes("rotor"))
      return [
        `${position}_rotor`,
        code.includes("horquilla") ? "fork" : `${position}_brake`,
      ];
    return [`${position}_hub`, position === "front" ? "fork" : "frame"];
  }
  if (code === "fork_wheel") return ["fork", "front_rim", "front_tire"];
  if (code.startsWith("fork_") || code === "steerer") return ["frame", "fork"];
  if (code.startsWith("shock_")) return ["frame", "shock"];
  if (code.startsWith("bb_")) return ["frame", "bottom_bracket"];
  if (code.startsWith("crank_")) return ["bottom_bracket", "crankset"];
  if (code.startsWith("drivetrain_")) return ["cassette", "rear_derailleur"];
  if (code === "freehub") return ["cassette", "rear_hub"];
  if (code === "bar_clamp") return ["handlebar", "stem"];
  if (code === "seatpost_diameter") return ["frame", "seatpost"];
  if (code === "stem_mount") return ["stem", "fork"];
  if (code === "frame_missing") return ["frame"];
  return [];
}

export function wheelMeasure(value: unknown): string {
  return value === 622
    ? "29″"
    : value === 584
      ? "27,5″"
      : value === 559
        ? "26″"
        : typeof value === "number"
          ? `${value} mm BSD`
          : "Sin dato";
}

export function reviewedFrameForkRule(frame: SelectedVariant) {
  return reviewedLimits.find(
    (r) =>
      r.component_id === frame.component_id &&
      r.component_slug === frame.component.slug &&
      r.generation === frame.generation &&
      r.model_year === frame.model_year &&
      r.sizes.includes(String(frame.specs.size_label)),
  );
}

/** Only explicit limits for this exact commercial generation and reviewed sizes. */
export function frameForkWarnings(
  frame?: SelectedVariant,
  fork?: SelectedVariant,
): MountWarning[] {
  if (!frame || !fork) return [];
  const rule = reviewedFrameForkRule(frame);
  const result: MountWarning[] = [];
  const checks = [
    {
      key: "travel_mm",
      label: "Recorrido de horquilla",
      min: rule?.limits.travel_min_mm,
      max: rule?.limits.travel_max_mm,
    },
    {
      key: "axle_to_crown_mm",
      label: "Altura eje–corona",
      min: undefined,
      max: rule?.limits.axle_to_crown_max_mm,
    },
  ];
  for (const check of checks) {
    if (check.min == null && check.max == null) continue;
    const actual = fork.specs[check.key];
    const known =
      typeof actual === "number" && Number.isFinite(actual) && actual > 0;
    const expected =
      check.min != null && check.max != null
        ? `${check.min}–${check.max} mm`
        : check.max != null
          ? `Máximo ${check.max} mm`
          : `Mínimo ${check.min} mm`;
    if (
      !known ||
      (check.min != null && actual < check.min) ||
      (check.max != null && actual > check.max)
    )
      result.push({
        code: `fork_frame_${check.key}${known ? "" : "_unknown"}`,
        level: known ? "conflict" : "unknown",
        message: known
          ? `${check.label} fuera del límite documentado del cuadro.`
          : `Falta la ${check.label.toLowerCase()} de la horquilla para comprobar el límite del cuadro.`,
        slots: ["frame", "fork"],
        details: [
          { label: "Cuadro", value: expected },
          {
            label: "Horquilla",
            value: known ? `${actual} mm` : "Sin dato documentado",
          },
        ],
        sourceUrl: rule!.source_url,
      });
  }
  // A reference or recommendation must never become a hard minimum/maximum.
  if (!rule || rule.limits.travel_max_mm == null) {
    const note = frame.specs.fork_restrictions;
    result.push({
      code: "fork_travel_limits_unknown",
      level: "unknown",
      slots: ["frame", "fork"],
      message:
        "Falta confirmar el intervalo de recorrido admitido por este cuadro.",
      details:
        typeof note === "string" && note.trim()
          ? [{ label: "Referencia del cuadro", value: note }]
          : undefined,
      sourceUrl: frame.sources.find((s) =>
        s.fields?.some((f) => f.includes("fork_restrictions")),
      )?.url,
    });
  }
  return result;
}
