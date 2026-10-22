/** CAPRA-only offline successor. Published v13 resources are never mutated. */
import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  mergeGeometries,
  mergeVertices,
} from "three/addons/utils/BufferGeometryUtils.js";
import { junctionDefinitions } from "../catalog-v13/frames";
import { openBore } from "../catalog-v13/trim";
import { frameBores } from "../catalog-v11/bores";
const v = (a: number[]) => new T.Vector3(...a);
export function capraRoots(row: any) {
  if (row.slug !== "yt-capra-mk3-carbon-mx")
    throw Error("CAPRA-only correction");
  const parts: T.BufferGeometry[] = [];
  for (const d of junctionDefinitions(row)) {
    const curve = d.sourceCurve!,
      m = d.sourceMember;
    const radial = (p: T.Vector3) => {
      const q = p.clone().sub(d.lo),
        a = q.dot(d.axis);
      return q.addScaledVector(d.axis, -a).length();
    };
    const atRadius = (radius: number) => {
      let at = 0.8,
        error = Infinity;
      for (let i = 200; i <= 1000; i++) {
        const e = Math.abs(radial(curve.getPoint(i / 1000)) - radius);
        if (e < error) {
          at = i / 1000;
          error = e;
        }
      }
      return at;
    };
    const from = atRadius(0.2),
      joinAt = atRadius(0.14),
      join = curve.getPoint(joinAt);
    const target = d.lo
      .clone()
      .lerp(d.hi, d.kind === "top" ? 0.67 : 0.43)
      .addScaledVector(d.rear, 0.006);
    const sections = (t: number) => {
      const f = t * (m.height_mm.length - 1),
        i = Math.min(m.height_mm.length - 2, Math.floor(f));
      return [
        T.MathUtils.lerp(m.height_mm[i], m.height_mm[i + 1], f - i) / 1000,
        (m.width_mm / 1000) * (0.8 + 0.2 * Math.sin(Math.PI * t)),
      ];
    };
    const upperCurve = new T.CubicBezierCurve3(
      join,
      join.clone().addScaledVector(curve.getTangent(joinAt), 0.045),
      target.clone().addScaledVector(d.rear, 0.025),
      target,
    );
    const [h0, w0] = sections(joinAt),
      length = d.lo.distanceTo(d.hi),
      positions: number[] = [],
      indices: number[] = [],
      sides = 24,
      stations = 64;
    for (let i = 0; i <= stations; i++) {
      const t = i / stations;
      let p: T.Vector3, tangent: T.Vector3, h: number, w: number;
      if (t < 0.2) {
        const at = T.MathUtils.lerp(from, joinAt, t / 0.2);
        p = curve.getPoint(at);
        tangent = curve.getTangent(at);
        [h, w] = sections(at);
      } else {
        const q = (t - 0.2) / 0.8;
        // A straight local centreline replaces v13's generic S-shaped bend.
        p =
          d.kind === "top"
            ? upperCurve.getPoint(q)
            : join.clone().lerp(target, q);
        tangent =
          d.kind === "top"
            ? upperCurve.getTangent(q)
            : target.clone().sub(join).normalize();
        const blend = T.MathUtils.smoothstep(q, 0, 1);
        h = T.MathUtils.lerp(
          h0,
          Math.min(h0, length * (d.kind === "top" ? 0.18 : 0.22)),
          blend,
        );
        w = T.MathUtils.lerp(w0, Math.min(w0, 0.029), blend);
      }
      const n = new T.Vector3(-tangent.y, tangent.x, 0).normalize();
      for (let j = 0; j < sides; j++) {
        const a = (j / sides) * Math.PI * 2,
          c = Math.cos(a),
          s = Math.sin(a);
        positions.push(
          p.x + n.x * Math.sign(c) * Math.abs(c) ** 0.9 * h,
          p.y + n.y * Math.sign(c) * Math.abs(c) ** 0.9 * h,
          Math.sign(s) * Math.abs(s) ** 0.9 * w,
        );
        if (i < stations) {
          const k = i * sides + j,
            l = i * sides + ((j + 1) % sides);
          indices.push(k, l, k + sides, l, l + sides, k + sides);
        }
      }
    }
    const surface = indices.splice(0);
    for (let at = 0; at < surface.length; at += 6) {
      const ring = [
          surface[at],
          surface[at + 1],
          surface[at + 4],
          surface[at + 2],
        ],
        center = positions.length / 3,
        p = [0, 0, 0];
      for (const k of ring)
        for (let axis = 0; axis < 3; axis++)
          p[axis] += positions[k * 3 + axis] / 4;
      positions.push(...p);
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
    parts.push(openBore(raw, bore));
    raw.dispose();
  }
  const result = mergeGeometries(parts, false)!;
  parts.forEach((p) => p.dispose());
  return result;
}
function originalPipe(source: T.BufferGeometry, row: any) {
  const a = row.asset.manifest.anchors,
    lo = v(a.head_tube_lower.position),
    hi = v(a.head_tube.position),
    axis = hi.clone().sub(lo).normalize(),
    length = lo.distanceTo(hi);
  const g = source.index ? source.toNonIndexed() : source.clone(),
    p = g.getAttribute("position"),
    attributes: Record<string, number[]> = {};
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
export async function frameV14(row: any) {
  if (row.slug !== "yt-capra-mk3-carbon-mx")
    throw Error("CAPRA-only correction");
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
  const original = paint.geometry,
    pipe = originalPipe(original, row),
    roots = capraRoots(row);
  const bore = {
    name: "CAPRA local roots",
    start: lo.clone().addScaledVector(axis, -0.07),
    end: hi.clone().addScaledVector(axis, 0.07),
    radius: 0.16,
  };
  const cut = openBore(original, bore),
    patch = openBore(roots, { ...bore, radius: 0.1602 }, true);
  if (original.hasAttribute("uv") && !patch.hasAttribute("uv"))
    patch.setAttribute(
      "uv",
      new T.Float32BufferAttribute(
        new Float32Array(patch.getAttribute("position").count * 2),
        2,
      ),
    );
  const combined = mergeGeometries([cut, pipe, patch], false)!;
  paint.geometry = mergeVertices(combined, 1e-6);
  [original, pipe, roots, cut, patch, combined].forEach((g) => g.dispose());
  return {
    group,
    anchors: row.asset.manifest.anchors,
    paintable_nodes: row.asset.manifest.paintable_nodes,
  };
}
