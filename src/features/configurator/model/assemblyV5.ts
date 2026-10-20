import type { AssemblyV2 } from "./assemblyV2";
import type { Assembly, Point } from "./assembly";
import type { Configuration, VariantMap, Slot } from "./index";
import type { VisualAsset } from "../../catalog/model";

export const rotatePoint = (p: Point, angle: number): Point => [
  p[0] * Math.cos(angle) - p[1] * Math.sin(angle),
  p[0] * Math.sin(angle) + p[1] * Math.cos(angle),
  p[2],
];
export function importedMount(
  slot: Slot,
  asset: VisualAsset,
  a: Assembly,
): { position: Point; rotation: Point; localRotation: Point } {
  const space = asset.manifest.parameters.mount_space;
  if (space === "frame")
    return {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      localRotation: [0, 0, 0],
    };
  if (space === "fork")
    return {
      position: a.lower,
      rotation: [
        0,
        0,
        Math.atan2(a.lower[0] - a.head[0], a.head[1] - a.lower[1]),
      ],
      localRotation: [0, 0, 0],
    };
  if (space === "shock")
    return {
      position: a.shockUpper,
      rotation: [
        0,
        0,
        Math.atan2(
          a.shockLower[0] - a.shockUpper[0],
          a.shockUpper[1] - a.shockLower[1],
        ),
      ],
      localRotation: [0, "shockRoll" in a ? Number(a.shockRoll) : 0, 0],
    };
  return {
    position: a.origin(slot),
    rotation: [0, 0, 0],
    localRotation: [0, 0, 0],
  };
}
export function assemblyV5(
  base: AssemblyV2,
  configuration: Configuration,
  variants: VariantMap,
): AssemblyV2 & { settleAngle: number; shockRoll: number } {
  const get = (slot: Slot) =>
    variants[configuration.items.find((i) => i.slot === slot)?.variantId ?? ""];
  const fork = get("fork")?.visual_assets;
  let front = base.front,
    upperCrown = base.upperCrown;
  if (fork?.manifest.parameters.mount_space === "fork") {
    const pose = importedMount("fork", fork, base),
      axle = fork.manifest.anchors.axle?.position;
    if (!axle) throw Error("missing_fork_axle");
    const delta = rotatePoint(axle, pose.rotation[2]);
    front = delta.map((v, i) => v + pose.position[i]) as Point;
    const upper = fork.manifest.anchors.upper_crown?.position;
    if (upper) {
      const p = rotatePoint(upper, pose.rotation[2]);
      upperCrown = p.map((v, i) => v + pose.position[i]) as Point;
    }
  }
  const stem = get("stem");
  const direct = stem?.specs.mount_type === "direct_mount";
  const stemLength =
    typeof stem?.specs.length_mm === "number"
      ? stem.specs.length_mm / 1000
      : 0.04;
  const start = direct ? upperCrown : base.head;
  const bar: Point = [start[0] + stemLength, start[1] + 0.025, 0];
  const dx = front[0] - base.rear[0],
    dy = front[1] - base.rear[1],
    distance = Math.hypot(dx, dy);
  const radiusDifference = base.radius("front") - base.radius("rear");
  const settleAngle =
    distance > 0
      ? Math.asin(Math.max(-1, Math.min(1, radiusDifference / distance))) -
        Math.atan2(dy, dx)
      : 0;
  const groundedRear = rotatePoint(base.rear, settleAngle);
  return {
    ...base,
    front,
    upperCrown,
    bar,
    settleAngle,
    shockRoll:
      get("frame")?.visual_assets?.manifest.anchors.shock_upper?.rotation[1] ??
      0,
    ground: groundedRear[1] - base.radius("rear") - 0.007,
    origin: (slot) =>
      slot.startsWith("front")
        ? front
        : slot === "handlebar"
          ? bar
          : base.origin(slot),
  };
}
