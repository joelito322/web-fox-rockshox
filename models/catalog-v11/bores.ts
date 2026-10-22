import * as T from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
export type Bore = {
  name: string;
  start: T.Vector3;
  end: T.Vector3;
  radius: number;
};
type Vertex = { p: T.Vector3; n: T.Vector3; uv?: T.Vector2 };
function split(poly: Vertex[], plane: T.Plane) {
  const inside: Vertex[] = [],
    outside: Vertex[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i],
      b = poly[(i + 1) % poly.length],
      da = plane.distanceToPoint(a.p),
      db = plane.distanceToPoint(b.p);
    (da <= 0 ? inside : outside).push(a);
    if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
      const t = da / (da - db),
        v = {
          p: a.p.clone().lerp(b.p, t),
          n: a.n.clone().lerp(b.n, t).normalize(),
          ...(a.uv && b.uv ? { uv: a.uv.clone().lerp(b.uv, t) } : {}),
        };
      inside.push(v);
      outside.push(v);
    }
  }
  return { inside, outside };
}
/** Subtract a finite convex cylinder from surface triangles. Existing sleeves supply the interior walls. */
export function openBore(source: T.BufferGeometry, bore: Bore) {
  const axis = bore.end.clone().sub(bore.start).normalize(),
    u = new T.Vector3(1, 0, 0).cross(axis);
  if (u.lengthSq() < 0.01) u.set(0, 1, 0).cross(axis);
  u.normalize();
  const v = axis.clone().cross(u).normalize();
  const planes = [
    new T.Plane(axis.clone().negate(), axis.dot(bore.start)),
    new T.Plane(axis.clone(), -axis.dot(bore.end)),
  ];
  for (let i = 0; i < 32; i++) {
    const n = u
      .clone()
      .multiplyScalar(Math.cos((i * Math.PI) / 16))
      .addScaledVector(v, Math.sin((i * Math.PI) / 16));
    planes.push(new T.Plane(n, -n.dot(bore.start) - bore.radius));
  }
  const p = source.getAttribute("position"),
    n = source.getAttribute("normal"),
    uv = source.getAttribute("uv"),
    index = source.index,
    count = index?.count ?? p.count,
    vertices: number[] = [],
    normals: number[] = [],
    uvs: number[] = [];
  const emit = (poly: Vertex[]) => {
    for (let j = 1; j < poly.length - 1; j++) {
      const tri = [poly[0], poly[j], poly[j + 1]];
      if (
        new T.Triangle(
          ...(tri.map((v) => v.p) as [T.Vector3, T.Vector3, T.Vector3]),
        ).getArea() < 1e-14
      )
        continue;
      for (const a of tri) {
        vertices.push(...a.p.toArray());
        normals.push(...a.n.toArray());
        if (a.uv) uvs.push(...a.uv.toArray());
      }
    }
  };
  for (let i = 0; i < count; i += 3) {
    let polygon: Vertex[] = Array.from({ length: 3 }, (_, j) => {
      const at = index ? index.getX(i + j) : i + j;
      return {
        p: new T.Vector3().fromBufferAttribute(p, at),
        n: new T.Vector3().fromBufferAttribute(n, at),
        ...(uv ? { uv: new T.Vector2(uv.getX(at), uv.getY(at)) } : {}),
      };
    });
    // No intersection: preserve the original triangle rather than adding tessellation.
    if (
      planes.some((plane) =>
        polygon.every((a) => plane.distanceToPoint(a.p) >= -1e-9),
      )
    ) {
      emit(polygon);
      continue;
    }
    for (const plane of planes) {
      if (polygon.length < 3) break;
      const parts = split(polygon, plane);
      emit(parts.outside);
      polygon = parts.inside;
    }
  }
  const result = new T.BufferGeometry();
  result.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
  result.setAttribute("normal", new T.Float32BufferAttribute(normals, 3));
  if (uv) result.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
  const indexed = mergeVertices(result, 1e-6);
  result.dispose();
  return indexed;
}
export function frameBores(row: any): Bore[] {
  const a = row.asset.manifest.anchors,
    head = new T.Vector3(...a.head_tube.position),
    lower = new T.Vector3(...a.head_tube_lower.position),
    axis = head.clone().sub(lower).normalize(),
    seat = new T.Vector3(...a.seat_tube.position),
    up = new T.Vector3(...a.saddle.position).sub(seat).normalize(),
    width = (row.variant.specs.bb_shell?.width_mm ?? 83) / 1000;
  return [
    {
      name: "headset",
      start: lower.clone().addScaledVector(axis, -0.008),
      end: head.clone().addScaledVector(axis, 0.008),
      radius: 0.0272,
    },
    {
      name: "seat_collar",
      start: seat.clone().addScaledVector(up, -0.027),
      end: seat.clone().addScaledVector(up, 0.008),
      radius: (row.variant.specs.seatpost_diameter_mm ?? 31.6) / 2000 - 0.001,
    },
    {
      name: "bottom_bracket",
      start: new T.Vector3(0, 0, -width / 2 - 0.012),
      end: new T.Vector3(0, 0, width / 2 + 0.012),
      radius: 0.0195,
    },
  ];
}
