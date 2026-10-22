import * as T from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
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
/** Offline convex window cut, preserving source normals; no product/runtime CSG. */
export function openWindow(
  source: T.BufferGeometry,
  points: T.Vector3[],
  zmin = -0.12,
  zmax = 0.12,
) {
  const center = points
    .reduce((a, p) => a.add(p), new T.Vector3())
    .multiplyScalar(1 / points.length);
  const planes = [
    new T.Plane(new T.Vector3(0, 0, -1), zmin),
    new T.Plane(new T.Vector3(0, 0, 1), -zmax),
  ];
  for (let i = 0; i < points.length; i++) {
    const p = points[i],
      q = points[(i + 1) % points.length],
      edge = q.clone().sub(p),
      n = new T.Vector3(edge.y, -edge.x, 0).normalize(),
      plane = new T.Plane(n, -n.dot(p));
    if (plane.distanceToPoint(center) > 0) plane.negate();
    planes.push(plane);
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
