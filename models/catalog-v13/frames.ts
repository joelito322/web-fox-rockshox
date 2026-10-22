import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  mergeGeometries,
  mergeVertices,
} from "three/addons/utils/BufferGeometryUtils.js";
import profiles from "../catalog-v10/frame-profiles.json";
import protectedModels from "./protected.json";
import legacyShells from "./legacy-shells.json";
import { frameBores } from "../catalog-v11/bores";
import { openBore } from "./trim";
const traces = import.meta.glob("../catalog-v5/traces/*.json", {
  eager: true,
  import: "default",
}) as Record<string, any>;
const v = (p: number[]) => new T.Vector3(...p);
function registration(row: any, p: any) {
  const a = row.asset.manifest.anchors,
    head = a.head_tube.position,
    rear = a.rear_axle.position,
    bb = p.bottom_bracket,
    h = p.head_top,
    r = p.rear_axle;
  const u = [h[0] - bb[0], bb[1] - h[1]],
    w = [r[0] - bb[0], bb[1] - r[1]],
    det = u[0] * w[1] - w[0] * u[1];
  return (pixel: number[]) => {
    const x = pixel[0] - bb[0],
      y = bb[1] - pixel[1],
      s = (x * w[1] - w[0] * y) / det,
      t = (u[0] * y - x * u[1]) / det;
    return new T.Vector3(
      s * head[0] + t * rear[0],
      s * head[1] + t * rear[1],
      0,
    );
  };
}
export function junctionDefinitions(row: any) {
  if (protectedModels.includes(row.slug))
    throw Error("Protected frame must not be rebuilt");
  const a = row.asset.manifest.anchors,
    lo = v(a.head_tube_lower.position),
    hi = v(a.head_tube.position),
    axis = hi.clone().sub(lo).normalize(),
    rear = new T.Vector3(-axis.y, axis.x, 0);
  const profile = (profiles as Record<string, any>)[row.slug];
  return ["top", "down"].map((kind) => {
    let sourceCurve: T.CatmullRomCurve3 | undefined, sourceMember: any;
    let endTangent: T.Vector3,
      endHeight: number,
      endWidth: number,
      endPoint: T.Vector3;
    if (profile) {
      const xy = registration(row, profile.image_landmarks),
        m = profile.members.find(
          (m: any) => m.name === (kind === "top" ? "top_tube" : "downtube"),
        ),
        points = m.path.map(xy);
      if (kind === "down") points[0] = new T.Vector3();
      points[points.length - 1] = kind === "top" ? hi : lo;
      const curve = new T.CatmullRomCurve3(points, false, "centripetal", 0.25);
      sourceCurve = curve;
      sourceMember = m;
      let endAt = 0.95,
        endError = Infinity;
      for (let i = 250; i <= 500; i++) {
        const q = curve.getPoint(i / 500),
          local = q.clone().sub(lo),
          s = local.dot(axis),
          r = local.addScaledVector(axis, -s).length(),
          error = Math.abs(r - 0.045);
        if (error < endError) {
          endAt = i / 500;
          endError = error;
        }
      }
      endPoint = curve.getPoint(endAt);
      endTangent = curve.getTangent(endAt).normalize();
      const ef = endAt * (m.height_mm.length - 1),
        ei = Math.min(m.height_mm.length - 2, Math.floor(ef));
      endHeight =
        T.MathUtils.lerp(m.height_mm[ei], m.height_mm[ei + 1], ef - ei) / 1000;
      endWidth = (m.width_mm / 1000) * (0.8 + 0.2 * Math.sin(Math.PI * endAt));
    } else {
      const trace = traces[`../catalog-v5/traces/${row.slug}.json`],
        xy = registration(row, trace.image_landmarks),
        section = trace.sections.find(
          (s: any) => s.name === kind || s.name === kind + "_tube",
        ),
        polygon = section.points.map(xy);
      // Use the same principal-axis sections as the immutable v10 contour,
      // rather than sampling vertically across a diagonal tube.
      const center = polygon.reduce(
        (p: T.Vector3, q: T.Vector3) =>
          p.addScaledVector(q, 1 / polygon.length),
        new T.Vector3(),
      );
      let xx = 0,
        covariance = 0,
        yy = 0;
      for (const p of polygon) {
        const x = p.x - center.x,
          y = p.y - center.y;
        xx += x * x;
        covariance += x * y;
        yy += y * y;
      }
      const angle = 0.5 * Math.atan2(2 * covariance, xx - yy),
        u = new T.Vector2(Math.cos(angle), Math.sin(angle)),
        n = new T.Vector2(-u.y, u.x);
      const projected = polygon.map((p: T.Vector3) => [
        p.x * u.x + p.y * u.y,
        p.x * n.x + p.y * n.y,
      ]);
      const min = Math.min(...projected.map((p: number[]) => p[0])),
        max = Math.max(...projected.map((p: number[]) => p[0]));
      const line: T.Vector3[] = [],
        heights: number[] = [],
        widths: number[] = [];
      const carbon = !row.slug.startsWith("trek");
      for (let i = 0; i <= 72; i++) {
        const t = i / 72,
          x = min + (max - min) * (0.0001 + t * 0.9998),
          hits: number[] = [];
        for (let j = 0; j < projected.length; j++) {
          const p = projected[j],
            q = projected[(j + 1) % projected.length];
          if (
            x >= Math.min(p[0], q[0]) &&
            x <= Math.max(p[0], q[0]) &&
            Math.abs(q[0] - p[0]) > 1e-9
          )
            hits.push(p[1] + ((q[1] - p[1]) * (x - p[0])) / (q[0] - p[0]));
        }
        if (hits.length < 2) continue;
        const low = Math.min(...hits),
          high = Math.max(...hits),
          mid = (low + high) / 2;
        line.push(new T.Vector3(x * u.x + mid * n.x, x * u.y + mid * n.y, 0));
        heights.push(Math.max(0.0001, (high - low) / 2) * 1000);
        widths.push(
          (section.depth_mm / 2) *
            (carbon
              ? 0.82 + 0.18 * Math.sin(Math.PI * t)
              : 0.94 + 0.06 * Math.sin(Math.PI * t)),
        );
      }
      if (line[0].x > line.at(-1)!.x) {
        line.reverse();
        heights.reverse();
        widths.reverse();
      }
      sourceCurve = new T.CatmullRomCurve3(line, false, "centripetal", 0.25);
      endPoint = line.at(-1)!.clone();
      endTangent = sourceCurve.getTangent(1);
      endHeight = heights.at(-1)! / 1000;
      endWidth = widths.at(-1)! / 1000;
      sourceMember = {
        height_mm: heights,
        widths_mm: widths,
        width_mm: section.depth_mm / 2,
        exponent: row.slug.startsWith("trek") ? 0.96 : 0.86,
      };
    }
    return {
      kind,
      sourceCurve,
      sourceMember,
      endTangent,
      endHeight,
      endWidth,
      endPoint,
      lo,
      hi,
      axis,
      rear,
    };
  });
}
export function junctionGeometry(row: any) {
  return rebuiltRoots(row);
}
function originalPipe(source: T.BufferGeometry, row: any) {
  if ((legacyShells as Record<string, unknown>)[row.variant.id]) {
    const a = row.asset.manifest.anchors,
      lo = v(a.head_tube_lower.position),
      hi = v(a.head_tube.position),
      axis = hi.clone().sub(lo),
      length = axis.length();
    // Three older meshes contain overlapping sleeve fragments. Rebuild only
    // their annulus at its existing radii, keeping its axis and end positions.
    const pipe = new T.LatheGeometry(
      [
        new T.Vector2(0.02715, -length / 2),
        new T.Vector2(0.033, -length / 2),
        new T.Vector2(0.033, length / 2),
        new T.Vector2(0.02715, length / 2),
        new T.Vector2(0.02715, -length / 2),
      ],
      48,
    );
    pipe.applyQuaternion(
      new T.Quaternion().setFromUnitVectors(
        new T.Vector3(0, 1, 0),
        axis.normalize(),
      ),
    );
    pipe.translate(...lo.clone().add(hi).multiplyScalar(0.5).toArray());
    for (const name of Object.keys(pipe.attributes))
      if (!source.hasAttribute(name)) pipe.deleteAttribute(name);
    return pipe;
  }
  const a = row.asset.manifest.anchors,
    lo = v(a.head_tube_lower.position),
    hi = v(a.head_tube.position),
    axis = hi.clone().sub(lo).normalize(),
    length = lo.distanceTo(hi),
    g = source.index ? source.toNonIndexed() : source.clone(),
    p = g.getAttribute("position");
  const attributes: Record<string, number[]> = {};
  for (const name of Object.keys(g.attributes)) attributes[name] = [];
  for (let i = 0; i < p.count; i += 3) {
    let keep = true;
    for (let j = 0; j < 3; j++) {
      const d = new T.Vector3().fromBufferAttribute(p, i + j).sub(lo),
        t = d.dot(axis),
        r = d.addScaledVector(axis, -t).length();
      if (r > 0.0341 || t < -0.000001 || t > length + 0.000001) keep = false;
    }
    if (keep)
      for (const name of Object.keys(attributes)) {
        const attr = g.getAttribute(name);
        for (let j = 0; j < 3; j++)
          for (let k = 0; k < attr.itemSize; k++)
            attributes[name].push(attr.array[(i + j) * attr.itemSize + k]);
      }
  }
  const result = new T.BufferGeometry();
  for (const name of Object.keys(attributes))
    result.setAttribute(
      name,
      new T.Float32BufferAttribute(
        attributes[name],
        g.getAttribute(name).itemSize,
      ),
    );
  g.dispose();
  return mergeVertices(result, 1e-6);
}
function rebuiltRoots(row: any) {
  const geometries: T.BufferGeometry[] = [];
  for (const d of junctionDefinitions(row)) {
    const curve = d.sourceCurve!,
      m = d.sourceMember,
      radial = (p: T.Vector3) => {
        const delta = p.clone().sub(d.lo),
          ax = delta.dot(d.axis);
        return delta.addScaledVector(d.axis, -ax).length();
      };
    const atRadius = (r: number) => {
      let best = Infinity,
        at = 0.8;
      for (let i = 200; i <= 1000; i++) {
        const error = Math.abs(radial(curve.getPoint(i / 1000)) - r);
        if (error < best) {
          best = error;
          at = i / 1000;
        }
      }
      return at;
    };
    const startAt = atRadius(0.16),
      joinAt = atRadius(0.065),
      join = curve.getPoint(joinAt),
      target = d.lo
        .clone()
        .lerp(d.hi, d.kind === "top" ? 0.74 : 0.26)
        .addScaledVector(d.rear, 0.006),
      tangent = curve.getTangent(joinAt);
    const root = new T.CubicBezierCurve3(
      join,
      join.clone().addScaledVector(tangent, 0.025),
      target.clone().addScaledVector(d.rear, 0.022),
      target,
    );
    const section = (t: number) => {
      const f = t * (m.height_mm.length - 1),
        i = Math.min(m.height_mm.length - 2, Math.floor(f));
      return [
        T.MathUtils.lerp(m.height_mm[i], m.height_mm[i + 1], f - i) / 1000,
        m.widths_mm
          ? T.MathUtils.lerp(m.widths_mm[i], m.widths_mm[i + 1], f - i) / 1000
          : (m.width_mm / 1000) * (0.8 + 0.2 * Math.sin(Math.PI * t)),
      ];
    };
    const [h0, w0] = section(joinAt),
      length = d.hi.distanceTo(d.lo),
      positions: number[] = [],
      indices: number[] = [],
      sides = 24,
      stations = 64;
    for (let i = 0; i <= stations; i++) {
      const t = i / stations;
      let p: T.Vector3, n: T.Vector3, h: number, w: number;
      if (t < 0.2) {
        const at = T.MathUtils.lerp(startAt, joinAt, t / 0.2);
        p = curve.getPoint(at);
        const tangent = curve.getTangent(at);
        n = new T.Vector3(-tangent.y, tangent.x, 0);
        [h, w] = section(at);
      } else {
        const q = (t - 0.2) / 0.8;
        p = root.getPoint(q);
        const tangent = root.getTangent(q);
        n = new T.Vector3(-tangent.y, tangent.x, 0);
        const blend = T.MathUtils.smoothstep(q, 0, 1);
        h = T.MathUtils.lerp(h0, Math.min(h0, length * 0.23), blend);
        w = T.MathUtils.lerp(w0, Math.min(w0, 0.029), blend);
      }
      n.normalize();
      for (let j = 0; j < sides; j++) {
        const a = (j / sides) * Math.PI * 2,
          c = Math.cos(a),
          s = Math.sin(a);
        positions.push(
          p.x + n.x * Math.sign(c) * Math.abs(c) ** (m.exponent ?? 0.9) * h,
          p.y + n.y * Math.sign(c) * Math.abs(c) ** (m.exponent ?? 0.9) * h,
          Math.sign(s) * Math.abs(s) ** (m.exponent ?? 0.9) * w,
        );
        if (i < stations) {
          const k = i * sides + j,
            l = i * sides + ((j + 1) % sides);
          indices.push(k, l, k + sides, l, l + sides, k + sides);
        }
      }
    }
    // A centre fan gives each mirrored quad identical surface triangulation.
    const surface = indices.splice(0);
    for (let at = 0; at < surface.length; at += 6) {
      const ring = [
          surface[at],
          surface[at + 1],
          surface[at + 4],
          surface[at + 2],
        ],
        center = positions.length / 3,
        point = [0, 0, 0];
      for (const index of ring)
        for (let axis = 0; axis < 3; axis++)
          point[axis] += positions[index * 3 + axis] / 4;
      positions.push(...point);
      for (let edge = 0; edge < 4; edge++)
        indices.push(center, ring[edge], ring[(edge + 1) % 4]);
    }
    for (let j = 1; j < sides - 1; j++) {
      indices.push(0, j + 1, j);
      const k = stations * sides;
      indices.push(k, k + j, k + j + 1);
    }
    const raw = new T.BufferGeometry();
    raw.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
    raw.setIndex(indices);
    raw.computeVertexNormals();
    const bore = frameBores(row)[0];
    bore.start.addScaledVector(d.axis, -0.1);
    bore.end.addScaledVector(d.axis, 0.1);
    geometries.push(openBore(raw, bore));
    raw.dispose();
  }
  const merged = mergeGeometries(geometries, false)!;
  geometries.forEach((g) => g.dispose());
  return merged;
}
async function removeLegacyRootRemnants(source: T.BufferGeometry, row: any) {
  const legacy = (
    legacyShells as Record<string, { file: string; paintable_nodes: string[] }>
  )[row.variant.id];
  if (!legacy) return source.clone();
  const reference = (await new GLTFLoader().loadAsync("/" + legacy.file)).scene;
  reference.updateMatrixWorld(true);
  const key = (points: T.Vector3[]) =>
      points
        .map((p) =>
          p
            .toArray()
            .map((x) => Math.round(x * 1e5))
            .join(","),
        )
        .sort()
        .join("|"),
    faces = new Set<string>();
  reference.traverse((n) => {
    if (!(n instanceof T.Mesh) || !legacy.paintable_nodes.includes(n.name))
      return;
    const p = n.geometry.getAttribute("position"),
      ids = n.geometry.index;
    for (let i = 0; i < (ids?.count ?? p.count); i += 3)
      faces.add(
        key(
          [0, 1, 2].map((j) =>
            new T.Vector3()
              .fromBufferAttribute(p, ids ? ids.getX(i + j) : i + j)
              .applyMatrix4(n.matrixWorld),
          ),
        ),
      );
  });
  const a = row.asset.manifest.anchors,
    lo = v(a.head_tube_lower.position),
    hi = v(a.head_tube.position),
    axis = hi.clone().sub(lo).normalize(),
    length = lo.distanceTo(hi),
    g = source.index ? source.toNonIndexed() : source.clone(),
    p = g.getAttribute("position"),
    attributes: Record<string, number[]> = {};
  for (const name of Object.keys(g.attributes)) attributes[name] = [];
  for (let i = 0; i < p.count; i += 3) {
    const points = [0, 1, 2].map((j) =>
        new T.Vector3().fromBufferAttribute(p, i + j),
      ),
      near = points.some((point) => {
        const d = point.clone().sub(lo),
          ax = d.dot(axis);
        return (
          ax > -0.1 &&
          ax < length + 0.1 &&
          d.addScaledVector(axis, -ax).length() < 0.2
        );
      });
    if (near && faces.has(key(points))) continue;
    for (const name of Object.keys(attributes)) {
      const attr = g.getAttribute(name);
      for (let j = 0; j < 3; j++)
        for (let k = 0; k < attr.itemSize; k++)
          attributes[name].push(attr.array[(i + j) * attr.itemSize + k]);
    }
  }
  const result = new T.BufferGeometry();
  for (const name of Object.keys(attributes))
    result.setAttribute(
      name,
      new T.Float32BufferAttribute(
        attributes[name],
        g.getAttribute(name).itemSize,
      ),
    );
  g.dispose();
  reference.traverse((n) => {
    if (n instanceof T.Mesh) n.geometry.dispose();
  });
  const merged = mergeVertices(result, 1e-6);
  result.dispose();
  return merged;
}
export async function frameV13(row: any) {
  if (protectedModels.includes(row.slug)) throw Error("Protected frame");
  const group = (await new GLTFLoader().loadAsync("/" + row.predecessor_file))
    .scene;
  group.updateMatrixWorld(true);
  const paint = group.getObjectByName(
    row.asset.manifest.paintable_nodes[0],
  ) as T.Mesh;
  const a = row.asset.manifest.anchors,
    lo = v(a.head_tube_lower.position),
    hi = v(a.head_tube.position),
    axis = hi.clone().sub(lo).normalize();
  const head = originalPipe(paint.geometry, row),
    original = paint.geometry;
  const roots = rebuiltRoots(row);
  const cleaned = await removeLegacyRootRemnants(original, row);
  const cut = openBore(cleaned, {
    name: "local root replacement",
    start: lo.clone().addScaledVector(axis, -0.07),
    end: hi.clone().addScaledVector(axis, 0.07),
    radius: 0.11,
  });
  const patch = openBore(
    roots,
    {
      name: "root overlap boundary",
      start: lo.clone().addScaledVector(axis, -0.07),
      end: hi.clone().addScaledVector(axis, 0.07),
      radius: 0.1102,
    },
    true,
  );
  roots.dispose();
  paint.geometry = mergeGeometries([cut, head], false)!;
  original.dispose();
  cleaned.dispose();
  cut.dispose();
  head.dispose();
  if (paint.geometry.hasAttribute("uv") && !patch.hasAttribute("uv"))
    patch.setAttribute(
      "uv",
      new T.Float32BufferAttribute(
        new Float32Array(patch.getAttribute("position").count * 2),
        2,
      ),
    );
  const combined = mergeGeometries([paint.geometry, patch], false);
  if (!combined) throw Error("Paint attributes mismatch");
  const old = paint.geometry;
  paint.geometry = mergeVertices(combined, 1e-6);
  old.dispose();
  patch.dispose();
  combined.dispose();
  return {
    group,
    anchors: row.asset.manifest.anchors,
    paintable_nodes: row.asset.manifest.paintable_nodes,
  };
}
