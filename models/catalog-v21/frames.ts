/** COMMENCAL META SX V5 exterior, offline only. No published predecessor is mutated. */
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
export function metaRegistration(row: Row) {
  if (row.slug !== "commencal-meta-sx-v5")
    throw Error("META-only exterior reconstruction");
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
    [0, 0.034],
    [length, 0.032],
  ]) {
    for (const radius of [outer, 0.02715])
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

/** Own META SX V5 members. Moving rear triangle and fixed shock support stay distinct. */
export function buildMeta(row: Row) {
  const xy = metaRegistration(row),
    a = row.asset.manifest.anchors;
  const head = vec(a.head_tube.position),
    lower = vec(a.head_tube_lower.position),
    seat = vec(a.seat_tube.position),
    rear = vec(a.rear_axle.position);
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
      source[source.length - 1] = lower.clone().lerp(head, 0.8);
    if (member.name === "downtube") {
      source[0] = new T.Vector3();
      source[source.length - 1] = lower.clone().lerp(head, 0.4);
    }
    for (const side of member.paired ? [-1, 1] : [0]) {
      const path = source.map((p) =>
        p
          .clone()
          .setZ(
            side *
              T.MathUtils.lerp(
                0.048,
                0.081,
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
      pathEvidence.push({ name: member.name, side, sampled });
      geometries.push(memberGeometry(sampled, 0.78));
    }
  }
  // The photographed small seat/top gusset is local, leaving the long upper member straight.
  const xyShape = (pixels: number[][]) =>
    new T.Shape(
      pixels.map((p) => {
        const q = xy(p);
        return new T.Vector2(q.x, q.y);
      }),
    );
  const gusset = new T.ExtrudeGeometry(
    xyShape([
      [517, 285],
      [540, 331],
      [558, 350],
      [583, 351],
      [556, 381],
      [538, 392],
    ]),
    { depth: 0.036, bevelEnabled: false },
  );
  gusset.translate(0, 0, -0.018);
  gusset.deleteAttribute("uv");
  geometries.push(gusset);
  // Rounded dropout shells, and post-mount bosses on the brake side only.
  for (const side of [-1, 1])
    geometries.push(
      sleeve(
        rear.clone().setZ(side * 0.081 - 0.009),
        rear.clone().setZ(side * 0.081 + 0.009),
        0.016,
        0.006,
      ),
    );
  const brakePoints = [
    [137, 605],
    [182, 581],
  ];
  for (const pixel of brakePoints) {
    const p = xy(pixel),
      q = p.clone().add(new T.Vector3(0, 0.018, 0));
    geometries.push(
      memberGeometry(
        samplePolyline(
          [p.clone().setZ(-0.081), q.clone().setZ(-0.081)],
          [0.008, 0.007],
          [0.007, 0.007],
          [0, 0],
        ),
        0.8,
      ),
    );
    geometries.push(
      sleeve(q.clone().setZ(-0.089), q.clone().setZ(-0.073), 0.008, 0.003),
    );
  }
  geometries.push(taperedHead(lower, head));
  const up = vec(a.saddle.position).sub(seat).normalize();
  geometries.push(
    sleeve(seat.clone().addScaledVector(up, -0.035), seat, 0.01925, 0.01645),
  );
  geometries.push(
    sleeve(
      new T.Vector3(0, 0, -0.046),
      new T.Vector3(0, 0, 0.046),
      0.027,
      0.0195,
    ),
  );
  // Fixed upper shock tabs hang from the top member; central opening receives the eye.
  const eye = vec(a.shock_upper.position),
    root = xy([796, 237]);
  for (const side of [-1, 1]) {
    const start = root.clone().setZ(side * 0.0155),
      end = eye.clone().setZ(side * 0.0155);
    geometries.push(
      memberGeometry(
        samplePolyline([start, end], [0.015, 0.012], [0.006, 0.006], [0, 0]),
        0.8,
      ),
    );
    geometries.push(
      sleeve(
        eye.clone().setZ(side * 0.0155 - 0.006),
        eye.clone().setZ(side * 0.0155 + 0.006),
        0.012,
        0.005,
      ),
    );
  }
  // Bearing housings on the rear triangle and fixed seat spine: matching counterparts, not a solid shock bridge.
  for (const pixel of [
    [582, 425],
    [591, 594],
  ])
    for (const side of [-1, 1]) {
      const p = xy(pixel);
      geometries.push(
        sleeve(
          p.clone().setZ(side * 0.048 - 0.01),
          p.clone().setZ(side * 0.048 + 0.01),
          0.018,
          0.006,
        ),
      );
    }
  for (const pixel of [
    [551, 451],
    [551, 606],
  ]) {
    const p = xy(pixel);
    geometries.push(
      sleeve(p.clone().setZ(-0.032), p.clone().setZ(0.032), 0.019, 0.007),
    );
  }
  // Rear triangle has structural bridges behind its tyre-facing wall, leaving the wheel envelope open.
  for (const pixel of [
    [566, 474],
    [568, 574],
  ]) {
    const p = xy(pixel);
    geometries.push(
      sleeve(p.clone().setZ(-0.048), p.clone().setZ(0.048), 0.012, 0.004),
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
  const bores = frameBores(row),
    axis = head.clone().sub(lower).normalize();
  bores[0].start = lower.clone().addScaledVector(axis, -0.06);
  bores[0].end = head.clone().addScaledVector(axis, 0.06);
  for (const bore of bores) {
    const next = openBore(geometry, bore);
    geometry.dispose();
    geometry = next;
  }
  // Reopen the eye after lofting its support, so no cap seals the eye centre.
  const eyeBore = {
    name: "shock_upper",
    start: eye.clone().setZ(-0.06),
    end: eye.clone().setZ(0.06),
    radius: 0.005,
  };
  const cut = openBore(geometry, eyeBore);
  geometry.dispose();
  geometry = cut;
  const lining = new T.CylinderGeometry(
      0.02715,
      0.02715,
      head.distanceTo(lower),
      48,
      1,
      true,
    ),
    idx = lining.index!,
    normals = lining.getAttribute("normal");
  for (let i = 0; i < idx.count; i += 3) {
    const k = idx.getX(i + 1);
    idx.setX(i + 1, idx.getX(i + 2));
    idx.setX(i + 2, k);
  }
  for (let i = 0; i < normals.count; i++)
    normals.setXYZ(i, -normals.getX(i), -normals.getY(i), -normals.getZ(i));
  lining.applyQuaternion(
    new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), axis),
  );
  lining.translate(...head.clone().add(lower).multiplyScalar(0.5).toArray());
  lining.deleteAttribute("uv");
  const final = mergeGeometries([geometry, lining], false)!;
  geometry.dispose();
  lining.dispose();
  geometry = mergeVertices(final, 1e-6);
  final.dispose();
  return { geometry, pathEvidence };
}

export async function frameV21(row: Row) {
  metaRegistration(row);
  const group = (await new GLTFLoader().loadAsync("/" + row.predecessor_file))
    .scene;
  group.updateMatrixWorld(true);
  const names = row.asset.manifest.paintable_nodes,
    paint = group.getObjectByName(names[0]) as T.Mesh;
  if (!paint?.isMesh || names.length !== 1)
    throw Error("Expected one META painted mesh");
  const fresh = buildMeta(row);
  paint.geometry.dispose();
  paint.geometry = fresh.geometry;
  // Keep predecessor VCS links, clevis, guards and unilateral hardware intact.
  const diagonal = fresh.pathEvidence.find(
    (p) => p.name === "downtube",
  )!.sampled;
  const xy = metaRegistration(row),
    black = new T.MeshStandardMaterial({ color: "#15191a", roughness: 0.78 });
  const patch = (
    name: string,
    pixels: number[][],
    z: number,
    depth: number,
    hole?: { pixel: number[]; radius: number },
  ) => {
    const shape = new T.Shape(
      pixels.map((p) => {
        const q = xy(p);
        return new T.Vector2(q.x, q.y);
      }),
    );
    if (hole) {
      const q = xy(hole.pixel),
        path = new T.Path();
      path.absarc(q.x, q.y, hole.radius, 0, Math.PI * 2, true);
      shape.holes.push(path);
    }
    const g = new T.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
      curveSegments: 16,
    });
    g.translate(0, 0, z);
    g.deleteAttribute("uv");
    const mesh = new T.Mesh(g, black);
    mesh.name = row.slug + "__" + name;
    group.add(mesh);
  };
  patch(
    "hanger",
    [
      [95, 638],
      [113, 640],
      [124, 653],
      [116, 677],
      [103, 686],
      [93, 678],
    ],
    0.084,
    0.007,
    { pixel: [105, 674], radius: 0.004 },
  );
  // Down-tube rubber follows the actual outside contour, rather than a displaced generic strip.
  const guardSamples = diagonal.samples
    .filter((s) => s.point.x < xy([810, 500]).x)
    .map((s) => ({
      ...s,
      point: s.point
        .clone()
        .addScaledVector(
          new T.Vector3(0, 0, 1).cross(s.tangent).normalize(),
          -s.height + 0.001,
        ),
      height: 0.003,
      width: 0.025,
    }));
  if (guardSamples.length > 1) {
    const g = memberGeometry({ ...diagonal, samples: guardSamples }, 0.8),
      m = new T.Mesh(g, black);
    m.name = row.slug + "__down_guard";
    group.add(m);
  }
  for (const side of [-1, 1])
    patch(
      "cable_port_" + side,
      [
        [1040, 209],
        [1061, 184],
        [1073, 191],
        [1052, 218],
      ],
      side > 0 ? 0.026 : -0.03,
      0.004,
    );
  const range = diagonal.straightRanges.reduce((a, b) =>
    diagonal.points[a.from].distanceTo(diagonal.points[a.to]) >
    diagonal.points[b.from].distanceTo(diagonal.points[b.to])
      ? a
      : b,
  );
  const start = diagonal.points[range.from],
    end = diagonal.points[range.to],
    center = start.clone().lerp(end, 0.54);
  let shared: T.MeshStandardMaterial | undefined;
  for (const side of [-1, 1]) {
    const name = row.slug + "__lettering_" + side,
      old = group.getObjectByName(name) as T.Mesh;
    if (old) {
      old.removeFromParent();
      old.geometry.dispose();
    }
    const mark = lettering("COMMENCAL", "#16191b", 0.35, 0.041);
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
  // Material batching is offline; index the result rather than expanding the network payload.
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
    const merged = mergeGeometries(parts, false)!;
    parts.forEach((g) => g.dispose());
    nodes.forEach((n) => n.geometry.dispose());
    target.geometry = mergeVertices(merged, 1e-9);
    merged.dispose();
    nodes.slice(1).forEach((n) => n.removeFromParent());
  }
  return { group, anchors: row.asset.manifest.anchors, paintable_nodes: names };
}
