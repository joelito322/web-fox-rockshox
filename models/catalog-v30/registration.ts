import * as T from "three";
import config from "./registration.json";
export type Row = {
  slug: string;
  variant: any;
  asset: any;
  predecessor_file?: string;
};
const vec = (p: number[]) => new T.Vector3(p[0], p[1], p[2] ?? 0);
/** Oblique frameset photo rectified to the published size-specific BB/rear/head geometry. */
export function v10Registration(row: Row) {
  if (row.slug !== "santa-cruz-v10-8-my27")
    throw Error("V10-only registration");
  const b = config.landmarks.bottom_bracket,
    h = config.landmarks.head_top,
    r = config.landmarks.rear_axle,
    a = row.asset.manifest.anchors,
    u = [h[0] - b[0], b[1] - h[1]],
    v = [r[0] - b[0], b[1] - r[1]],
    det = u[0] * v[1] - v[0] * u[1];
  return (pixel: number[], z = 0) => {
    const x = pixel[0] - b[0],
      y = b[1] - pixel[1],
      c = (x * v[1] - v[0] * y) / det,
      d = (u[0] * y - x * u[1]) / det;
    return vec(a.head_tube.position)
      .multiplyScalar(c)
      .addScaledVector(vec(a.rear_axle.position), d)
      .setZ(z);
  };
}
export function v10Anchors(
  row: Row,
): Record<
  string,
  { position: number[]; rotation: number[]; estimated?: boolean }
> {
  const a = structuredClone(row.asset.manifest.anchors),
    xy = v10Registration(row),
    seat = xy(config.landmarks.seat_top),
    base = xy(config.landmarks.seat_direction_base),
    length = vec(a.saddle.position).distanceTo(vec(a.seat_tube.position));
  a.seat_tube.position = seat.toArray();
  a.saddle.position = seat
    .clone()
    .addScaledVector(seat.clone().sub(base).normalize(), length)
    .toArray();
  const upper = xy(config.landmarks.shock_upper),
    lower = xy(config.landmarks.shock_lower),
    center = upper.clone().add(lower).multiplyScalar(0.5),
    axis = upper.clone().sub(lower).normalize();
  a.shock_upper.position = center
    .clone()
    .addScaledVector(axis, 0.125)
    .toArray();
  a.shock_lower.position = center
    .clone()
    .addScaledVector(axis, -0.125)
    .toArray();
  a.suspension_pivot.position = xy(config.landmarks.lower_fixed).toArray();
  return a;
}
