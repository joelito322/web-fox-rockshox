/** Santa Cruz Nomad 7 CC exterior, offline only. No published predecessor is mutated. */
import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  mergeGeometries,
  mergeVertices,
} from "three/addons/utils/BufferGeometryUtils.js";
import profile from "./profile.json";
import { lettering } from "../catalog-v9/decals";

import { samplePolyline } from "../catalog-v15/path";
import { frameBores } from "../catalog-v11/bores";
import { openBore } from "../catalog-v13/trim";

type Row = {
  slug: string;
  variant: any;
  asset: any;
  predecessor_file?: string;
};
type Member = {
  name: string;
  path: number[][];
  height_mm: number[];
  width_mm: number;
  corners_mm?: number[];
  paired?: boolean;
};
const vec = (p: number[]) => new T.Vector3(p[0], p[1], p[2] ?? 0);
const mm = (n: number) => n / 1000;

/** Registration uses the actual immutable assembly anchors, including each size. */
export function nomadRegistration(row: Row) {
  if (row.slug !== "santa-cruz-nomad-7-my27")
    throw Error("Nomad-only exterior reconstruction");
  const p = profile.image_landmarks,
    bb = p.bottom_bracket,
    h = p.head_top,
    r = p.rear_axle;
  const head = vec(row.asset.manifest.anchors.head_tube.position),
    rear = vec(row.asset.manifest.anchors.rear_axle.position);
  const u = [h[0] - bb[0], bb[1] - h[1]],
    v = [r[0] - bb[0], bb[1] - r[1]],
    det = u[0] * v[1] - v[0] * u[1];
  return (pixel: number[], z = 0) => {
    const x = pixel[0] - bb[0],
      y = bb[1] - pixel[1],
      a = (x * v[1] - v[0] * y) / det,
      b = (u[0] * y - x * u[1]) / det;
    return head.clone().multiplyScalar(a).addScaledVector(rear, b).setZ(z);
  };
}

/** New v22 saddle reference follows the observed final seat segment; all other anchors stay exact. */
export function nomadAnchors(row: Row) {
  const anchors = JSON.parse(JSON.stringify(row.asset.manifest.anchors));
  const seat = vec(anchors.seat_tube.position),
    old = vec(anchors.saddle.position),
    xy = nomadRegistration(row);
  const tube = profile.members.find((m) => m.name === "seat_tube")!;
  const previous = xy(tube.path.at(-2)!);
  const axis = seat.clone().sub(previous).normalize();
  anchors.saddle.position = seat
    .clone()
    .addScaledVector(axis, old.distanceTo(seat))
    .toArray();
  return anchors;
}

