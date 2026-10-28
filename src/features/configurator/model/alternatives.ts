import type { SelectedVariant } from "../../catalog/model";
import {
  choose,
  warnings,
  slotCategories,
  type Configuration,
  type MountWarning,
  type Slot,
  type VariantMap,
} from "./index";
import { compareAxles } from "./axles";
import { reviewedFrameForkRule } from "./compatibility";

const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const numeric = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value > 0;
const text = (value: unknown) =>
  typeof value === "string" &&
  !!value.trim() &&
  !/^(unknown|pending|n\/a|sin dato|por confirmar)$/i.test(value.trim());
const wheel = (value: unknown) =>
  ["29", "29-inch", "27.5", "27.5-inch", "26"].includes(String(value));

/** Prove the requested relationship has data; silence from warnings alone is not evidence. */
function hasEvidence(
  code: string,
  configuration: Configuration,
  variants: VariantMap,
): boolean {
  const get = (slot: Slot) =>
    variants[
      configuration.items.find((item) => item.slot === slot)?.variantId ?? ""
    ]?.specs ?? {};
  const frame = get("frame"),
    fork = get("fork"),
    shock = get("shock");
  const pair = (a: unknown, b: unknown, kind = numeric) => kind(a) && kind(b);
  if (code.startsWith("fork_frame_")) {
    const frameVariant =
      variants[
        configuration.items.find((item) => item.slot === "frame")?.variantId ??
          ""
      ];
    const rule = frameVariant && reviewedFrameForkRule(frameVariant);
    if (code === "fork_frame_travel_mm")
      return (
        !!rule &&
        (numeric(rule.limits.travel_min_mm) ||
          numeric(rule.limits.travel_max_mm)) &&
        numeric(fork.travel_mm)
      );
    if (code === "fork_frame_axle_to_crown_mm")
      return (
        !!rule &&
        numeric(rule.limits.axle_to_crown_max_mm) &&
        numeric(fork.axle_to_crown_mm)
      );
    return false;
  }
  for (const position of ["front", "rear"] as const) {
    const rim = get(`${position}_rim`),
      tire = get(`${position}_tire`),
      hub = get(`${position}_hub`),
      rotor = get(`${position}_rotor`),
      brake = get(`${position}_brake`);
    const actualWheel = rim.wheel_bsd_mm ?? tire.wheel_bsd_mm;
    if (code === `${position}_wheel_mismatch`)
      return pair(rim.wheel_bsd_mm, tire.wheel_bsd_mm);
    if (code === `${position}_frame_wheel`)
      return wheel(frame[`wheel_${position}`]) && numeric(actualWheel);
    if (position === "front" && code === "fork_wheel")
      return pair(fork.wheel_bsd_mm, actualWheel);
    if (code === `${position}_rotor_mount`)
      return pair(rotor.rotor_mount, hub.rotor_mount, text);
    if (code === `${position}_rotor_thickness`)
      return pair(rotor.rotor_thickness_mm, brake.rotor_thickness_mm);
    if (code === `${position}_hub_position`)
      return [position, "both"].includes(String(hub.position));
    if (code === `${position}_axle`) {
      const axle =
        position === "front" ? fork.axle_standard : frame.rear_axle_standard;
      return (
        text(axle) &&
        text(hub.axle_standard) &&
        compareAxles(axle, hub.axle_standard) === "same"
      );
    }
    if (code.startsWith(`${position}_`) && code.endsWith("_rotor_range")) {
      const part = code.includes("horquilla") ? fork : brake;
      return (
        numeric(rotor.rotor_diameter_mm) &&
        (numeric(part.rotor_min_mm) || numeric(part.rotor_max_mm))
      );
    }
  }
  const fit = object(frame.shock_fit),
    mounts = object(shock.mount_standard),
    bb = get("bottom_bracket"),
    crank = get("crankset"),
    shell = object(frame.bb_shell);
  if (code === "shock_length")
    return pair(fit.eye_to_eye_mm, shock.eye_to_eye_mm);
  if (code === "shock_stroke") return pair(fit.stroke_mm, shock.stroke_mm);
  for (const end of ["upper", "lower"] as const)
    for (const key of ["type", "width_mm", "bolt_diameter_mm"]) {
      if (code === `shock_${end}_${key}`)
        return pair(
          object(fit[`${end}_mount`])[key],
          object(mounts[end])[key],
          key === "type" ? text : numeric,
        );
    }
  if (code === "bb_shell") return pair(shell.standard, bb.shell_standard, text);
  if (code === "bb_width") return pair(shell.width_mm, bb.shell_width_mm);
  if (code === "crank_spindle")
    return pair(bb.spindle_standard, crank.spindle_standard, text);
  if (code === "crank_diameter")
    return pair(bb.spindle_diameter_mm, crank.spindle_diameter_mm);
  if (code === "freehub")
    return pair(
      get("cassette").freehub_standard,
      get("rear_hub").freehub_standard,
      text,
    );
  if (code === "drivetrain_speeds")
    return pair(
      get("cassette").speed_count,
      get("rear_derailleur").speed_count,
    );
  if (code === "bar_clamp")
    return pair(
      get("handlebar").clamp_diameter_mm,
      get("stem").bar_clamp_diameter_mm,
    );
  if (code === "seatpost_diameter")
    return pair(frame.seatpost_diameter_mm, get("seatpost").diameter_mm);
  if (code === "stem_mount") {
    const stem = get("stem");
    return (
      (stem.mount_type === "steerer_clamp" &&
        ["single", "dual"].includes(String(fork.crown_type))) ||
      (stem.mount_type === "direct_mount" &&
        fork.crown_type === "dual" &&
        text(stem.direct_mount_interface) &&
        stem.direct_mount_interface === fork.direct_mount_interface)
    );
  }
  return false;
}

