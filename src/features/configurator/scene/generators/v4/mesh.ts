import * as T from "three";
import { MeshBuilder } from "../v3/mesh";
import type { Point } from "../../../model/assembly";

/** A full 3D section frame: transverse crowns/bars retain their physical volume. */
export class SpatialMeshBuilder extends MeshBuilder {
  override loft(points: Point[], sections: [number, number][], color: string) {
    const vertices: number[] = [],
      indices: number[] = [],
      sides = 12;
    let previousNormal: T.Vector3 | undefined;
    for (let i = 0; i < points.length; i++) {
      const before = points[Math.max(0, i - 1)];
      const after = points[Math.min(points.length - 1, i + 1)];
      const tangent = new T.Vector3(...after)
        .sub(new T.Vector3(...before))
        .normalize();
      let normal: T.Vector3;
      if (previousNormal) {
        // Parallel transport avoids twisting when a bent bar approaches the Z axis.
        normal = previousNormal
          .clone()
          .addScaledVector(tangent, -previousNormal.dot(tangent));
      } else {
        normal = new T.Vector3(0, 0, 1).cross(tangent);
      }
      if (normal.lengthSq() < 1e-8)
        normal = new T.Vector3(1, 0, 0).addScaledVector(tangent, -tangent.x);
      if (normal.lengthSq() < 1e-8)
        normal = new T.Vector3(0, 1, 0).addScaledVector(tangent, -tangent.y);
      normal.normalize();
      const binormal = tangent.clone().cross(normal).normalize();
      previousNormal = normal;
      for (let j = 0; j < sides; j++) {
        const angle = (j / sides) * Math.PI * 2;
        const [height, width] = sections[i];
        const x =
          Math.sign(Math.cos(angle)) *
          Math.abs(Math.cos(angle)) ** 0.72 *
          height;
        const z =
          Math.sign(Math.sin(angle)) *
          Math.abs(Math.sin(angle)) ** 0.72 *
          width;
        const p = new T.Vector3(...points[i])
          .addScaledVector(normal, x)
          .addScaledVector(binormal, z);
        vertices.push(...p.toArray());
        if (i < points.length - 1) {
          const q = i * sides + j,
            k = i * sides + ((j + 1) % sides);
          indices.push(q, k, q + sides, k, k + sides, q + sides);
        }
      }
    }
    for (let j = 1; j < sides - 1; j++) {
      indices.push(0, j + 1, j);
      const base = (points.length - 1) * sides;
      indices.push(base, base + j, base + j + 1);
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute(
      "position",
      new T.Float32BufferAttribute(vertices, 3),
    );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    this.add(geometry, color);
  }
}
