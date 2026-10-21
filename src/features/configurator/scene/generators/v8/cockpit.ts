import * as T from "three";
import type { SelectedVariant } from "../../../../catalog/model";
import type { AssemblyV2 } from "../../../model/assemblyV2";
import type { Point } from "../../../model/assembly";
import { MeshBuilder, dark, metal, mix } from "../v3/mesh";
import { SpatialMeshBuilder } from "../v4/mesh";
import { mm } from "../v3/wheels";

export const cockpitProfiles = [
  "renthal-fatbar-35", "deity-racepoint-35", "renthal-apex-35",
  "renthal-integra-35", "oneup-v3-dropper", "wtb-volt",
] as const;
export type CockpitProfile = typeof cockpitProfiles[number];
export function isCockpitProfile(value: string | undefined): value is CockpitProfile {
  return cockpitProfiles.some(profile => profile === value);
}

/** Circular tapered section; v3/v4 lofts remain frozen for existing resources. */
function sweptTube(b: MeshBuilder, points: Point[], radii: number[], color: string) {
  const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)), false, "centripetal");
  const steps = 64, sides = 12, frames = curve.computeFrenetFrames(steps, false);
  const positions: number[] = [], indices: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, p = curve.getPointAt(t);
    const index = t * (radii.length - 1), lower = Math.min(radii.length - 2, Math.floor(index));
    const radius = T.MathUtils.lerp(radii[lower], radii[lower + 1], index - lower);
    for (let j = 0; j < sides; j++) {
      const angle = j / sides * Math.PI * 2;
      const v = p.clone().addScaledVector(frames.normals[i], Math.cos(angle) * radius)
        .addScaledVector(frames.binormals[i], Math.sin(angle) * radius);
      positions.push(v.x, v.y, v.z);
      if (i < steps) {
        const a = i * sides + j, next = i * sides + (j + 1) % sides;
        indices.push(a, next, a + sides, next, next + sides, a + sides);
      }
    }
  }
  for (let i = 1; i < sides - 1; i++) {
    indices.push(0, i + 1, i);
    const end = steps * sides;
    indices.push(end, end + i, end + i + 1);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  b.add(geometry, color, 0.36, 0.65);
}
function clamp(b: MeshBuilder, at: Point, axis: "y" | "z", inside: number, wall: number,
  length: number, color: string, start = 0, end = Math.PI * 2) {
  const shape = new T.Shape();
  if (end - start >= Math.PI * 2 - 0.001) {
    shape.absarc(0, 0, inside + wall, 0, Math.PI * 2, false);
    const hole = new T.Path(); hole.absarc(0, 0, inside, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  } else {
    shape.absarc(0, 0, inside + wall, start, end, false);
    shape.absarc(0, 0, inside, end, start, true); shape.closePath();
  }
  const g = new T.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false, curveSegments: 20 });
  g.translate(0, 0, -length / 2);
  if (axis === "y") g.rotateX(-Math.PI / 2);
  g.translate(...at); b.add(g, color, 0.34, 0.7);
}
function bolt(b: MeshBuilder, at: Point, axis: Point) {
  const end = at.map((v, i) => v + axis[i] * 0.003) as Point;
  b.tube(at, end, 0.0033, dark, 0.0033, 10);
  const socket = end.map((v, i) => v + axis[i] * 0.0002) as Point;
  b.tube(end, socket, 0.0017, metal, 0.0017, 6);
}
function handlebar(b: MeshBuilder, variant: SelectedVariant, a: AssemblyV2, color: string) {
  const half = mm(variant.specs.width_mm, 0.8) / 2;
  const rise = mm(variant.specs.rise_mm, 0.03);
  const back = Number(variant.specs.backsweep_deg ?? 7) * Math.PI / 180;
  const up = Number(variant.specs.upsweep_deg ?? 5) * Math.PI / 180;
  const center = a.bar, radius = mm(variant.specs.clamp_diameter_mm, 0.035) / 2;
  // Mirrored tube halves meet through a full circular central clamp section.
  for (const side of [-1, 1]) {
    const z = [0, 0.055, 0.1, 0.16, half];
    const points: Point[] = z.map((distance, i) => [
      center[0] - Math.max(0, distance - 0.085) * Math.tan(back),
      center[1] + (i < 2 ? 0 : i === 2 ? rise * 0.18 : i === 3 ? rise - (half - distance) * Math.tan(up) : rise),
      distance * side,
    ]);
    sweptTube(b, points, [radius, radius, 0.014, 0.0111, 0.0111], color);
    // Neutral grips are assembly accessories, rather than a claimed branded grip model.
    const outer = points[points.length - 1], inner = mix(points[3], outer, 1 - 0.125 / (half - z[3]));
    b.tube(inner, outer, 0.0145, "#222627", 0.0145, 16);
    for (let n = 1; n < 18; n++) {
      const p = mix(inner, outer, n / 18), q = mix(inner, outer, (n + 0.2) / 18);
      b.tube(p, q, 0.0149, "#313738", 0.0149, 12);
    }
    b.tube(outer, [outer[0], outer[1], outer[2] + side * 0.002], 0.0148, dark);
  }
}
function stem(b: SpatialMeshBuilder, profile: CockpitProfile, variant: SelectedVariant, a: AssemblyV2, color: string) {
  const direct = profile === "renthal-integra-35";
  const start = direct ? a.upperCrown : a.head, end = a.bar;
  const clampWidth = direct ? 0.064 : 0.0525;
  const inside = mm(variant.specs.bar_clamp_diameter_mm, 0.035) / 2;
  if (!direct) {
    clamp(b, [start[0], start[1] + 0.02, 0], "y", 0.0143, 0.0055, 0.04, color);
    for (const y of [0.008, 0.03]) {
      b.box([start[0] - 0.014, start[1] + y, 0.013], [0.014, 0.011, 0.012], color);
      bolt(b, [start[0] - 0.016, start[1] + y, 0.017], [0, 0, 1]);
    }
  }
  for (const side of [-1, 1]) {
    const z = side * (direct ? 0.024 : 0.016);
    const from: Point = direct
      ? [start[0] + 0.005, start[1] + 0.003, z]
      : [start[0] + 0.012, start[1] + 0.021, z];
    const to: Point = [end[0] - 0.013, end[1], z];
    b.loft([from, mix(from, to, 0.5), to], [[0.008, 0.008], [0.009, 0.007], [0.014, 0.01]], color);
    if (direct) {
      b.box([start[0] + 0.005, start[1] + 0.003, z], [0.027, 0.008, 0.017], color);
      bolt(b, [start[0] - 0.003, start[1] + 0.007, z], [0, 1, 0]);
    }
  }
  clamp(b, end, "z", inside, 0.005, clampWidth, color, Math.PI / 2, Math.PI * 1.5);
  const faceColor = direct ? "#b7a46e" : color;
  for (const side of [-1, 1]) {
    const z = side * (clampWidth / 2 - 0.007);
    clamp(b, [end[0], end[1], z], "z", inside, 0.005, 0.013, faceColor, -Math.PI / 2, Math.PI / 2);
    for (const y of [-1, 1]) {
      b.box([end[0] + 0.003, end[1] + y * 0.021, z], [0.012, 0.01, 0.013], faceColor);
      bolt(b, [end[0] + 0.009, end[1] + y * 0.021, z], [1, 0, 0]);
    }
  }
}
function seatpost(b: MeshBuilder, v: SelectedVariant, a: AssemblyV2) {
  const axis = new T.Vector3(...a.saddle).sub(new T.Vector3(...a.seat)).normalize();
  const move = (at: Point, distance: number): Point => new T.Vector3(...at).addScaledVector(axis, distance).toArray() as Point;
  const diameter = mm(v.specs.diameter_mm, 0.0316), travel = mm(v.specs.travel_mm, 0.18);
  const outerLength = mm(v.specs.length_mm, 0.489) - travel - 0.03;
  const collar = move(a.seat, 0.012), head = move(a.saddle, -0.019);
  b.tube(move(collar, -outerLength), collar, diameter / 2, "#292d2e", diameter / 2, 24);
  b.tube(collar, move(collar, 0.008), diameter / 2 + 0.0025, dark, diameter / 2 + 0.0025, 24);
  b.tube(move(collar, 0.007), head, 0.0125, "#111516", 0.0125, 24);
  b.box([head[0], head[1] + 0.004, 0], [0.036, 0.012, 0.038], dark);
  for (const x of [-0.014, 0.014]) bolt(b, [head[0] + x, head[1] + 0.009, 0], [0, 1, 0]);
  // Rail beds join the saddle rails; underside details not visible in references are inferred.
  for (const side of [-1, 1]) b.tube([head[0] - 0.017, a.saddle[1] - 0.008, side * 0.019],
    [head[0] + 0.017, a.saddle[1] - 0.008, side * 0.019], 0.0045, dark);
}
function saddle(b: MeshBuilder, v: SelectedVariant, a: AssemblyV2, color: string) {
  const length = mm(v.specs.length_mm, 0.265), width = mm(v.specs.width_mm, 0.142), at = a.saddle;
  const rows = 36, sides = 20, positions: number[] = [], indices: number[] = [];
  for (let i = 0; i <= rows; i++) {
    const t = i / rows, x = (t - 0.5) * length;
    const widthFactor = t < 0.26
      ? Math.sqrt(Math.max(0.002, 1 - ((t - 0.26) / 0.26) ** 2))
      : t < 0.48 ? 1 - (t - 0.26) * 0.82
      : t < 0.78 ? 0.8196 - (t - 0.48) * 1.899
      : 0.25 * Math.sqrt(Math.max(0.005, 1 - ((t - 0.78) / 0.22 * 0.99) ** 2));
    const half = width / 2 * widthFactor;
    for (let j = 0; j < sides; j++) {
      const angle = j / sides * Math.PI * 2, z = Math.cos(angle) * half;
      const top = Math.sin(angle), relief = top > 0 ? 0.006 * Math.exp(-((z / 0.014) ** 2)) * Math.sin(Math.PI * t) : 0;
      const y = 0.015 + (t < 0.3 ? 0.014 * (1 - t / 0.3) : 0) + top * (top > 0 ? 0.009 : 0.005) - relief;
      positions.push(at[0] + x, at[1] + y, z);
      if (i < rows) {
        const n = i * sides + j, next = i * sides + (j + 1) % sides;
        indices.push(n, next, n + sides, next, next + sides, n + sides);
      }
    }
  }
  for (let j = 1; j < sides - 1; j++) {
    indices.push(0, j + 1, j); const end = rows * sides;
    indices.push(end, end + j, end + j + 1);
  }
  const cover = new T.BufferGeometry();
  cover.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  cover.setIndex(indices); cover.computeVertexNormals(); b.add(cover, color, 0.8, 0.05);
  for (const side of [-1, 1]) b.path([
    [at[0] - 0.08, at[1] + 0.012, side * 0.028],
    [at[0] - 0.045, at[1] - 0.008, side * 0.021],
    [at[0] + 0.04, at[1] - 0.008, side * 0.021],
    [at[0] + 0.085, at[1] + 0.009, side * 0.012],
  ], 0.0035, metal, 24);
}
export function buildCockpit(profile: CockpitProfile, v: SelectedVariant, a: AssemblyV2, color: string) {
  const b = new SpatialMeshBuilder();
  if (profile === "renthal-fatbar-35" || profile === "deity-racepoint-35") handlebar(b, v, a, color);
  else if (profile === "renthal-apex-35" || profile === "renthal-integra-35") stem(b, profile, v, a, color);
  else if (profile === "oneup-v3-dropper") seatpost(b, v, a);
  else saddle(b, v, a, color);
  return b.finish();
}
