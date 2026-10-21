import type { Assembly, Point } from "./assembly";
import type { Configuration, VariantMap } from "./index";

/** Apply resource-local stem anchors only to newly versioned cockpit resources. */
export function commercialCockpitMount(base: Assembly, configuration: Configuration, variants: VariantMap): Assembly {
  const stem = variants[configuration.items.find(item => item.slot === "stem")?.variantId ?? ""];
  if (stem?.visual_assets?.generator_key !== "atlas-bike-v8") return base;
  const anchor = stem.visual_assets.manifest.anchors.bar_clamp;
  if (!anchor) throw new Error("missing_v8_bar_anchor");
  const direct = stem.specs.mount_type === "direct_mount";
  const start: Point = direct && "upperCrown" in base ? base.upperCrown as Point : base.head;
  const bar = start.map((value, index) => value + anchor.position[index]) as Point;
  return { ...base, bar, origin: slot => slot === "handlebar" ? bar : base.origin(slot) };
}
