import { describe, expect, it } from "vitest";
import { CatmullRomCurve3, Line3, QuadraticBezierCurve3, Vector3 } from "three";
import { samplePolyline, type Sample, type StraightRange } from "./path";

const path = [
  new Vector3(0, 0, 0),
  new Vector3(0.08, 0.03, 0),
  new Vector3(0.3, 0.42, 0),
  new Vector3(0.44, 0.6, 0),
];
const heights = [0.03, 0.035, 0.028, 0.022];
const widths = [0.028, 0.03, 0.029, 0.025];
const bends = [0, 0.012, 0.015, 0];
function maxStraightError(samples: Sample[], ranges: StraightRange[]) {
  let error = 0;
  for (const { from, to } of ranges) {
    const start = samples[from],
      end = samples[to];
    const direction = end.point.clone().sub(start.point).normalize();
    const normal = new Vector3(-direction.y, direction.x, 0);
    for (const dimension of ["center", "height", "width"] as const) {
      for (const sign of [-1, 1]) {
        const position = (sample: Sample) => {
          if (dimension === "center") return sample.point.clone();
          return sample.point
            .clone()
            .addScaledVector(
              dimension === "height" ? normal : new Vector3(0, 0, 1),
              sign * sample[dimension],
            );
        };
        const line = new Line3(position(start), position(end));
        for (let i = from; i <= to; i++) {
          const p = position(samples[i]);
          error = Math.max(
            error,
            line.closestPointToPoint(p, true, new Vector3()).distanceTo(p),
          );
        }
      }
    }
  }
  return error;
}
describe("CAPRA piecewise straight path", () => {
  it("keeps centre and both section contours straight between bounded bends", () => {
    const result = samplePolyline(path, heights, widths, bends);
    expect(result.straightRanges).toHaveLength(3);
    expect(
      maxStraightError(result.samples, result.straightRanges),
    ).toBeLessThan(1e-12);
    for (const { from, to } of result.straightRanges) {
      const direction = result.points[to]
        .clone()
        .sub(result.points[from])
        .normalize();
      for (let i = from; i <= to; i++)
        expect(result.samples[i].tangent.distanceTo(direction)).toBeLessThan(
          1e-12,
        );
      for (let i = from; i < to; i++) {
        const tangent = result.points[i + 1]
          .clone()
          .sub(result.points[i])
          .normalize();
        expect(tangent.distanceTo(direction)).toBeLessThan(1e-12);
      }
    }
    expect(result.points[0].distanceTo(path[0])).toBe(0);
    expect(result.points.at(-1)!.distanceTo(path.at(-1)!)).toBe(0);
    expect(result.sections).toEqual(
      result.samples.map((s) => [s.height, s.width]),
    );
  });
  it("limits each roundover to 45 percent of either adjoining segment", () => {
    const result = samplePolyline(path, heights, widths, [0, 99, 99, 0]);
    for (let corner = 1; corner < path.length - 1; corner++) {
      const trim =
        Math.min(
          path[corner - 1].distanceTo(path[corner]),
          path[corner + 1].distanceTo(path[corner]),
        ) * 0.45;
      const left = result.straightRanges[corner - 1];
      const right = result.straightRanges[corner];
      expect(result.points[left.to].distanceTo(path[corner])).toBeCloseTo(
        trim,
        12,
      );
      expect(result.points[right.from].distanceTo(path[corner])).toBeCloseTo(
        trim,
        12,
      );
      for (let i = left.to; i <= right.from; i++)
        expect(result.points[i].distanceTo(path[corner])).toBeLessThanOrEqual(
          trim + 1e-12,
        );
    }
  });
  it("retains a non-overlapping straight span even between two oversized bends", () => {
    const shortPath = [
      new Vector3(0, 0, 0),
      new Vector3(0.04, 0, 0),
      new Vector3(0.04, 0.04, 0),
      new Vector3(0.08, 0.04, 0),
    ];
    const result = samplePolyline(
      shortPath,
      [0.02, 0.02, 0.02, 0.02],
      [0.01, 0.01, 0.01, 0.01],
      [0, 99, 99, 0],
    );
    const middle = result.straightRanges[1];
    const remaining = result.points[middle.from].distanceTo(
      result.points[middle.to],
    );
    expect(remaining).toBeCloseTo(0.004, 12);
    expect(remaining).toBeGreaterThan(0);
    expect(
      maxStraightError(result.samples, result.straightRanges),
    ).toBeLessThan(1e-12);
  });
  it("honours a declared 25 mm local bend beside a 60 mm segment", () => {
    const localPath = [
      new Vector3(0, 0, 0),
      new Vector3(0.06, 0, 0),
      new Vector3(0.06, 0.12, 0),
    ];
    const result = samplePolyline(
      localPath,
      [0.02, 0.02, 0.02],
      [0.01, 0.01, 0.01],
      [0, 0.025, 0],
    );
    expect(
      result.points[result.straightRanges[0].to].distanceTo(localPath[1]),
    ).toBeCloseTo(0.025, 12);
    expect(
      result.points[result.straightRanges[1].from].distanceTo(localPath[1]),
    ).toBeCloseTo(0.025, 12);
  });
  it("supports sharp deviations and does not mutate caller-owned landmarks", () => {
    const before = path.map((p) => p.toArray());
    const result = samplePolyline(path, heights, widths, [0, 0, 0, 0]);
    for (let corner = 1; corner < path.length - 1; corner++) {
      const left = result.straightRanges[corner - 1].to;
      const right = result.straightRanges[corner].from;
      expect(right).toBe(left + 1);
      expect(result.points[left].distanceTo(result.points[right])).toBeLessThan(
        1e-12,
      );
      expect(
        result.samples[left].tangent.distanceTo(result.samples[right].tangent),
      ).toBeGreaterThan(0.01);
    }
    expect(path.map((p) => p.toArray())).toEqual(before);
    expect(
      maxStraightError(result.samples, result.straightRanges),
    ).toBeLessThan(1e-12);
  });
  it("uses analytic quadratic tangents with continuous rounded boundaries", () => {
    const result = samplePolyline(path, heights, widths, bends);
    for (const sample of result.samples)
      expect(sample.tangent.length()).toBeCloseTo(1, 12);
    for (let corner = 1; corner < path.length - 1; corner++) {
      const from = result.straightRanges[corner - 1].to;
      const to = result.straightRanges[corner].from;
      expect(to - from).toBe(8);
      const curve = new QuadraticBezierCurve3(
        result.points[from],
        path[corner],
        result.points[to],
      );
      for (let i = from; i <= to; i++) {
        const t = (i - from) / (to - from);
        const exact = curve.v1
          .clone()
          .sub(curve.v0)
          .multiplyScalar(1 - t)
          .addScaledVector(curve.v2.clone().sub(curve.v1), t)
          .normalize();
        expect(result.samples[i].tangent.distanceTo(exact)).toBeLessThan(1e-12);
      }
      const incoming = path[corner]
        .clone()
        .sub(path[corner - 1])
        .normalize();
      const outgoing = path[corner + 1].clone().sub(path[corner]).normalize();
      expect(result.samples[from].tangent.distanceTo(incoming)).toBeLessThan(
        1e-12,
      );
      expect(result.samples[to].tangent.distanceTo(outgoing)).toBeLessThan(
        1e-12,
      );
    }
  });
  it("rejects the old sinusoidal width bulge even if its centreline is straight", () => {
    const result = samplePolyline(path, heights, widths, bends);
    const bad = result.samples.map((s) => ({ ...s, point: s.point.clone() }));
    const { from, to } = result.straightRanges[1];
    for (let i = from; i <= to; i++)
      bad[i].width += 0.006 * Math.sin((Math.PI * (i - from)) / (to - from));
    expect(maxStraightError(bad, result.straightRanges)).toBeGreaterThan(0.005);
  });
  it("rejects Catmull–Rom smoothing spilling over a declared straight span", () => {
    const result = samplePolyline(path, heights, widths, bends);
    const bad = result.samples.map((s) => ({ ...s, point: s.point.clone() }));
    const curve = new CatmullRomCurve3(path, false, "centripetal", 0.25);
    const { from, to } = result.straightRanges[1];
    for (let i = from; i <= to; i++)
      bad[i].point = curve.getPoint((1 + (i - from) / (to - from)) / 3);
    expect(maxStraightError(bad, result.straightRanges)).toBeGreaterThan(0.001);
  });
  it("rejects invalid sections and zero-length source segments", () => {
    expect(() =>
      samplePolyline(path, heights.slice(1), widths, bends),
    ).toThrow();
    expect(() =>
      samplePolyline(path, heights, widths, [0, -1, 0, 0]),
    ).toThrow();
    expect(() =>
      samplePolyline([path[0], path[0]], [1, 1], [1, 1], [0, 0]),
    ).toThrow();
    expect(() => samplePolyline(path, [NaN, 1, 1, 1], widths, bends)).toThrow();
  });
});
