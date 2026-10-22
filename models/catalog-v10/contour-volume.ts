import * as T from "three";
import { RoundedMeshBuilder } from "./rounded-mesh";
import type { Point } from "../../src/features/configurator/model/assembly";
export type ContourSection = {
  name: string;
  polygon: number[][];
  depth: number;
  z: number;
  rearX?: number;
  rearZ?: number;
};
export function inside(p: number[], polygon: number[][]) {
  let yes = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i],
      b = polygon[j];
    if (
      a[1] > p[1] !== b[1] > p[1] &&
      p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      yes = !yes;
  }
  return yes;
}
/** Cross-sections retain the independently traced upper/lower contour instead of a generic straight tube. */
export function roundedContour(
  section: ContourSection,
  color: string,
  carbon: boolean,
) {
  const polygon = section.polygon,
    center = polygon.reduce(
      (p, v) => [p[0] + v[0] / polygon.length, p[1] + v[1] / polygon.length],
      [0, 0],
    );
  let xx = 0,
    xy = 0,
    yy = 0;
  for (const p of polygon) {
    const x = p[0] - center[0],
      y = p[1] - center[1];
    xx += x * x;
    xy += x * y;
    yy += y * y;
  }
  const angle = 0.5 * Math.atan2(2 * xy, xx - yy),
    u = [Math.cos(angle), Math.sin(angle)],
    v = [-u[1], u[0]];
  const projected = polygon.map((p) => [
      p[0] * u[0] + p[1] * u[1],
      p[0] * v[0] + p[1] * v[1],
    ]),
    min = Math.min(...projected.map((p) => p[0])),
    max = Math.max(...projected.map((p) => p[0]));
  const points: Point[] = [],
    sections: [number, number][] = [];
  for (let i = 0; i <= 72; i++) {
    const t = i / 72,
      x = min + (max - min) * (0.0001 + t * 0.9998),
      hits: number[] = [];
    for (let j = 0; j < projected.length; j++) {
      const a = projected[j],
        b = projected[(j + 1) % projected.length];
      if (
        x >= Math.min(a[0], b[0]) &&
        x <= Math.max(a[0], b[0]) &&
        Math.abs(a[0] - b[0]) > 1e-9
      )
        hits.push(a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0]));
    }
    if (hits.length < 2) continue;
    const lo = Math.min(...hits),
      hi = Math.max(...hits),
      middle = (lo + hi) / 2;
    const px = x * u[0] + middle * v[0],
      py = x * u[1] + middle * v[1];
    const z =
      section.rearX && section.rearZ
        ? Math.sign(section.z) *
          (Math.abs(section.z) +
            (section.rearZ - Math.abs(section.z)) *
              Math.min(1, Math.max(0, px / section.rearX)))
        : section.z;
    points.push([px, py, z]);
    const taper = carbon
      ? 0.82 + 0.18 * Math.sin(Math.PI * t)
      : 0.94 + 0.06 * Math.sin(Math.PI * t);
    sections.push([
      Math.max(0.0001, (hi - lo) / 2),
      (section.depth / 2) * taper,
    ]);
  }
  const b = new RoundedMeshBuilder();
  b.loft(points, sections, color, carbon ? 0.86 : 0.96);
  return b.finish()[0].geometry;
}
