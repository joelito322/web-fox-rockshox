import * as T from "three";
import { MeshBuilder } from "../../src/features/configurator/scene/generators/v3/mesh";
import type { Point } from "../../src/features/configurator/model/assembly";
/** Offline only. Model sections are half-extents, never commercial tube measurements. */
export class RoundedMeshBuilder extends MeshBuilder {
  override loft(
    points: Point[],
    sections: [number, number][],
    color: string,
    exponent = 0.9,
  ) {
    const vertices: number[] = [],
      indices: number[] = [],
      sides = 24;
    let previous: T.Vector3 | undefined;
    for (let i = 0; i < points.length; i++) {
      const tangent = new T.Vector3(
        ...points[Math.min(i + 1, points.length - 1)],
      )
        .sub(new T.Vector3(...points[Math.max(0, i - 1)]))
        .normalize();
      let normal =
        previous?.clone().addScaledVector(tangent, -previous.dot(tangent)) ??
        new T.Vector3(0, 0, 1).cross(tangent);
      if (normal.lengthSq() < 1e-8)
        normal = new T.Vector3(0, 1, 0).addScaledVector(tangent, -tangent.y);
      normal.normalize();
      const binormal = tangent.clone().cross(normal).normalize();
      previous = normal;
      for (let j = 0; j < sides; j++) {
        const a = (j / sides) * Math.PI * 2,
          c = Math.cos(a),
          s = Math.sin(a),
          [h, w] = sections[i];
        vertices.push(
          ...new T.Vector3(...points[i])
            .addScaledVector(normal, Math.sign(c) * Math.abs(c) ** exponent * h)
            .addScaledVector(
              binormal,
              Math.sign(s) * Math.abs(s) ** exponent * w,
            )
            .toArray(),
        );
        if (i < points.length - 1) {
          const q = i * sides + j,
            k = i * sides + ((j + 1) % sides);
          indices.push(q, k, q + sides, k, k + sides, q + sides);
        }
      }
    }
    for (let j = 1; j < sides - 1; j++) {
      indices.push(0, j + 1, j);
      const b = (points.length - 1) * sides;
      indices.push(b, b + j, b + j + 1);
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    this.add(g, color);
  }
  /** Paired machined rocker plates. The central opening remains open from either side. */
  rockerPlate(
    path: Point[],
    z: number,
    depth: number,
    color: string,
    window = false,
  ) {
    if (path.length === 2) {
      const a = new T.Vector3(...path[0]),
        b = new T.Vector3(...path[1]),
        n = new T.Vector3(-(b.y - a.y), b.x - a.x, 0)
          .normalize()
          .multiplyScalar(0.016);
      path = [
        a.clone().add(n).toArray(),
        b.clone().add(n).toArray(),
        b.clone().sub(n).toArray(),
        a.clone().sub(n).toArray(),
      ] as Point[];
      window = false;
    }
    // Expand triangular pivot centres into a rounded outside contour, retaining bearing lands.
    const center = path
      .reduce((v, p) => v.add(new T.Vector3(...p)), new T.Vector3())
      .divideScalar(path.length);
    const raw = path
      .flatMap((p) =>
        Array.from(
          { length: 16 },
          (_, i) =>
            new T.Vector2(
              p[0] + 0.013 * Math.cos((i * Math.PI) / 8),
              p[1] + 0.013 * Math.sin((i * Math.PI) / 8),
            ),
        ),
      )
      .sort((a, b) => a.x - b.x || a.y - b.y);
    const cross = (a: T.Vector2, b: T.Vector2, c: T.Vector2) =>
      (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    const lower: T.Vector2[] = [],
      upper: T.Vector2[] = [];
    for (const p of raw) {
      while (lower.length > 1 && cross(lower.at(-2)!, lower.at(-1)!, p) <= 0)
        lower.pop();
      lower.push(p);
    }
    for (const p of [...raw].reverse()) {
      while (upper.length > 1 && cross(upper.at(-2)!, upper.at(-1)!, p) <= 0)
        upper.pop();
      upper.push(p);
    }
    const points = [...lower.slice(0, -1), ...upper.slice(0, -1)];
    const shape = new T.Shape(points);
    if (window) {
      const inside = path.map(
        (p) =>
          new T.Vector2(
            center.x + (p[0] - center.x) * 0.43,
            center.y + (p[1] - center.y) * 0.43,
          ),
      );
      shape.holes.push(new T.Path(inside.reverse()));
    }
    const g = new T.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.002,
      bevelSize: 0.002,
      bevelSegments: 3,
      steps: 1,
    });
    g.translate(0, 0, z - depth / 2);
    g.computeVertexNormals();
    this.add(g, color);
  }
}