export type AlternativeEvaluation = {
  variant: SelectedVariant;
  resolved: string[];
  unknowns: MountWarning[];
};
export function evaluateAlternative(
  configuration: Configuration,
  variants: VariantMap,
  code: string,
  slot: Slot,
  candidate: SelectedVariant,
): AlternativeEvaluation | null {
  const before = warnings(configuration, variants);
  const target = before.find(
    (warning) => warning.code === code && warning.level === "conflict",
  );
  if (
    !candidate.component.published ||
    !candidate.allowed_finishes.options.some(
      (finish) => finish.id === candidate.allowed_finishes.default_finish_id,
    ) ||
    !target?.slots?.includes(slot) ||
    !configuration.items.some((item) => item.slot === slot) ||
    slotCategories[slot] !== candidate.component.category ||
    configuration.items.find((item) => item.slot === slot)?.variantId ===
      candidate.id
  )
    return null;
  let next: Configuration;
  try {
    next = choose(configuration, slot, candidate);
  } catch {
    return null;
  }
  const map = { ...variants, [candidate.id]: candidate };
  if (!hasEvidence(code, next, map)) return null;
  const after = warnings(next, map);
  if (after.some((warning) => warning.code === code)) return null;
  const previousCodes = new Set(
    before.map((warning) => `${warning.level}:${warning.code}`),
  );
  if (
    after.some(
      (warning) =>
        warning.level === "conflict" &&
        (warning.slots?.includes(slot) ||
          !previousCodes.has(`conflict:${warning.code}`)),
    )
  )
    return null;
  if (
    after.some(
      (warning) =>
        warning.level === "unknown" &&
        warning.code !== "visual_reference" &&
        !previousCodes.has(`unknown:${warning.code}`),
    )
  )
    return null;
  return {
    variant: candidate,
    resolved: before
      .filter(
        (warning) =>
          warning.level === "conflict" &&
          !after.some((nextWarning) => nextWarning.code === warning.code),
      )
      .map((warning) => warning.code),
    unknowns: after.filter(
      (warning) =>
        warning.level === "unknown" && warning.code !== "visual_reference",
    ),
  };
}
