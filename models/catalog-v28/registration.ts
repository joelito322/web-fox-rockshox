/** TUES MK4 photo registration. Offline only; never alters commercial dimensions. */
import * as T from "three";
import config from "./registration.json";

type Anchor = { position: number[]; rotation: number[]; estimated?: boolean };
export type TuesRegistrationRow = {
  slug: string;
  variant?: { id?: string; specs?: Record<string, unknown> };
  asset: { manifest: { anchors: Record<string, Anchor> } };
};
const v = (p: number[]) => new T.Vector3(...(p as [number, number, number]));

/** One uniform scale and one rigid rotation: no independent reach/stack forcing. */
export function tuesRegistration(row: TuesRegistrationRow) {
  if (row.slug !== "yt-tues-mk4-carbon") throw Error("TUES-only registration");
  const bb = config.landmarks.bottom_bracket;
  const rear = config.landmarks.rear_axle;
  const source = new T.Vector2(rear[0] - bb[0], bb[1] - rear[1]);
  const destination = v(row.asset.manifest.anchors.rear_axle.position);
  if (Math.abs(destination.z) > 1e-10)
    throw Error("Expected planar rear anchor");
  const scale = destination.length() / source.length();
  const angle =
    Math.atan2(destination.y, destination.x) - Math.atan2(source.y, source.x);
  const c = Math.cos(angle),
    s = Math.sin(angle);
  return (pixel: number[], z = 0) => {
    const x = pixel[0] - bb[0],
      y = bb[1] - pixel[1];
    return new T.Vector3(scale * (c * x - s * y), scale * (s * x + c * y), z);
  };
}

/** Explicit estimated visual-anchor corrections for the new resource identity only. */
export function tuesAnchors(row: TuesRegistrationRow) {
  const xy = tuesRegistration(row),
    old = row.asset.manifest.anchors;
  const anchors = structuredClone(old);
  const set = (key: string, position: T.Vector3) => {
    anchors[key] = {
      ...anchors[key],
      position: position.toArray(),
      estimated: true,
    };
  };
  const center = xy(config.landmarks.head_center);
  const headAxis = v(old.head_tube.position)
    .sub(v(old.head_tube_lower.position))
    .normalize();
  const halfHead = config.estimated_head_length_mm / 2000;
  set("head_tube", center.clone().addScaledVector(headAxis, halfHead));
  set("head_tube_lower", center.clone().addScaledVector(headAxis, -halfHead));
  const seat = xy(config.landmarks.seat_top);
  const seatAxis = seat
    .clone()
    .sub(xy(config.landmarks.seat_direction_base))
    .normalize();
  const saddleLength = v(old.saddle.position).distanceTo(
    v(old.seat_tube.position),
  );
  set("seat_tube", seat);
  set("saddle", seat.clone().addScaledVector(seatAxis, saddleLength));
  const upper = xy(config.landmarks.shock_upper),
    lower = xy(config.landmarks.shock_lower);
  const shockCenter = upper.clone().add(lower).multiplyScalar(0.5);
  const shockAxis = upper.clone().sub(lower).normalize();
  const halfShock = config.commercial_shock_eye_distance_mm / 2000;
  set("shock_upper", shockCenter.clone().addScaledVector(shockAxis, halfShock));
  set(
    "shock_lower",
    shockCenter.clone().addScaledVector(shockAxis, -halfShock),
  );
  set("suspension_pivot", xy(config.landmarks.suspension_pivot));
  set("front_axle", xy(config.landmarks.front_axle));
  return anchors;
}

export function tuesAnchorCorrections(row: TuesRegistrationRow) {
  const updated = tuesAnchors(row);
  return config.changed_anchor_fields.map((anchor) => ({
    anchor,
    old: structuredClone(row.asset.manifest.anchors[anchor]),
    new: structuredClone(updated[anchor]),
  }));
}
