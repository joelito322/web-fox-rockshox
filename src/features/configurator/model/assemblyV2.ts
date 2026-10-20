import { assemblyV5 } from "./assemblyV5";
import { assembly, type Assembly, type Point } from "./assembly";
import type { Configuration, Slot, VariantMap } from "./index";

export type AssemblyV2 = Assembly & {
  idler: Point | null;
  pivot: Point;
  upperCrown: Point;
};
export function assemblyV2(
  configuration: Configuration,
  variants: VariantMap,
): AssemblyV2 {
  const base = assembly(configuration, variants);
  const get = (slot: Slot) =>
    variants[configuration.items.find((i) => i.slot === slot)?.variantId ?? ""];
  const anchors = get("frame")?.visual_assets?.manifest.anchors;
  const idler = anchors?.chain_idler?.position ?? null;
  const pivot = anchors?.suspension_pivot?.position ?? [-0.08, 0.22, 0];
  const upperCrown = anchors?.fork_upper_crown?.position ?? [
    base.head[0] - 0.015,
    base.head[1] + 0.03,
    0,
  ];
  const stem = get("stem");
  const direct = stem?.specs.mount_type === "direct_mount";
  const stemLength =
    typeof stem?.specs.length_mm === "number"
      ? stem.specs.length_mm / 1000
      : 0.04;
  const rise = get("handlebar")?.specs.rise_mm;
  const bar: Point = [
    (direct ? upperCrown[0] : base.head[0]) + stemLength,
    (direct ? upperCrown[1] : base.head[1]) +
      0.025 +
      (typeof rise === "number" ? rise / 1000 : 0.025),
    0,
  ];
  // Fixed frame mounting points: a mismatched shock stays visible at its own length.
  const shockLength = get("shock")?.specs.eye_to_eye_mm;
  let shockLower = base.shockLower;
  if (typeof shockLength === "number" && shockLength > 0) {
    const delta = base.shockLower.map((v, i) => v - base.shockUpper[i]);
    const distance = Math.hypot(...delta);
    if (distance > 0)
      shockLower = base.shockUpper.map(
        (v, i) => v + ((delta[i] / distance) * shockLength) / 1000,
      ) as Point;
  }
  // Settle both tyres on a common plane without treating visual estimates as frame specs.
  const front: Point = [
    base.front[0],
    base.rear[1] + base.radius("front") - base.radius("rear"),
    base.front[2],
  ];
  const origin = (slot: Slot): Point =>
    slot.startsWith("front")
      ? front
      : slot === "handlebar"
        ? bar
        : base.origin(slot);
  return {
    ...base,
    front,
    shockLower,
    bar,
    idler,
    pivot,
    upperCrown,
    origin,
    ground: base.rear[1] - base.radius("rear") - 0.007,
  };
}
export function resolveAssembly(
  configuration: Configuration,
  variants: VariantMap,
): Assembly {
  const frame =
    variants[
      configuration.items.find((i) => i.slot === "frame")?.variantId ?? ""
    ];
  const fork =
    variants[
      configuration.items.find((i) => i.slot === "fork")?.variantId ?? ""
    ];
  if (
    frame?.visual_assets?.manifest.parameters.assembly_version ===
      "atlas-assembly-v5" ||
    fork?.visual_assets?.manifest.parameters.mount_space === "fork"
  )
    return assemblyV5(
      assemblyV2(configuration, variants),
      configuration,
      variants,
    );
  return ["atlas-bike-v2", "atlas-bike-v3", "atlas-bike-v4"].includes(
    frame?.visual_assets?.generator_key ?? "",
  )
    ? assemblyV2(configuration, variants)
    : assembly(configuration, variants);
}
