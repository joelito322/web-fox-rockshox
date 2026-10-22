/** YT TUES MK4 Carbon exterior, offline only. No published predecessor is mutated. */
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
export function tuesRegistration(row: Row) {
  if (row.slug !== "yt-tues-mk4-carbon")
    throw Error("TUES-only exterior reconstruction");
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
    sides = 96;
  const axis = to.clone().sub(from),
    length = axis.length();
  for (const [z, outer] of [
    [0, 0.034],
    [length, 0.032],
  ]) {
    for (const radius of [outer, 0.0272])
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
  const flat = geometry.toNonIndexed();
  flat.computeVertexNormals();
  geometry.dispose();
  const indexed = mergeVertices(flat, 1e-6);
  flat.dispose();
  return indexed;
}

export function tuesAnchors(row: Row) {
  const anchors = structuredClone(row.asset.manifest.anchors),
    xy = tuesRegistration(row),
    tube = profile.members.find((m) => m.name === "seat_tube")!;
  const seat = vec(anchors.seat_tube.position),
    old = vec(anchors.saddle.position),
    axis = seat
      .clone()
      .sub(xy(tube.path[tube.path.length - 2]))
      .normalize();
  anchors.saddle.position = seat
    .clone()
    .addScaledVector(axis, old.distanceTo(seat))
    .toArray();
  return anchors;
}
function plate(
  row: Row,
  pixels: number[][],
  depth: number,
  z: number,
  holes: number[][][] = [],
  bores: { pixel?: number[]; point?: T.Vector3; radius: number }[] = [],
) {
  const xy = tuesRegistration(row),
    points = (ps: number[][]) =>
      ps.map((p) => {
        const q = xy(p);
        return new T.Vector2(q.x, q.y);
      }),
    shape = new T.Shape();
  const outline = points(pixels);
  for (let i = 0; i < outline.length; i++) {
    const prev = outline[(i + outline.length - 1) % outline.length],
      cur = outline[i],
      next = outline[(i + 1) % outline.length];
    const entry = cur.clone().lerp(prev, 0.18),
      exit = cur.clone().lerp(next, 0.18);
    if (i === 0) shape.moveTo(entry.x, entry.y);
    else shape.lineTo(entry.x, entry.y);
    shape.quadraticCurveTo(cur.x, cur.y, exit.x, exit.y);
  }
  shape.closePath();
  for (const ps of holes) shape.holes.push(new T.Path(points(ps)));
  for (const b of bores) {
    const q = b.point ?? xy(b.pixel!),
      h = new T.Path();
    h.absarc(q.x, q.y, b.radius, 0, Math.PI * 2, true);
    shape.holes.push(h);
  }
  const g = new T.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.001,
    bevelThickness: 0.0008,
    bevelSegments: 2,
    curveSegments: 8,
  });
  g.translate(0, 0, z - depth / 2);
  g.deleteAttribute("uv");
  return g;
}
export function buildTuesLinks(row: Row) {
  const parts: T.BufferGeometry[] = [],
    anchors = tuesAnchors(row);
  for (const link of profile.links)
    for (const side of [-1, 1]) {
      parts.push(
        plate(
          row,
          link.outer,
          link.depth_mm / 1000,
          (side * link.z_mm) / 1000,
          link.holes,
          link.bores.map((b: any) =>
            b.anchor
              ? {
                  point: vec(anchors[b.anchor].position),
                  radius: b.radius_mm / 1000,
                }
              : { pixel: b.pixel, radius: b.radius_mm / 1000 },
          ),
        ),
      );
    }
  const g = mergeGeometries(parts, false)!;
  parts.forEach((p) => p.dispose());
  // Full shell clearance also applies to the lower linkage cheeks, not just the painted frame.
  const clear = openBore(g, {
    name: "bb_clearance",
    start: new T.Vector3(0, 0, -0.16),
    end: new T.Vector3(0, 0, 0.16),
    radius: 0.0195,
  });
  g.dispose();
  return clear;
}
export function buildTues(row: Row) {
  const xy = tuesRegistration(row),
    a = tuesAnchors(row),
    head = vec(a.head_tube.position),
    lower = vec(a.head_tube_lower.position),
    seat = vec(a.seat_tube.position),
    rear = vec(a.rear_axle.position);
  const parts: T.BufferGeometry[] = [],
    pathEvidence: {
      name: string;
      side: number;
      sampled: ReturnType<typeof samplePolyline>;
    }[] = [];
  for (const m of profile.members as Member[]) {
    const source = m.path.map((p) => xy(p));
    if (m.name === "seat_tube") source[source.length - 1] = seat.clone();
    if (m.name === "downtube") {
      source[0] = new T.Vector3();
      source[source.length - 1] = lower.clone().lerp(head, 0.35);
    }
    if (m.name === "top_tube")
      source[source.length - 1] = lower.clone().lerp(head, 0.78);
    for (const side of m.paired ? [-1, 1] : [0]) {
      const path = source.map((p) =>
        p
          .clone()
          .setZ(
            side *
              T.MathUtils.lerp(
                0.034,
                0.086,
                T.MathUtils.clamp(p.x / rear.x, 0, 1),
              ),
          ),
      );
      const sampled = samplePolyline(
        path,
        m.height_mm.map(mm),
        path.map(() => mm(m.width_mm)),
        (m.corners_mm ?? path.map(() => 0)).map(mm),
      );
      parts.push(
        memberGeometry(
          sampled,
          ["top_tube", "downtube"].includes(m.name) ? 0.72 : 0.88,
        ),
      );
      pathEvidence.push({ name: m.name, side, sampled });
    }
  }
  parts.push(taperedHead(lower, head));
  const up = vec(a.saddle.position).sub(seat).normalize();
  parts.push(
    sleeve(seat.clone().addScaledVector(up, -0.04), seat, 0.019, 0.0148),
  );
  parts.push(
    sleeve(
      new T.Vector3(0, 0, -0.0415),
      new T.Vector3(0, 0, 0.0415),
      0.028,
      0.0195,
    ),
  );
  // The lower shock bay is open between paired load-carrying webs.
  for (const side of [-1, 1]) {
    parts.push(
      plate(
        row,
        [
          [837, 723],
          [857, 718],
          [879, 725],
          [909, 744],
          [914, 757],
          [901, 770],
          [883, 760],
          [852, 742],
        ],
        0.012,
        side * 0.027,
        [],
        [{ point: vec(a.shock_lower.position), radius: 0.0045 }],
      ),
    );
    parts.push(
      plate(
        row,
        profile.dropout,
        0.014,
        side * 0.084,
        [],
        [
          { point: rear, radius: 0.0065 },
          { pixel: [534, 824], radius: 0.005 },
        ],
      ),
    );
    // Fixed upper shock lugs emerge from the inner diagonal, rather than a floating eye.
    const eye = vec(a.shock_upper.position).setZ(side * 0.025),
      root = xy([1065, 574], side * 0.025);
    parts.push(
      memberGeometry(
        samplePolyline([root, eye], [0.02, 0.01], [0.01, 0.01], [0, 0]),
        0.8,
      ),
    );
    for (const [pixel, outer] of [
      [[899, 675], 0.018],
      [[997, 687], 0.018],
      [[854, 744], 0.019],
      [[534, 824], 0.014],
    ] as [number[], number][]) {
      const p = xy(pixel),
        z = side * (pixel[0] < 600 ? 0.084 : 0.034);
      parts.push(
        sleeve(
          p.clone().setZ(z - 0.009),
          p.clone().setZ(z + 0.009),
          outer,
          0.006,
        ),
      );
    }
  }
  // Small curved seat junction with a broad carbon face; no unnecessary middle strut.
  parts.push(
    memberGeometry(
      samplePolyline(
        [xy([853, 586]), xy([865, 553]), xy([893, 533])],
        [0.017, 0.024, 0.019],
        [0.019, 0.021, 0.02],
        [0, 0.025, 0],
      ),
      0.8,
    ),
  );
  // Bridges confined to the front of the tyre envelope.
  for (const pixel of [
    [817, 687],
    [818, 815],
  ]) {
    const p = xy(pixel);
    parts.push(
      sleeve(p.clone().setZ(-0.043), p.clone().setZ(0.043), 0.01, 0.003),
    );
  }
  // Rear brake posts stay on the non-drive side only.
  for (const pixel of [
    [505, 762],
    [558, 740],
  ]) {
    const p = xy([pixel[0], pixel[1] + 28], -0.083),
      end = xy(pixel, -0.083);
    parts.push(
      memberGeometry(
        samplePolyline([p, end], [0.008, 0.007], [0.008, 0.007], [0, 0]),
        0.8,
      ),
    );
  }
  const expanded = parts.map((g) => (g.index ? g.toNonIndexed() : g.clone())),
    merged = mergeGeometries(expanded, false)!;
  expanded.forEach((g) => g.dispose());
  parts.forEach((g) => g.dispose());
  let geometry = mergeVertices(merged, 1e-6);
  merged.dispose();
  const bores = frameBores({
      ...row,
      asset: { ...row.asset, manifest: { ...row.asset.manifest, anchors: a } },
    }),
    axis = head.clone().sub(lower).normalize();
  bores[0].start = lower.clone().addScaledVector(axis, -0.06);
  bores[0].end = head.clone().addScaledVector(axis, 0.06);
  const bb = bores.find((b) => b.name === "bottom_bracket")!;
  bb.start.z = -0.16;
  bb.end.z = 0.16;
  for (const bore of bores) {
    const next = openBore(geometry, bore);
    geometry.dispose();
    geometry = next;
  }
  return { geometry, pathEvidence };
}
// All predecessor detail surfaces are replaced explicitly; no old generic mechanism is silently retained.
export const REPLACEMENT_ZONES = [
  { min: [350, 200], max: [1380, 910], padding_m: 0.01 },
];
export function isRebuiltTriangle(_row: Row, _points: T.Vector3[]) {
  return true;
}
export async function frameV26(row: Row) {
  tuesRegistration(row);
  const group = (await new GLTFLoader().loadAsync("/" + row.predecessor_file))
    .scene;
  group.updateMatrixWorld(true);
  const paint = group.getObjectByName(
    row.asset.manifest.paintable_nodes[0],
  ) as T.Mesh;
  if (!paint?.isMesh || row.asset.manifest.paintable_nodes.length !== 1)
    throw Error("Expected one TUES painted mesh");
  const fresh = buildTues(row);
  paint.geometry.dispose();
  paint.geometry = fresh.geometry;
  const removed: T.Mesh[] = [];
  group.traverse((n) => {
    if (n instanceof T.Mesh && n !== paint) removed.push(n);
  });
  for (const n of removed) {
    n.removeFromParent();
    n.geometry.dispose();
  }
  const black = new T.MeshStandardMaterial({
      color: "#171c1e",
      roughness: 0.65,
      metalness: 0.12,
    }),
    metal = new T.MeshStandardMaterial({
      color: "#969e9f",
      roughness: 0.35,
      metalness: 0.7,
    });
  const add = (name: string, g: T.BufferGeometry, mat: T.Material) => {
    const mesh = new T.Mesh(g, mat);
    mesh.name = row.slug + "__" + name;
    group.add(mesh);
  };
  // Carbon Flip Link is painted, with recessed metallic hardware, not a generic triangular rocker.
  const links = buildTuesLinks(row);
  add("flip_link", links, paint.material as T.Material);
  const xy = tuesRegistration(row),
    a = tuesAnchors(row),
    rear = vec(a.rear_axle.position);
  for (const [pixel, z, r] of [
    [[899, 675], 0.046, 0.012],
    [[997, 687], 0.047, 0.012],
    [[854, 744], 0.043, 0.011],
    [[534, 824], 0.094, 0.01],
    [[443, 824], 0.095, 0.011],
  ] as [number[], number, number][]) {
    const p = xy(pixel);
    for (const side of [-1, 1])
      add(
        "bolt_" + pixel.join("_") + "_" + side,
        sleeve(
          p.clone().setZ(side * z - 0.002),
          p.clone().setZ(side * z + 0.002),
          r,
          0.004,
        ),
        metal,
      );
  }
  for (const key of ["shock_upper", "shock_lower"])
    for (const side of [-1, 1]) {
      const p = vec(a[key].position);
      add(
        key + "_" + side,
        sleeve(
          p.clone().setZ(side * 0.033 - 0.002),
          p.clone().setZ(side * 0.033 + 0.002),
          0.009,
          0.0045,
        ),
        metal,
      );
    }
  const chain = fresh.pathEvidence.find(
    (p) => p.name === "chain_stay" && p.side === 1,
  )!.sampled;
  const rubber = {
    ...chain,
    samples: chain.samples
      .filter((s) => s.point.x < xy([813, 820]).x)
      .map((s) => ({
        ...s,
        point: s.point.clone().add(new T.Vector3(0, s.height * 0.95, 0.001)),
        height: 0.003,
        width: 0.013,
      })),
  };
  add("chain_guard", memberGeometry(rubber, 0.8), black);
  for (let i = 1; i < rubber.samples.length - 1; i += 5) {
    const p = rubber.samples[i].point,
      g = new T.BoxGeometry(0.005, 0.004, 0.025);
    g.deleteAttribute("uv");
    g.translate(p.x, p.y + 0.003, p.z);
    add("rib_" + i, g, black);
  }
  const diagonal = fresh.pathEvidence.find(
    (p) => p.name === "downtube",
  )!.sampled;
  const guardSamples = diagonal.samples
    .filter((s) => s.point.x < xy([1060, 610]).x)
    .map((s) => ({
      ...s,
      point: s.point
        .clone()
        .addScaledVector(
          new T.Vector3(0, 0, 1).cross(s.tangent).normalize(),
          -s.height + 0.001,
        ),
      height: 0.0025,
      width: 0.03,
    }));
  if (guardSamples.length > 1)
    add(
      "down_guard",
      memberGeometry({ ...diagonal, samples: guardSamples }, 0.8),
      black,
    );
  // Unilateral hanger, removable dropout inserts and small frame-entry plates.
  add(
    "hanger",
    plate(
      row,
      [
        [434, 822],
        [452, 817],
        [463, 832],
        [453, 855],
        [440, 862],
        [431, 849],
      ],
      0.007,
      0.096,
      [],
      [{ pixel: [443, 851], radius: 0.004 }],
    ),
    black,
  );
  for (const side of [-1, 1]) {
    add(
      "flipchip_" + side,
      plate(
        row,
        [
          [522, 811],
          [539, 810],
          [547, 820],
          [542, 836],
          [525, 837],
          [518, 827],
        ],
        0.003,
        side * 0.094,
        [],
        [{ pixel: [534, 824], radius: 0.005 }],
      ),
      black,
    );
    add(
      "bumper_" + side,
      plate(
        row,
        [
          [1271, 367],
          [1295, 346],
          [1300, 361],
          [1281, 382],
        ],
        0.006,
        side * 0.031,
      ),
      black,
    );
    add(
      "port_" + side,
      plate(
        row,
        [
          [1255, 389],
          [1270, 374],
          [1276, 381],
          [1261, 396],
        ],
        0.003,
        side * 0.034,
      ),
      black,
    );
  }
  // Local YT mark; the factory's restrained blank diagonal is kept free of invented large lettering.
  for (const side of [-1, 1]) {
    const mark = lettering("YT", "#171b1c", 0.052, 0.033);
    mark.position.copy(xy([1260, 313], side * 0.035));
    mark.rotation.z = 0.72;
    if (side < 0) mark.rotateY(Math.PI);
    mark.name = row.slug + "__lettering_" + side;
    group.add(mark);
  }
  // Batch offline into group coordinates; retain names of the existing mechanical material batches.
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
    const target = nodes[0],
      parts = nodes.map((n) => {
        let g = n.geometry.clone();
        g.applyMatrix4(n.matrixWorld);
        if (!(mat as T.MeshStandardMaterial).map) g.deleteAttribute("uv");
        if (g.index) {
          const flat = g.toNonIndexed();
          g.dispose();
          g = flat;
        }
        return g;
      });
    const g = mergeGeometries(parts, false)!;
    parts.forEach((g) => g.dispose());
    nodes.forEach((n) => n.geometry.dispose());
    target.geometry = mergeVertices(g, 1e-9);
    g.dispose();
    target.position.set(0, 0, 0);
    target.rotation.set(0, 0, 0);
    target.scale.set(1, 1, 1);
    target.updateMatrix();
    nodes.slice(1).forEach((n) => n.removeFromParent());
  }
  const marker = group.getObjectByName("mount_saddle");
  if (marker) marker.position.fromArray(a.saddle.position);
  return {
    group,
    anchors: a,
    paintable_nodes: row.asset.manifest.paintable_nodes,
  };
}
