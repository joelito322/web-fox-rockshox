import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { Point } from "../../../model/assembly";

export const dark = "#202526",
  metal = "#a4a9aa",
  rubber = "#191c1c",
  gold = "#bc914e";
export const point = (p: Point, z: number): Point => [p[0], p[1], z];
export const mix = (a: Point, b: Point, t: number): Point =>
  a.map((v, i) => v + (b[i] - v) * t) as Point;
export type Surface = {
  color: string;
  geometry: T.BufferGeometry;
  roughness: number;
  metalness: number;
};
/** Build immutable, model-local meshes; one draw per material, no mesh per tooth or bolt. */
export class MeshBuilder {
  private groups = new Map<string, T.BufferGeometry[]>();
  add(
    geometry: T.BufferGeometry,
    color: string,
    roughness = 0.4,
    metalness = 0.55,
  ) {
    const g = geometry.index ? geometry.toNonIndexed() : geometry;
    if (g !== geometry) geometry.dispose();
    for (const name of Object.keys(g.attributes))
      if (!["position", "normal"].includes(name)) g.deleteAttribute(name);
    const key = JSON.stringify([color, roughness, metalness]);
    const list = this.groups.get(key) ?? [];
    list.push(g);
    this.groups.set(key, list);
  }
  tube(a: Point, b: Point, r: number, c: string, r2 = r, segments = 16) {
    const av = new T.Vector3(...a),
      bv = new T.Vector3(...b),
      d = bv.clone().sub(av);
    if (d.length() < 1e-6) return;
    const g = new T.CylinderGeometry(r2, r, d.length(), segments, 1);
    g.applyQuaternion(
      new T.Quaternion().setFromUnitVectors(
        new T.Vector3(0, 1, 0),
        d.normalize(),
      ),
    );
    g.translate(...mix(a, b, 0.5));
    this.add(g, c);
  }
  box(at: Point, size: Point, c: string, angle = 0) {
    const g = new T.BoxGeometry(...size);
    g.rotateZ(angle);
    g.translate(...at);
    this.add(g, c);
  }
  path(points: Point[], r: number, c: string, segments = 32) {
    const curve = new T.CatmullRomCurve3(
      points.map((p) => new T.Vector3(...p)),
    );
    this.add(new T.TubeGeometry(curve, segments, r, 8, false), c);
  }
  ring(at: Point, r: number, t: number, c: string, segments = 64) {
    const g = new T.TorusGeometry(r, t, 8, segments);
    g.translate(...at);
    this.add(g, c);
  }
  /** Rounded, tapered hydroformed sections along a planar centerline. */
  loft(points: Point[], sections: [number, number][], c: string) {
    const vertices: number[] = [],
      indices: number[] = [],
      n = 12;
    for (let i = 0; i < points.length; i++) {
      const before = points[Math.max(0, i - 1)],
        after = points[Math.min(points.length - 1, i + 1)];
      const tangent = new T.Vector3(...after)
        .sub(new T.Vector3(...before))
        .normalize();
      const normal = new T.Vector3(-tangent.y, tangent.x, 0).normalize();
      for (let j = 0; j < n; j++) {
        const a = (j / n) * Math.PI * 2,
          [h, w] = sections[i];
        // Superellipse preserves a broad face and rounded corners rather than cylindrical tubes.
        const x =
          Math.sign(Math.cos(a)) * Math.pow(Math.abs(Math.cos(a)), 0.72) * h;
        const z =
          Math.sign(Math.sin(a)) * Math.pow(Math.abs(Math.sin(a)), 0.72) * w;
        vertices.push(
          points[i][0] + normal.x * x,
          points[i][1] + normal.y * x,
          points[i][2] + z,
        );
        if (i < points.length - 1) {
          const q = i * n + j,
            k = i * n + ((j + 1) % n);
          indices.push(q, k, q + n, k, k + n, q + n);
        }
      }
    }
    for (let j = 1; j < n - 1; j++) {
      indices.push(0, j + 1, j);
      const b = (points.length - 1) * n;
      indices.push(b, b + j, b + j + 1);
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    this.add(g, c);
  }
  plate(
    points: [number, number][],
    z: number,
    depth: number,
    c: string,
    holes: { x: number; y: number; r: number }[] = [],
  ) {
    const s = new T.Shape();
    points.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
    s.closePath();
    holes.forEach((h) => {
      const p = new T.Path();
      p.absarc(h.x, h.y, h.r, 0, Math.PI * 2, true);
      s.holes.push(p);
    });
    const g = new T.ExtrudeGeometry(s, {
      depth,
      bevelEnabled: true,
      bevelSegments: 1,
      steps: 1,
      bevelSize: Math.min(0.001, depth / 3),
      bevelThickness: Math.min(0.001, depth / 3),
      curveSegments: 8,
    });
    g.translate(0, 0, z - depth / 2);
    this.add(g, c);
  }
  disc(
    at: Point,
    r: number,
    inner: number,
    depth: number,
    c: string,
    teeth = 0,
    holes = 0,
  ) {
    const s = new T.Shape(),
      steps = teeth ? teeth * 4 : 96;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2,
        rr = teeth ? (i % 4 === 1 || i % 4 === 2 ? r : r - 0.0028) : r;
      (i ? s.lineTo.bind(s) : s.moveTo.bind(s))(
        Math.cos(a) * rr,
        Math.sin(a) * rr,
      );
    }
    s.closePath();
    const center = new T.Path();
    center.absarc(0, 0, inner, 0, Math.PI * 2, true);
    s.holes.push(center);
    for (let i = 0; i < holes; i++) {
      const a = (i / holes) * Math.PI * 2,
        p = new T.Path(),
        hr = Math.min(0.004, (r - inner) * 0.18);
      p.absarc(
        Math.cos(a) * (r - 0.007),
        Math.sin(a) * (r - 0.007),
        hr,
        0,
        Math.PI * 2,
        true,
      );
      s.holes.push(p);
    }
    const g = new T.ExtrudeGeometry(s, {
      depth,
      bevelEnabled: false,
      curveSegments: 6,
    });
    g.translate(at[0], at[1], at[2] - depth / 2);
    this.add(g, c);
  }
  finish(): Surface[] {
    const result: Surface[] = [];
    for (const [key, list] of this.groups) {
      const geometry = mergeGeometries(list, false);
      list.forEach((g) => g.dispose());
      if (!geometry) throw Error("invalid_geometry");
      geometry.computeBoundingSphere();
      const [color, roughness, metalness] = JSON.parse(key);
      result.push({ geometry, color, roughness, metalness });
    }
    this.groups.clear();
    return result;
  }
}
