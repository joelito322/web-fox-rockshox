import * as T from "three";
import type { SelectedVariant } from "../../catalog/model";
import type { Point } from "../model/assembly";

/** Match the frozen handlebar centerline, rather than its central stem clamp. */
export function leverMount(bar: Point, handlebar: SelectedVariant, front: boolean, inset = 0.145) {
  const width = Number(handlebar.specs.width_mm ?? 780) / 1000;
  const rise = Number(handlebar.specs.rise_mm ?? 25) / 1000;
  const half = width / 2, side = front ? -1 : 1;
  const distance = half - inset;
  const commercial = handlebar.visual_assets?.generator_key === "atlas-bike-v8";
  let center: T.Vector3, tangent: T.Vector3;
  if (commercial) {
    const back = Math.tan(Number(handlebar.specs.backsweep_deg ?? 7) * Math.PI / 180);
    const up = Math.tan(Number(handlebar.specs.upsweep_deg ?? 5) * Math.PI / 180);
    const points = [0, 0.055, 0.1, 0.16, half].map((z, i) => new T.Vector3(
      bar[0] - Math.max(0, z - 0.085) * back,
      bar[1] + (i < 2 ? 0 : i === 2 ? rise * 0.18 : i === 3 ? rise - (half - z) * up : rise),
      side * z,
    ));
    const curve = new T.CatmullRomCurve3(points, false, "centripetal");
    // Find the centerline at the existing clamp's lateral position.
    let lo = 0, hi = 1;
    for (let i = 0; i < 40; i++) {
      const t = (lo + hi) / 2;
      if (Math.abs(curve.getPoint(t).z) < distance) lo = t; else hi = t;
    }
    const t = (lo + hi) / 2;
    center = curve.getPoint(t);
    tangent = curve.getTangent(t).multiplyScalar(side);
  } else {
    // V3–V7 use a straight outer segment between the last two loft stations.
    const t = (distance - 0.18) / (half - 0.18);
    center = new T.Vector3(bar[0] - 0.012 - 0.028 * t, bar[1] + rise * (0.65 + 0.35 * t), side * distance);
    tangent = new T.Vector3(-0.028 * side, rise * 0.35 * side, half - 0.18).normalize();
  }
  return {
    original: new T.Vector3(bar[0], bar[1], side * distance),
    center,
    rotation: new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 0, 1), tangent.normalize()),
  };
}

/** Instance-only mounting correction; keep the wheel end and lower hose fixed. */
export function mountLeverGeometry(source: T.BufferGeometry, mount: ReturnType<typeof leverMount>, shifter = false) {
  const result = source.clone(), positions = result.getAttribute("position");
  const original = new T.Vector3(), moved = new T.Vector3();
  for (let i = 0; i < positions.count; i++) {
    original.fromBufferAttribute(positions, i);
    const height = original.y - mount.original.y;
    // Upper controls move rigidly; the lower hose blends back to rest.
    const blend = T.MathUtils.smoothstep(height, shifter ? -0.22 : -0.16, shifter ? -0.12 : -0.065);
    moved.copy(original).sub(mount.original).applyQuaternion(mount.rotation).add(mount.center);
    original.lerp(moved, blend);
    positions.setXYZ(i, original.x, original.y, original.z);
  }
  result.computeVertexNormals(); result.computeBoundingBox(); result.computeBoundingSphere();
  return result;
}

/** The frozen shifter body was authored at z=240 mm, independently of bar width. */
export function shifterMount(bar: Point, handlebar: SelectedVariant) {
  const mount = leverMount(bar, handlebar, false, 0.17);
  mount.original.z = 0.24;
  return mount;
}