/** Indexed section loft: linearly varying sections retain straight silhouette edges. */
function memberGeometry(
  sampled: ReturnType<typeof samplePolyline>,
  exponent = 0.93,
) {
  const positions: number[] = [],
    indices: number[] = [],
    sides = 24;
  for (const sample of sampled.samples) {
    const n = new T.Vector3(0, 0, 1).cross(sample.tangent).normalize(),
      b = sample.tangent.clone().cross(n).normalize();
    for (let j = 0; j < sides; j++) {
      const a = (j / sides) * Math.PI * 2,
        c = Math.cos(a),
        s = Math.sin(a);
      positions.push(
        ...sample.point
          .clone()
          .addScaledVector(
            n,
            Math.sign(c) * Math.abs(c) ** exponent * sample.height,
          )
          .addScaledVector(
            b,
            Math.sign(s) * Math.abs(s) ** exponent * sample.width,
          )
          .toArray(),
      );
    }
  }
  // A mirrored centre fan avoids opposite diagonals changing the reflected surface.
  for (let i = 0; i < sampled.samples.length - 1; i++)
    for (let j = 0; j < sides; j++) {
      const a = i * sides + j,
        b = i * sides + ((j + 1) % sides),
        c = b + sides,
        d = a + sides,
        mid = positions.length / 3;
      for (let k = 0; k < 3; k++)
        positions.push(
          (positions[a * 3 + k] +
            positions[b * 3 + k] +
            positions[c * 3 + k] +
            positions[d * 3 + k]) /
            4,
        );
      indices.push(a, b, mid, b, c, mid, c, d, mid, d, a, mid);
    }
  for (let j = 1; j < sides - 1; j++) {
    indices.push(0, j + 1, j);
    const end = (sampled.samples.length - 1) * sides;
    indices.push(end, end + j, end + j + 1);
  }
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

function sleeve(from: T.Vector3, to: T.Vector3, outer: number, inner: number) {
  const shape = new T.Shape();
  shape.absarc(0, 0, outer, 0, Math.PI * 2, false);
  const hole = new T.Path();
  hole.absarc(0, 0, inner, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const g = new T.ExtrudeGeometry(shape, {
    depth: from.distanceTo(to),
    bevelEnabled: false,
    curveSegments: 32,
  });
  g.applyQuaternion(
    new T.Quaternion().setFromUnitVectors(
      new T.Vector3(0, 0, 1),
      to.clone().sub(from).normalize(),
    ),
  );
  g.translate(from.x, from.y, from.z);
  g.deleteAttribute("uv");
  return g;
}

/** Linear external taper; the assembly axis and inner opening stay unchanged. */
function taperedHead(from: T.Vector3, to: T.Vector3) {
  const positions: number[] = [],
    indices: number[] = [],
    sides = 32;
  const axis = to.clone().sub(from),
    length = axis.length();
  for (const [z, outer] of [
    [0, 0.033],
    [length, 0.03],
  ]) {
    for (const radius of [outer, z === 0 ? 0.026 : 0.0205])
      for (let j = 0; j < sides; j++) {
        const angle = (j / sides) * Math.PI * 2;
        positions.push(radius * Math.cos(angle), radius * Math.sin(angle), z);
      }
  }
  for (let j = 0; j < sides; j++) {
    const k = (j + 1) % sides,
      a = j,
      b = k,
      c = 2 * sides + j,
      d = 2 * sides + k;
    indices.push(a, b, c, b, d, c);
    indices.push(
      a + sides,
      c + sides,
      b + sides,
      b + sides,
      c + sides,
      d + sides,
    );
    indices.push(a, a + sides, b, b, a + sides, b + sides);
    indices.push(c, d, c + sides, d, d + sides, c + sides);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.applyQuaternion(
    new T.Quaternion().setFromUnitVectors(
      new T.Vector3(0, 0, 1),
      axis.normalize(),
    ),
  );
  geometry.translate(from.x, from.y, from.z);
  return geometry;
}

/** Paired front-triangle cheek webs around the low VPP clearance window. */
export function buildNomadBay(row: Row) {
  const xy = nomadRegistration(row);
  const parts: T.BufferGeometry[] = [];
  const points = (ps: number[][]) =>
    ps.map((p) => {
      const q = xy(p);
      return new T.Vector2(q.x, q.y);
    });
  const shape = new T.Shape(points(profile.bay.outer));
  shape.holes.push(new T.Path(points(profile.bay.hole)));
  for (const side of [-1, 1]) {
    const g = new T.ExtrudeGeometry(shape, {
      depth: 0.014,
      bevelEnabled: true,
      bevelSize: 0.0015,
      bevelThickness: 0.0015,
      bevelSegments: 2,
      curveSegments: 16,
    });
    g.translate(0, 0, side * 0.028 - 0.007);
    g.deleteAttribute("uv");
    parts.push(g);
  }
  const merged = mergeGeometries(parts, false)!;
  parts.forEach((g) => g.dispose());
  return merged;
}
export function buildNomadLink(row: Row) {
  const xy = nomadRegistration(row),
    parts: T.BufferGeometry[] = [];
  for (const link of profile.links) {
    const registrationPoint = link.name === "upper" ? [772, 590] : [738, 759];
    const anchor = vec(
      row.asset.manifest.anchors[
        link.name === "upper" ? "suspension_pivot" : "shock_lower"
      ].position,
    );
    const delta = anchor.sub(xy(registrationPoint));
    const linked = (p: number[]) =>
      xy(p).addScaledVector(
        delta,
        Math.max(
          0,
          1 -
            Math.hypot(
              p[0] - registrationPoint[0],
              p[1] - registrationPoint[1],
            ) /
              70,
        ),
      );
    const pts = (ps: number[][]) =>
        ps.map((p) => {
          const q = linked(p);
          return new T.Vector2(q.x, q.y);
        }),
      shape = new T.Shape(pts(link.outer));
    if (link.hole.length) shape.holes.push(new T.Path(pts(link.hole)));
    for (const p of link.bores) {
      const q = xy(p),
        hole = new T.Path();
      hole.absarc(q.x, q.y, 0.0045, 0, Math.PI * 2, true);
      shape.holes.push(hole);
    }
    for (const side of [-1, 1]) {
      const g = new T.ExtrudeGeometry(shape, {
        depth: link.depth,
        bevelEnabled: false,
        curveSegments: 20,
      });
      g.translate(0, 0, side * link.z - link.depth / 2);
      g.deleteAttribute("uv");
      parts.push(g);
    }
  }
  const merged = mergeGeometries(parts, false)!;
  parts.forEach((g) => g.dispose());
  return merged;
}
export function buildNomad(row: Row) {
  const xy = nomadRegistration(row),
    a = nomadAnchors(row),
    head = vec(a.head_tube.position),
    lower = vec(a.head_tube_lower.position),
    seat = vec(a.seat_tube.position),
    rear = vec(a.rear_axle.position),
    up = vec(a.saddle.position).sub(seat).normalize();
  const geometries: T.BufferGeometry[] = [],
    pathEvidence: {
      name: string;
      side: number;
      sampled: ReturnType<typeof samplePolyline>;
    }[] = [];
  for (const member of profile.members as Member[]) {
    const source = member.path.map((p) => xy(p));
    if (member.name === "seat_tube") source[source.length - 1] = seat.clone();
    if (member.name === "top_tube")
      source[source.length - 1] = lower.clone().lerp(head, 0.78);
    if (member.name === "downtube")
      source[source.length - 1] = lower.clone().lerp(head, 0.38);
    for (const side of member.paired ? [-1, 1] : [0]) {
      const path = source.map((p) =>
        p
          .clone()
          .setZ(
            side *
              T.MathUtils.lerp(
                member.name === "seat_fork" ? 0.03 : 0.042,
                (row.variant.specs.rear_hub?.width_mm ?? 148) / 2000 + 0.007,
                T.MathUtils.clamp(p.x / rear.x, 0, 1),
              ),
          ),
      );
      const sampled = samplePolyline(
        path,
        member.height_mm.map(mm),
        path.map(() => mm(member.width_mm)),
        (member.corners_mm ?? path.map(() => 0)).map(mm),
      );
      geometries.push(
        memberGeometry(
          sampled,
          ["top_tube", "downtube"].includes(member.name) ? 0.78 : 0.92,
        ),
      );
      pathEvidence.push({ name: member.name, side, sampled });
    }
  }
  geometries.push(taperedHead(lower, head));
  geometries.push(
    sleeve(seat.clone().addScaledVector(up, -0.04), seat, 0.02, 0.0148),
  );
  const bbw = mm(row.variant.specs.bb_shell?.width_mm ?? 73);
  geometries.push(
    sleeve(
      new T.Vector3(0, 0, -bbw / 2),
      new T.Vector3(0, 0, bbw / 2),
      0.0265,
      0.0195,
    ),
  );
  geometries.push(buildNomadBay(row));
  const webShape = new T.Shape(
    profile.junction.map((p) => {
      const v = xy(p);
      return new T.Vector2(v.x, v.y);
    }),
  );
  const web = new T.ExtrudeGeometry(webShape, {
    depth: 0.042,
    bevelEnabled: true,
    bevelSize: 0.0015,
    bevelThickness: 0.0015,
    bevelSegments: 2,
    steps: 1,
  });
  web.translate(0, 0, -0.021);
  web.deleteAttribute("uv");
  geometries.push(web);

  // Both rear dropouts and bridge shoulders are structural; UDH and brake remain unilateral.
  for (const side of [-1, 1]) {
    geometries.push(
      sleeve(
        rear.clone().setZ(side * 0.079 - 0.007),
        rear.clone().setZ(side * 0.079 + 0.007),
        0.015,
        0.006,
      ),
    );
    const fix = vec(a.suspension_pivot.position);
    geometries.push(
      sleeve(
        fix.clone().setZ(side * 0.026 - 0.008),
        fix.clone().setZ(side * 0.026 + 0.008),
        0.016,
        0.0045,
      ),
    );
  }
  // Fixed forward shock eye grows from the diagonal. The opposite eye stays on the lower link.
  const eye = vec(a.shock_upper.position),
    parent = xy([940, 770]);
  for (const side of [-1, 1]) {
    const z = side * 0.022;
    const support = memberGeometry(
      samplePolyline(
        [parent.clone().setZ(z), eye.clone().setZ(z)],
        [0.014, 0.012],
        [0.01, 0.01],
        [0, 0],
      ),
      0.9,
    );
    geometries.push(support);
    geometries.push(
      sleeve(
        eye.clone().setZ(z - 0.01),
        eye.clone().setZ(z + 0.01),
        0.013,
        0.0045,
      ),
    );
  }
  const expanded = geometries.map((g) =>
      g.index ? g.toNonIndexed() : g.clone(),
    ),
    merged = mergeGeometries(expanded, false)!;
  expanded.forEach((g) => g.dispose());
  geometries.forEach((g) => g.dispose());
  let geometry = mergeVertices(merged, 1e-6);
  merged.dispose();
  const bores = frameBores({
    ...row,
    asset: { ...row.asset, manifest: { ...row.asset.manifest, anchors: a } },
  });
  bores[0].radius = 0.0206;
  for (const bore of bores) {
    const next = openBore(geometry, bore);
    geometry.dispose();
    geometry = next;
  }
  return { geometry, pathEvidence };
}
// Only the obsolete upper/lower VPP links are removed; UDH/guard/brake hardware outside stays.
export const NOMAD_LINK_PIXEL_BOUNDS = {
  min: [688, 565],
  max: [824, 853],
  padding_m: 0.008,
} as const;
export function isRebuiltLinkTriangle(row: Row, points: T.Vector3[]) {
  const xy = nomadRegistration(row),
    mask = NOMAD_LINK_PIXEL_BOUNDS,
    bounds = new T.Box3().setFromPoints(
      [
        [mask.min[0], mask.min[1]],
        [mask.max[0], mask.min[1]],
        [mask.min[0], mask.max[1]],
        [mask.max[0], mask.max[1]],
      ].map((p) => xy(p)),
    );
  return points.some(
    (v) =>
      v.x >= bounds.min.x - mask.padding_m &&
      v.x <= bounds.max.x + mask.padding_m &&
      v.y >= bounds.min.y - mask.padding_m &&
      v.y <= bounds.max.y + mask.padding_m,
  );
}
export async function frameV22(row: Row) {
  nomadRegistration(row);
  const group = (await new GLTFLoader().loadAsync("/" + row.predecessor_file))
    .scene;
  group.updateMatrixWorld(true);
  const paint = group.getObjectByName(
    row.asset.manifest.paintable_nodes[0],
  ) as T.Mesh;
  if (!paint?.isMesh) throw Error("Expected Nomad predecessor paint");
  const fresh = buildNomad(row);
  paint.geometry.dispose();
  paint.geometry = fresh.geometry;
  const dark = group.getObjectByName(
    row.slug + "--" + row.variant.specs.size_label.toLowerCase() + "__link",
  ) as T.Mesh;
  if (!dark?.isMesh) throw Error("Expected Nomad dark hardware");
  const flat = dark.geometry.index
      ? dark.geometry.toNonIndexed()
      : dark.geometry.clone(),
    attrs = Object.keys(flat.attributes),
    values: Record<string, number[]> = {};
  attrs.forEach((k) => (values[k] = []));
  const pos = flat.getAttribute("position");
  for (let i = 0; i < pos.count; i += 3) {
    if (
      isRebuiltLinkTriangle(
        row,
        [0, 1, 2].map((j) => new T.Vector3().fromBufferAttribute(pos, i + j)),
      )
    )
      continue;
    for (const key of attrs) {
      const a = flat.getAttribute(key);
      for (let j = 0; j < 3; j++)
        for (let k = 0; k < a.itemSize; k++)
          values[key].push(a.array[(i + j) * a.itemSize + k]);
    }
  }
  const retained = new T.BufferGeometry();
  for (const key of attrs)
    retained.setAttribute(
      key,
      new T.Float32BufferAttribute(
        values[key],
        flat.getAttribute(key).itemSize,
      ),
    );
  flat.dispose();
  dark.geometry.dispose();
  dark.geometry = mergeVertices(retained, 1e-6);
  retained.dispose();
  const link = new T.Mesh(buildNomadLink(row), dark.material);
  link.name = row.slug + "__v22_links";
  group.add(link);
  const black = (dark.material as T.MeshStandardMaterial).clone();
  black.color.set("#151b1b");
  black.roughness = 0.8;
  const xy = nomadRegistration(row);
  const patch = (
    name: string,
    pixels: number[][],
    z: number,
    depth: number,
    mat: T.Material,
  ) => {
    const shape = new T.Shape(
      pixels.map((p) => {
        const v = xy(p);
        return new T.Vector2(v.x, v.y);
      }),
    );
    const g = new T.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
      curveSegments: 1,
    });
    g.translate(0, 0, z);
    g.deleteAttribute("uv");
    const m = new T.Mesh(g, mat);
    m.name = row.slug + "__" + name;
    group.add(m);
  };
  // Glovebox is a flush door on the forward/top face of the diagonal, not an open hole.
  patch(
    "glovebox",
    [
      [964, 644],
      [1001, 578],
      [1008, 578],
      [1008, 588],
      [972, 654],
    ],
    -0.027,
    0.054,
    black,
  );
  patch(
    "down_guard",
    [
      [779, 877],
      [856, 840],
      [938, 789],
      [965, 754],
      [972, 758],
      [952, 797],
      [865, 854],
      [785, 892],
    ],
    -0.029,
    0.058,
    black,
  );
  // Protection follows the drive-side chain rail; ribs are integrated rather than hovering.
  const chain = fresh.pathEvidence.find(
    (p) => p.name === "chain_stay" && p.side === 1,
  )!.sampled;
  const gp = chain.samples.map((p) =>
    p.point.clone().add(new T.Vector3(0, p.height * 0.8, 0.002)),
  );
  const guard = new T.Mesh(
    memberGeometry(
      samplePolyline(
        gp,
        gp.map(() => 0.004),
        gp.map(() => 0.014),
        gp.map(() => 0),
      ),
      0.8,
    ),
    black,
  );
  guard.name = row.slug + "__chain_guard";
  group.add(guard);
  for (let i = 2; i < gp.length - 2; i += 4) {
    const at = gp[i],
      g = new T.BoxGeometry(0.004, 0.006, 0.026);
    g.translate(at.x, at.y + 0.003, at.z);
    const m = new T.Mesh(g, black);
    m.name = row.slug + "__guard_rib_" + i;
    group.add(m);
  }

  const bolts = group.getObjectByName(
    row.slug + "--" + row.variant.specs.size_label.toLowerCase() + "__bolts",
  ) as T.Mesh;
  if (!bolts?.isMesh) throw Error("Expected Nomad steel hardware");
  const bg = bolts.geometry.index
      ? bolts.geometry.toNonIndexed()
      : bolts.geometry.clone(),
    bp = bg.getAttribute("position"),
    bn = bg.getAttribute("normal"),
    pp: number[] = [],
    nn: number[] = [];
  for (let i = 0; i < bp.count; i += 3) {
    if (
      isRebuiltLinkTriangle(
        row,
        [0, 1, 2].map((k) => new T.Vector3().fromBufferAttribute(bp, i + k)),
      )
    )
      continue;
    for (let k = 0; k < 3; k++) {
      pp.push(bp.getX(i + k), bp.getY(i + k), bp.getZ(i + k));
      nn.push(bn.getX(i + k), bn.getY(i + k), bn.getZ(i + k));
    }
  }
  const keep = new T.BufferGeometry();
  keep.setAttribute("position", new T.Float32BufferAttribute(pp, 3));
  keep.setAttribute("normal", new T.Float32BufferAttribute(nn, 3));
  bg.dispose();
  bolts.geometry.dispose();
  bolts.geometry = keep;
  for (const p of [
    [772, 590],
    [795, 690],
    [722, 834],
    [750, 813],
    [738, 759],
  ])
    for (const side of [-1, 1]) {
      const q =
          p[0] === 738
            ? vec(row.asset.manifest.anchors.shock_lower.position)
            : p[0] === 772
              ? vec(row.asset.manifest.anchors.suspension_pivot.position)
              : xy(p),
        z = side * (p[1] < 710 ? 0.043 : 0.037);
      const g = sleeve(
        q.clone().setZ(z - 0.002),
        q.clone().setZ(z + 0.002),
        0.009,
        0.003,
      );
      const m = new T.Mesh(g, bolts.material);
      m.name = row.slug + "__vpp_bearing_" + p.join("_") + "_" + side;
      group.add(m);
    }
  // Lower and upper VPP links each have a transverse bridge between their paired arms.
  for (const pixels of [
    [
      [772, 620],
      [783, 651],
    ],
    [
      [739, 807],
      [756, 791],
    ],
  ]) {
    const one = xy(pixels[0]),
      two = xy(pixels[1]);
    const bridge = new T.Mesh(
      memberGeometry(
        samplePolyline([one, two], [0.006, 0.006], [0.034, 0.034], [0, 0]),
        0.95,
      ),
      dark.material,
    );
    bridge.name = row.slug + "__vpp_bridge_" + pixels[0].join("_");
    group.add(bridge);
  }
  const diagonal = fresh.pathEvidence.find(
    (p) => p.name === "downtube",
  )!.sampled;
  const range = diagonal.straightRanges.reduce((a, b) =>
      diagonal.points[a.from].distanceTo(diagonal.points[a.to]) >
      diagonal.points[b.from].distanceTo(diagonal.points[b.to])
        ? a
        : b,
    ),
    start = diagonal.points[range.from],
    end = diagonal.points[range.to],
    center = start.clone().lerp(end, 0.48);
  let shared: T.MeshStandardMaterial | undefined;
  for (const side of [-1, 1]) {
    const name = row.slug + "__lettering_" + side,
      old = group.getObjectByName(name) as T.Mesh;
    if (old) {
      old.removeFromParent();
      old.geometry.dispose();
    }
    const mark = lettering("SANTA CRUZ", "#e62582", 0.315, 0.044);
    if (shared) {
      mark.material.map?.dispose();
      mark.material.dispose();
      mark.material = shared;
    } else shared = mark.material;
    mark.position.copy(center).setZ(side * 0.032);
    mark.rotation.z = Math.atan2(end.y - start.y, end.x - start.x);
    if (side < 0) mark.rotateY(Math.PI);
    mark.name = name;
    group.add(mark);
  }
  // Offline material grouping: disconnected islands remain separable by the existing motion rig.
  group.updateMatrixWorld(true);
  const batches = new Map<T.Material, T.Mesh[]>();
  group.traverse((n) => {
    if (n instanceof T.Mesh && !Array.isArray(n.material)) {
      const list = batches.get(n.material) ?? [];
      list.push(n);
      batches.set(n.material, list);
    }
  });
  for (const [mat, nodes] of batches) {
    if (nodes.length < 2) continue;
    const target = nodes[0],
      inverse = target.matrixWorld.clone().invert();
    const parts = nodes.map((n) => {
      let g = n.geometry.clone();
      g.applyMatrix4(inverse.clone().multiply(n.matrixWorld));
      if (!(mat as T.MeshStandardMaterial).map) g.deleteAttribute("uv");
      if (g.index) {
        const flat = g.toNonIndexed();
        g.dispose();
        g = flat;
      }
      return g;
    });
    const merged = mergeGeometries(parts, false);
    if (!merged) throw Error("Nomad material merge failed");
    parts.forEach((g) => g.dispose());
    nodes.forEach((n) => n.geometry.dispose());
    target.geometry = mergeVertices(merged, 1e-9);
    merged.dispose();
    nodes.slice(1).forEach((n) => n.removeFromParent());
  }

  const saddleMarker = group.getObjectByName("mount_saddle");
  if (saddleMarker)
    saddleMarker.position.fromArray(nomadAnchors(row).saddle.position);
  return {
    group,
    anchors: nomadAnchors(row),
    paintable_nodes: row.asset.manifest.paintable_nodes,
  };
}
