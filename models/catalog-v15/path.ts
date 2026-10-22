/** Offline CAPRA path sampling: straight members with explicitly bounded bends. */
import { MathUtils, QuadraticBezierCurve3, Vector3 } from "three";

export type Sample = {
  point: Vector3;
  tangent: Vector3;
  height: number;
  width: number;
  straight?: number;
};
export type StraightRange = { from: number; to: number };

/** Dimensions and corner trim distances share the path's physical unit (metres).
 * Each explicit local trim is capped at 45% of either adjacent segment, so two
 * neighbouring bends retain at least 10% of their shared segment as a straight.
 */
export function samplePolyline(
  path: Vector3[],
  halfHeights: number[],
  widths: number[],
  cornerDistances: number[],
) {
  if (
    path.length < 2 ||
    halfHeights.length !== path.length ||
    widths.length !== path.length ||
    cornerDistances.length !== path.length
  )
    throw Error(
      "Path, sections and corner distances must have matching lengths",
    );
  if (
    path.some((p) => ![p.x, p.y, p.z].every(Number.isFinite)) ||
    [...halfHeights, ...widths].some((n) => !Number.isFinite(n) || n <= 0) ||
    cornerDistances.some((n) => !Number.isFinite(n) || n < 0)
  )
    throw Error("Path and sections must contain finite positive dimensions");
  const lengths = path.slice(1).map((p, i) => p.distanceTo(path[i]));
  if (lengths.some((length) => length < 1e-9))
    throw Error("Consecutive path points must be distinct");
  const trims = path.map((_, i) =>
    i === 0 || i === path.length - 1
      ? 0
      : Math.min(cornerDistances[i], lengths[i - 1] * 0.45, lengths[i] * 0.45),
  );
  const at = (segment: number, distance: number): Sample => {
    const t = distance / lengths[segment];
    return {
      point: path[segment].clone().lerp(path[segment + 1], t),
      tangent: path[segment + 1].clone().sub(path[segment]).normalize(),
      height: MathUtils.lerp(halfHeights[segment], halfHeights[segment + 1], t),
      width: MathUtils.lerp(widths[segment], widths[segment + 1], t),
    };
  };
  const samples: Sample[] = [];
  const straightRanges: StraightRange[] = [];
  const append = (sample: Sample) => {
    // Rounded boundaries share the same analytic tangent. An explicitly sharp
    // zero-radius corner needs separate coincident rings with its two tangents.
    const last = samples.at(-1);
    if (
      last &&
      last.point.distanceToSquared(sample.point) < 1e-24 &&
      last.tangent.distanceToSquared(sample.tangent) < 1e-20
    ) {
      if (sample.straight !== undefined) last.straight = sample.straight;
      return samples.length - 1;
    }
    samples.push(sample);
    return samples.length - 1;
  };
  for (let segment = 0; segment < lengths.length; segment++) {
    const start = at(segment, trims[segment]);
    const end = at(segment, lengths[segment] - trims[segment + 1]);
    const count = Math.max(
      2,
      Math.ceil(start.point.distanceTo(end.point) / 0.01),
    );
    const straight = straightRanges.length;
    const from = append({ ...start, straight });
    for (let i = 1; i <= count; i++) {
      const t = i / count;
      append({
        point: start.point.clone().lerp(end.point, t),
        tangent: start.tangent.clone(),
        height: MathUtils.lerp(start.height, end.height, t),
        width: MathUtils.lerp(start.width, end.width, t),
        straight,
      });
    }
    straightRanges.push({ from, to: samples.length - 1 });
    const corner = segment + 1;
    if (corner < path.length - 1 && trims[corner] > 0) {
      const next = at(corner, trims[corner]);
      const bend = new QuadraticBezierCurve3(
        end.point,
        path[corner],
        next.point,
      );
      for (let i = 1; i <= 8; i++) {
        const t = i / 8;
        append({
          point: bend.getPoint(t),
          // Three's QuadraticBezierCurve3 inherits finite-difference getTangent;
          // use the exact derivative so its endpoint matches the next line.
          tangent: path[corner]
            .clone()
            .sub(end.point)
            .multiplyScalar(1 - t)
            .addScaledVector(next.point.clone().sub(path[corner]), t)
            .normalize(),
          height: MathUtils.lerp(end.height, next.height, t),
          width: MathUtils.lerp(end.width, next.width, t),
        });
      }
    }
  }
  return {
    samples,
    points: samples.map((sample) => sample.point),
    sections: samples.map((sample): [number, number] => [
      sample.height,
      sample.width,
    ]),
    straightRanges,
  };
}
