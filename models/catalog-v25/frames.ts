/** COMMENCAL SUPREME DH V5 exterior, offline only. No published predecessor is mutated. */
import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  mergeGeometries,
  mergeVertices,
} from "three/addons/utils/BufferGeometryUtils.js";
import profile from "./profile.json";
import { openWindow } from "./window";
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
export function supremeRegistration(row: Row) {
  if (row.slug !== "commencal-supreme-dh-v5")
    throw Error("SUPREME-only exterior reconstruction");
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

export function supremeAnchors(row: Row) {
  const anchors = structuredClone(row.asset.manifest.anchors),
    xy = supremeRegistration(row),
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
  const xy = supremeRegistration(row),
    points = (ps: number[][]) =>
      ps.map((p) => {
        const q = xy(p);
        return new T.Vector2(q.x, q.y);
      }),
    shape = new T.Shape(points(pixels));
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
    curveSegments: 24,
  });
  g.translate(0, 0, z - depth / 2);
  g.deleteAttribute("uv");
  return g;
}
export function buildSupremeLinks(row: Row) {
  const parts: T.BufferGeometry[] = [],
    anchors = supremeAnchors(row);
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
export function buildSupreme(row: Row) {
  const xy = supremeRegistration(row),
    a = supremeAnchors(row),
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
      source[source.length - 1] = lower.clone().lerp(head, 0.4);
    }
    if (m.name === "top_tube")
      source[source.length - 1] = lower.clone().lerp(head, 0.8);
    for (const side of m.paired ? [-1, 1] : [0]) {
      const frontArch = m.name === "front_arch",
        path = source.map((p, pointIndex) =>
          p
            .clone()
            .setZ(
              side *
                (frontArch
                  ? pointIndex === source.length - 1
                    ? 0.009
                    : 0.029
                  : T.MathUtils.lerp(
                      0.038,
                      0.086,
                      T.MathUtils.clamp(p.x / rear.x, 0, 1),
                    )),
            ),
        );
      const sampled = samplePolyline(
        path,
        m.height_mm.map(mm),
        path.map(() => mm(m.width_mm)),
        (m.corners_mm ?? path.map(() => 0)).map(mm),
      );
      pathEvidence.push({ name: m.name, side, sampled });
      parts.push(
        memberGeometry(
          sampled,
          ["top_tube", "downtube"].includes(m.name) ? 0.76 : 0.86,
        ),
      );
    }
  }
  parts.push(taperedHead(lower, head));
  const up = vec(a.saddle.position).sub(seat).normalize();
  parts.push(
    sleeve(seat.clone().addScaledVector(up, -0.035), seat, 0.01745, 0.0148),
  );
  const bbw = mm(row.variant.specs.bb_shell.width_mm);
  parts.push(
    sleeve(
      new T.Vector3(0, 0, -bbw / 2),
      new T.Vector3(0, 0, bbw / 2),
      0.027,
      0.0195,
    ),
  );
  // Fixed bearing bosses are part of the front triangle, not a painted shock eye bridge.
  for (const pixel of [
    [581, 538],
    [538, 686],
  ])
    for (const side of [-1, 1]) {
      const p = xy(pixel);
      parts.push(
        sleeve(
          p.clone().setZ(side * 0.029 - 0.01),
          p.clone().setZ(side * 0.029 + 0.01),
          0.019,
          0.007,
        ),
      );
    }
  // Seat root connects to the forward arch on both sides, retaining the small triangular opening.
  for (const side of [-1, 1]) {
    const start = xy([550, 500], side * 0.029),
      end = xy([581, 538], side * 0.029);
    parts.push(
      memberGeometry(
        samplePolyline([start, end], [0.017, 0.018], [0.011, 0.011], [0, 0]),
        0.85,
      ),
    );
  }
  // Rear pivot counterparts and the short secondary rear-axle adapters.
  for (const side of [-1, 1]) {
    const rearZ = 0.086,
      start = rear.clone().setZ(side * rearZ),
      end = xy([155, 743], side * 0.08);
    parts.push(
      memberGeometry(
        samplePolyline([start, end], [0.014, 0.013], [0.011, 0.011], [0, 0]),
        0.85,
      ),
    );
    for (const pixel of [
      [98, 743],
      [155, 743],
      [538, 526],
      [511, 741],
    ]) {
      const p = xy(pixel),
        z =
          side *
          T.MathUtils.lerp(0.038, rearZ, T.MathUtils.clamp(p.x / rear.x, 0, 1));
      parts.push(
        sleeve(
          p.clone().setZ(z - 0.008),
          p.clone().setZ(z + 0.008),
          0.016,
          0.006,
        ),
      );
    }
  }
  // Front and rear reinforcement bridges exist only at the actual crossmembers, leaving the tyre envelope open.
  for (const pixel of [
    [498, 544],
    [462, 742],
  ]) {
    const p = xy(pixel);
    parts.push(
      sleeve(p.clone().setZ(-0.043), p.clone().setZ(0.043), 0.01, 0.004),
    );
  }
  // Post-mount fittings are unilateral, on the non-drive rear stay.
  for (const pixel of [
    [145, 682],
    [193, 660],
  ]) {
    const p = xy(pixel, -0.081),
      end = p.clone().add(new T.Vector3(0, 0.016, 0));
    parts.push(
      memberGeometry(
        samplePolyline([p, end], [0.008, 0.007], [0.007, 0.007], [0, 0]),
        0.8,
      ),
    );
    parts.push(
      sleeve(end.clone().setZ(-0.089), end.clone().setZ(-0.073), 0.008, 0.003),
    );
  }
  // Side webs form a sculpted cradle, not isolated diagonal rods.
  for (const side of [-1, 1])
    parts.push(
      plate(row, profile.bay.outer, 0.012, side * 0.025, [profile.bay.hole]),
    );
  const expanded = parts.map((g) => (g.index ? g.toNonIndexed() : g.clone())),
    merged = mergeGeometries(expanded, false)!;
  expanded.forEach((g) => g.dispose());
  parts.forEach((g) => g.dispose());
  let geometry = mergeVertices(merged, 1e-6);
  merged.dispose();
  const opened = openWindow(
    geometry,
    profile.bay.hole.map((p) => xy(p)),
  );
  geometry.dispose();
  geometry = opened;
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
  // A separated lining avoids shading artefacts on the open rim.
  const lining = new T.CylinderGeometry(
      0.02715,
      0.02715,
      head.distanceTo(lower),
      96,
      1,
      true,
    ),
    idx = lining.index!,
    normal = lining.getAttribute("normal");
  for (let i = 0; i < idx.count; i += 3) {
    const j = idx.getX(i + 1);
    idx.setX(i + 1, idx.getX(i + 2));
    idx.setX(i + 2, j);
  }
  for (let i = 0; i < normal.count; i++)
    normal.setXYZ(i, -normal.getX(i), -normal.getY(i), -normal.getZ(i));
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
export const REPLACEMENT_ZONES = [
  { min: [425, 475], max: [850, 800], padding_m: 0.008 },
  { min: [125, 725], max: [520, 775], padding_m: 0.008 },
];
export function isRebuiltTriangle(row: Row, points: T.Vector3[]) {
  const xy = supremeRegistration(row);
  return REPLACEMENT_ZONES.some((p) => {
    const box = new T.Box3()
      .setFromPoints(
        [
          [p.min[0], p.min[1]],
          [p.max[0], p.min[1]],
          [p.min[0], p.max[1]],
          [p.max[0], p.max[1]],
        ].map((q) => xy(q)),
      )
      .expandByScalar(p.padding_m);
    return points.some(
      (p) =>
        p.x >= box.min.x &&
        p.x <= box.max.x &&
        p.y >= box.min.y &&
        p.y <= box.max.y,
    );
  });
}
export async function frameV25(row: Row) {
  supremeRegistration(row);
  const group = (await new GLTFLoader().loadAsync("/" + row.predecessor_file))
    .scene;
  group.updateMatrixWorld(true);
  const paint = group.getObjectByName(
    row.asset.manifest.paintable_nodes[0],
  ) as T.Mesh;
  if (!paint?.isMesh || row.asset.manifest.paintable_nodes.length !== 1)
    throw Error("Expected one Supreme painted mesh");
  const fresh = buildSupreme(row);
  paint.geometry.dispose();
  paint.geometry = fresh.geometry;
  // Replace only the old generic central mechanism; keep the rear guards and unilateral details outside that region.
  group.traverse((n) => {
    if (
      !(n instanceof T.Mesh) ||
      n === paint ||
      n.name.includes("__lettering_")
    )
      return;
    const old = n.geometry,
      flat = old.index ? old.toNonIndexed() : old.clone(),
      attributes = Object.keys(flat.attributes),
      values: Record<string, number[]> = {};
    attributes.forEach((k) => (values[k] = []));
    const pos = flat.getAttribute("position");
    for (let i = 0; i < pos.count; i += 3) {
      const points = [0, 1, 2].map((j) =>
        new T.Vector3()
          .fromBufferAttribute(pos, i + j)
          .applyMatrix4(n.matrixWorld),
      );
      if (isRebuiltTriangle(row, points)) continue;
      for (const key of attributes) {
        const a = flat.getAttribute(key);
        for (let j = 0; j < 3; j++)
          for (let k = 0; k < a.itemSize; k++)
            values[key].push(a.array[(i + j) * a.itemSize + k]);
      }
    }
    const g = new T.BufferGeometry();
    for (const key of attributes)
      g.setAttribute(
        key,
        new T.Float32BufferAttribute(
          values[key],
          flat.getAttribute(key).itemSize,
        ),
      );
    flat.dispose();
    old.dispose();
    n.geometry = mergeVertices(g, 1e-6);
    g.dispose();
  });
  const black = new T.MeshStandardMaterial({
      color: "#171c1e",
      roughness: 0.65,
      metalness: 0.12,
    }),
    metal = new T.MeshStandardMaterial({
      color: "#a0a7aa",
      roughness: 0.35,
      metalness: 0.7,
    });
  const add = (name: string, g: T.BufferGeometry, mat: T.Material) => {
    const mesh = new T.Mesh(g, mat);
    mesh.name = row.slug + "__" + name;
    group.add(mesh);
  };
  add("hvcs", buildSupremeLinks(row), black);
  const a = supremeAnchors(row),
    xy = supremeRegistration(row);
  // Axle sleeves and visible cap rings connect the paired plates, without plugging the shock-eye gap.
  for (const [pixel, z, r] of [
    [[581, 538], 0.04, 0.012],
    [[538, 526], 0.049, 0.012],
    [[538, 686], 0.04, 0.012],
    [[519, 741], 0.033, 0.01],
    [[604, 504], 0.031, 0.01],
    [[526, 572], 0.044, 0.009],
    [[516, 713], 0.044, 0.009],
  ] as [number[], number, number][]) {
    const p = xy(pixel);
    for (const side of [-1, 1])
      add(
        "bolt_" + pixel.join("_") + "_" + side,
        sleeve(
          p.clone().setZ(side * z - 0.003),
          p.clone().setZ(side * z + 0.003),
          r,
          0.0045,
        ),
        metal,
      );
  }
  // Wheel-facing mudguard is supported by a transverse bar, not a floating fragment.
  add(
    "mudguard",
    plate(
      row,
      [
        [439, 562],
        [469, 550],
        [501, 551],
        [531, 569],
        [528, 619],
        [517, 639],
        [498, 640],
        [477, 619],
        [447, 597],
      ],
      0.006,
      0,
    ),
    black,
  );
  {
    const p = xy([470, 552]);
    add(
      "mudguard_bridge",
      sleeve(p.clone().setZ(-0.047), p.clone().setZ(0.047), 0.007, 0.002),
      black,
    );
  }
  const chain = fresh.pathEvidence.find(
    (p) => p.name === "chain_stay" && p.side === 1,
  )!.sampled;
  const rubber = {
    ...chain,
    samples: chain.samples.map((s) => ({
      ...s,
      point: s.point.clone().add(new T.Vector3(0, s.height * 0.92, 0.002)),
      height: 0.0035,
      width: 0.014,
    })),
  };
  add("chain_guard", memberGeometry(rubber, 0.8), black);
  for (let i = 1; i < rubber.samples.length - 1; i += 6) {
    const p = rubber.samples[i].point;
    const g = new T.BoxGeometry(0.006, 0.005, 0.027);
    g.deleteAttribute("uv");
    g.translate(p.x, p.y + 0.004, p.z);
    add("chain_rib_" + i, g, black);
  }
  for (const pixel of [
    [98, 743],
    [155, 743],
  ])
    for (const side of [-1, 1]) {
      const p = xy(pixel);
      add(
        "dropout_bolt_" + pixel[0] + "_" + side,
        sleeve(
          p.clone().setZ(side * 0.089 - 0.003),
          p.clone().setZ(side * 0.089 + 0.003),
          0.01,
          0.004,
        ),
        metal,
      );
    }
  // Drive-side idler and its own asymmetric carrier, based on the V5 front-triangle drawing.
  add(
    "idler_carrier",
    plate(
      row,
      [
        [529, 651],
        [552, 654],
        [562, 684],
        [553, 704],
        [538, 696],
        [529, 676],
      ],
      0.008,
      0.052,
      [],
      [{ pixel: [539, 665], radius: 0.006 }],
    ),
    black,
  );
  const idler = vec(a.chain_idler.position);
  const gear = new T.Shape();
  for (let i = 0; i < 96; i++) {
    const angle = (i * Math.PI * 2) / 96,
      r = i % 4 < 2 ? 0.032 : 0.028,
      px = idler.x + Math.cos(angle) * r,
      py = idler.y + Math.sin(angle) * r;
    if (i === 0) gear.moveTo(px, py);
    else gear.lineTo(px, py);
  }
  gear.closePath();
  const hole = new T.Path();
  hole.absarc(idler.x, idler.y, 0.006, 0, Math.PI * 2, true);
  gear.holes.push(hole);
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3,
      p = new T.Path();
    p.absarc(
      idler.x + Math.cos(angle) * 0.017,
      idler.y + Math.sin(angle) * 0.017,
      0.004,
      0,
      Math.PI * 2,
      true,
    );
    gear.holes.push(p);
  }
  const g = new T.ExtrudeGeometry(gear, {
    depth: 0.006,
    bevelEnabled: false,
    curveSegments: 16,
  });
  g.translate(0, 0, 0.06);
  g.deleteAttribute("uv");
  add("idler", g, black);
  add(
    "idler_bolt",
    sleeve(idler.clone().setZ(0.066), idler.clone().setZ(0.069), 0.01, 0.004),
    metal,
  );
  add(
    "upper_chain_guide",
    plate(
      row,
      [
        [503, 620],
        [526, 614],
        [543, 629],
        [541, 643],
        [522, 640],
        [509, 635],
      ],
      0.018,
      0.058,
    ),
    black,
  );
  add(
    "hanger",
    plate(
      row,
      [
        [88, 737],
        [105, 734],
        [114, 745],
        [106, 773],
        [96, 779],
        [87, 772],
      ],
      0.007,
      0.093,
      [],
      [{ pixel: [98, 768], radius: 0.004 }],
    ),
    black,
  );
  const diagonal = fresh.pathEvidence.find(
    (p) => p.name === "downtube",
  )!.sampled;
  const guardSamples = diagonal.samples
    .filter((s) => s.point.x < xy([800, 570]).x)
    .map((s) => ({
      ...s,
      point: s.point
        .clone()
        .addScaledVector(
          new T.Vector3(0, 0, 1).cross(s.tangent).normalize(),
          -s.height + 0.001,
        ),
      height: 0.003,
      width: 0.029,
    }));
  if (guardSamples.length > 1)
    add(
      "down_guard",
      memberGeometry({ ...diagonal, samples: guardSamples }, 0.8),
      black,
    );
  // Cable-entry plaques stay within the broad side face of the diagonal.
  for (const side of [-1, 1])
    add(
      "port_" + side,
      plate(
        row,
        [
          [992, 225],
          [1010, 202],
          [1021, 209],
          [1003, 233],
        ],
        0.003,
        side * 0.028,
      ),
      black,
    );
  const range = diagonal.straightRanges.reduce((a, b) =>
      diagonal.points[a.from].distanceTo(diagonal.points[a.to]) >
      diagonal.points[b.from].distanceTo(diagonal.points[b.to])
        ? a
        : b,
    ),
    start = diagonal.points[range.from],
    end = diagonal.points[range.to],
    center = start.clone().lerp(end, 0.5);
  let shared: T.MeshStandardMaterial | undefined;
  for (const side of [-1, 1]) {
    const name = row.slug + "__lettering_" + side,
      old = group.getObjectByName(name) as T.Mesh;
    if (old) {
      old.removeFromParent();
      old.geometry.dispose();
    }
    const mark = lettering("COMMENCAL", "#171b1c", 0.34, 0.044);
    if (shared) {
      mark.material.map?.dispose();
      mark.material.dispose();
      mark.material = shared;
    } else shared = mark.material;
    mark.position.copy(center).setZ(side * 0.034);
    mark.rotation.z = Math.atan2(end.y - start.y, end.x - start.x);
    if (side < 0) mark.rotateY(Math.PI);
    mark.name = name;
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
