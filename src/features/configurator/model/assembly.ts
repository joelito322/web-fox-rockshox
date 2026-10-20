import type { Configuration, VariantMap, Slot } from "./index";
export type Point = [number, number, number];
export type Assembly = {
  rear: Point;
  front: Point;
  seat: Point;
  head: Point;
  lower: Point;
  saddle: Point;
  bar: Point;
  shockUpper: Point;
  shockLower: Point;
  ground: number;
  radius: (position: "front" | "rear") => number;
  origin: (slot: Slot) => Point;
};
function point(value: unknown, fallback: Point): Point {
  if (value && typeof value === "object" && "position" in value)
    value = value.position;
  return Array.isArray(value) &&
    value.length === 3 &&
    value.every(
      (v) => typeof v === "number" && Number.isFinite(v) && Math.abs(v) < 5,
    )
    ? (value as Point)
    : fallback;
}
export function assembly(
  configuration: Configuration,
  variants: VariantMap,
): Assembly {
  const get = (slot: Slot) =>
    variants[configuration.items.find((i) => i.slot === slot)?.variantId ?? ""];
  const frame = get("frame");
  const anchors = frame?.visual_assets?.manifest.anchors ?? {};
  const rawScale = Number(frame?.visual_assets?.manifest.parameters.size_scale);
  const scale = Number.isFinite(rawScale)
    ? Math.min(1.4, Math.max(0.7, rawScale))
    : 1;
  const rear = point(anchors.rear_axle, [-0.44, 0.035, 0]),
    front = point(anchors.front_axle, [0.78, 0.035, 0]);
  const seat = point(anchors.seat_tube, [-0.17, 0.46 * scale, 0]),
    head = point(anchors.head_tube, [0.57, 0.5 * scale, 0]),
    lower = point(anchors.head_tube_lower, [0.62, 0.38 * scale, 0]);
  const saddle = point(anchors.saddle, [-0.2, 0.615 * scale, 0]),
    bar = point(anchors.handlebar, [0.54, 0.62 * scale, 0]);
  const shockUpper = point(anchors.shock_upper, [
    seat[0] * 0.7,
    seat[1] * 0.7,
    0,
  ]);
  const shockLower = point(anchors.shock_lower, [
    lower[0] * 0.4,
    lower[1] * 0.4,
    0,
  ]);
  const radius = (position: "front" | "rear") => {
    const tire = get(`${position}_tire`);
    const rim = get(`${position}_rim`);
    const measured = tire?.specs.outer_diameter_mm;
    if (typeof measured === "number") return measured / 2000;
    const bsd = tire?.specs.wheel_bsd_mm ?? rim?.specs.wheel_bsd_mm;
    const width = tire?.specs.tire_width_mm;
    return typeof bsd === "number"
      ? (bsd / 2 + (typeof width === "number" ? width : 58)) / 1000
      : 0.36;
  };
  const origin = (slot: Slot): Point =>
    slot.startsWith("front")
      ? front
      : slot.startsWith("rear") || slot === "cassette"
        ? rear
        : slot === "fork" || slot === "stem" || slot === "handlebar"
          ? head
          : slot === "seatpost"
            ? seat
            : slot === "saddle"
              ? saddle
              : slot === "shock"
                ? point(anchors.shock_upper, [-0.14, 0.31, 0])
                : [0, 0, 0];
  return {
    rear,
    front,
    seat,
    head,
    lower,
    saddle,
    bar,
    shockUpper,
    shockLower,
    radius,
    ground:
      Math.min(rear[1] - radius("rear"), front[1] - radius("front")) - 0.007,
    origin,
  };
}
