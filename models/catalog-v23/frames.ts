/** Specialized S-Works Enduro UDH exterior, offline only. No published predecessor is mutated. */
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
export function enduroRegistration(row: Row) {
  if (row.slug !== "specialized-s-works-enduro-udh")
    throw Error("Enduro-only exterior reconstruction");
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

/** Only the estimated saddle marker changes: its axis follows the photographed upper seat tube. */
export function enduroAnchors(row: Row) {
  const anchors = structuredClone(row.asset.manifest.anchors),
    xy = enduroRegistration(row),
    seat = vec(anchors.seat_tube.position),
    oldSaddle = vec(anchors.saddle.position),
    member = profile.members.find((m) => m.name === "seat_tube")!,
    axis = seat.clone().sub(xy(member.path[1])).normalize();
  anchors.saddle.position = seat
    .clone()
    .addScaledVector(axis, oldSaddle.distanceTo(seat))
    .toArray();
  return anchors;
}

/** Indexed section loft: linearly varying sections retain straight silhouette edges. */
function memberGeometry(
  sampled: ReturnType<typeof samplePolyline>,
  exponent = 0.93,
  capEnd = true,
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
    if (capEnd) indices.push(end, end + j, end + j + 1);
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

/** Carbon front triangle and complete paired rear triangle, measured in the photographed plane. */
export function buildEnduro(row: Row) {
  const xy = enduroRegistration(row),
    a = enduroAnchors(row),
    head = vec(a.head_tube.position),
    lower = vec(a.head_tube_lower.position),
    rear = vec(a.rear_axle.position),
    seat = vec(a.seat_tube.position),
    axis = head.clone().sub(lower).normalize();
  const parts: T.BufferGeometry[] = [],
    pathEvidence: {
      name: string;
      side: number;
      sampled: ReturnType<typeof samplePolyline>;
    }[] = [];
  for (const member of profile.members as Member[]) {
    const source = member.path.map((p) => xy(p));
    if (member.name === "top_tube")
      source[source.length - 1] = lower.clone().lerp(head, 0.8);
    if (member.name === "downtube")
      source[source.length - 1] = lower.clone().lerp(head, 0.4);
    if (member.name === "seat_tube") source[0] = seat.clone();
    for (const side of member.paired ? [-1, 1] : [0]) {
      const path = source.map((p) =>
        p
          .clone()
          .setZ(
            side *
              T.MathUtils.lerp(
                0.045,
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
      parts.push(
        memberGeometry(
          sampled,
          ["top_tube", "downtube"].includes(member.name) ? 0.68 : 0.82,
          !["top_tube", "downtube"].includes(member.name),
        ),
      );
      pathEvidence.push({ name: member.name, side, sampled });
    }
  }
  // Horst dropout is a second pivot: connect it locally, never a generic curved rear rail.
  const dropout = xy(
    profile.members.find((m) => m.name === "chain_stay")!.path[0],
  );
  for (const side of [-1, 1]) {
    parts.push(
      memberGeometry(
        samplePolyline(
          [rear.clone().setZ(side * 0.081), dropout.clone().setZ(side * 0.077)],
          [0.014, 0.014],
          [0.011, 0.012],
          [0, 0],
        ),
        0.84,
      ),
    );
    parts.push(
      sleeve(
        rear.clone().setZ(side * 0.081 - 0.009),
        rear.clone().setZ(side * 0.081 + 0.009),
        0.016,
        0.006,
      ),
    );
  }
  const jointShape = new T.Shape(
    [
      [510, 479],
      [525, 488],
      [546, 490],
      [570, 486],
      [563, 510],
      [543, 522],
      [536, 545],
      [525, 543],
    ].map((p) => {
      const v = xy(p);
      return new T.Vector2(v.x, v.y);
    }),
  );
  const joint = new T.ExtrudeGeometry(jointShape, {
    depth: 0.04,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
    curveSegments: 1,
  });
  joint.translate(0, 0, -0.02);
  joint.deleteAttribute("uv");
  parts.push(joint);
  // The pair of post-mount brake bosses exists only on the non-drive seatstay.
  for (const pixel of [
    [108, 831],
    [176, 797],
  ]) {
    const base = xy(pixel, -0.077),
      tip = base.clone().add(new T.Vector3(0, 0.032, 0));
    parts.push(sleeve(base, tip, 0.0065, 0.0025));
  }
  parts.push(taperedHead(lower, head));
  const up = vec(a.saddle.position).sub(seat).normalize();
  parts.push(
    sleeve(seat.clone().addScaledVector(up, -0.035), seat, 0.0203, 0.0169),
  );
  const bbwidth = (row.variant.specs.bb_shell?.width_mm ?? 73) / 1000;
  parts.push(
    sleeve(
      new T.Vector3(0, 0, -bbwidth / 2),
      new T.Vector3(0, 0, bbwidth / 2),
      0.027,
      0.0195,
    ),
  );
  // Forward trunnion support belongs to the fixed downtube bay. Rear eye is deliberately not painted.
  const forward = vec(a.shock_upper.position);
  for (const side of [-1, 1]) {
    parts.push(
      sleeve(
        forward.clone().setZ(side * 0.029 - 0.009),
        forward.clone().setZ(side * 0.029 + 0.009),
        0.015,
        0.005,
      ),
    );
  }
  // The seat-tube pivot and lower frame pivot get short sleeves, not a filled wall across the shock bay.
  for (const pixel of [
    [608, 677],
    [619, 846],
  ]) {
    const p = xy(pixel);
    for (const side of [-1, 1])
      parts.push(
        sleeve(
          p.clone().setZ(side * 0.03 - 0.009),
          p.clone().setZ(side * 0.03 + 0.009),
          0.017,
          0.006,
        ),
      );
  }
  const flat = parts.map((g) => (g.index ? g.toNonIndexed() : g.clone())),
    merged = mergeGeometries(flat, false)!;
  flat.forEach((g) => g.dispose());
  parts.forEach((g) => g.dispose());
  let geometry = mergeVertices(merged, 1e-6);
  merged.dispose();
  const bores = frameBores({
    ...row,
    asset: { ...row.asset, manifest: { ...row.asset.manifest, anchors: a } },
  });
  bores[0].start = lower.clone().addScaledVector(axis, -0.06);
  bores[0].end = head.clone().addScaledVector(axis, 0.06);
  for (const bore of bores) {
    const next = openBore(geometry, bore);
    geometry.dispose();
    geometry = next;
  }
  const lining = new T.CylinderGeometry(
      0.0272,
      0.0272,
      head.distanceTo(lower),
      32,
      1,
      true,
    ),
    idx = lining.index!,
    normal = lining.getAttribute("normal");
  for (let i = 0; i < idx.count; i += 3) {
    const x = idx.getX(i + 1);
    idx.setX(i + 1, idx.getX(i + 2));
    idx.setX(i + 2, x);
  }
  for (let i = 0; i < normal.count; i++)
    normal.setXYZ(i, -normal.getX(i), -normal.getY(i), -normal.getZ(i));
  lining.applyQuaternion(
    new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), axis),
  );
  const middle = lower.clone().add(head).multiplyScalar(0.5);
  lining.translate(middle.x, middle.y, middle.z);
  lining.deleteAttribute("uv");
  const joined = mergeGeometries([geometry, lining], false)!;
  geometry.dispose();
  lining.dispose();
  geometry = mergeVertices(joined, 1e-6);
  joined.dispose();
  return { geometry, pathEvidence };
}
export function buildEnduroLinks(row: Row) {
  const xy = enduroRegistration(row),
    parts: T.BufferGeometry[] = [];
  for (const link of profile.links) {
    const pts = link.outer.map((p) => {
        const q = xy(p);
        return new T.Vector2(q.x, q.y);
      }),
      shape = new T.Shape(pts);
    for (const pixel of link.holes) {
      const p = xy(pixel),
        bore = new T.Path();
      bore.absarc(p.x, p.y, 0.005, 0, Math.PI * 2, true);
      shape.holes.push(bore);
    }
    for (const side of [-1, 1]) {
      const g = new T.ExtrudeGeometry(shape, {
        depth: link.depth_mm / 1000,
        bevelEnabled: false,
        curveSegments: 24,
      });
      g.translate(
        0,
        0,
        (side * link.half_separation_mm) / 1000 - link.depth_mm / 2000,
      );
      g.deleteAttribute("uv");
      parts.push(g);
    }
  }
  // Two extension ears from the lower link to the rear shock eye, leaving the shock central.
  const from = vec(row.asset.manifest.anchors.shock_lower.position),
    to = xy(profile.extension.to);
  for (const side of [-1, 1]) {
    parts.push(
      memberGeometry(
        samplePolyline(
          [from.clone().setZ(side * 0.019), to.clone().setZ(side * 0.027)],
          [0.011, 0.015],
          [0.007, 0.008],
          [0, 0],
        ),
        0.8,
      ),
    );
    parts.push(
      sleeve(
        from.clone().setZ(side * 0.019 - 0.007),
        from.clone().setZ(side * 0.019 + 0.007),
        0.012,
        0.004,
      ),
    );
  }
  const flat = parts.map((g) => (g.index ? g.toNonIndexed() : g.clone())),
    merged = mergeGeometries(flat, false)!;
  flat.forEach((g) => g.dispose());
  parts.forEach((g) => g.dispose());
  const result = mergeVertices(merged, 1e-6);
  merged.dispose();
  return result;
}
export function isRebuiltLinkTriangle(row: Row, points: T.Vector3[]) {
  const xy = enduroRegistration(row),
    m = profile.link_mask,
    bounds = new T.Box3().setFromPoints(
      [
        [m.min[0], m.min[1]],
        [m.max[0], m.min[1]],
        [m.min[0], m.max[1]],
        [m.max[0], m.max[1]],
      ].map((p) => xy(p)),
    );
  return points.some(
    (p) =>
      p.x >= bounds.min.x - m.padding_m &&
      p.x <= bounds.max.x + m.padding_m &&
      p.y >= bounds.min.y - m.padding_m &&
      p.y <= bounds.max.y + m.padding_m,
  );
}
export async function frameV23(row: Row) {
  enduroRegistration(row);
  const group = (await new GLTFLoader().loadAsync("/" + row.predecessor_file))
    .scene;
  group.updateMatrixWorld(true);
  const paint = group.getObjectByName(
    row.asset.manifest.paintable_nodes[0],
  ) as T.Mesh;
  if (!paint?.isMesh) throw Error("Expected Enduro paint");
  const oldProtection = group.getObjectByName(
    row.slug +
      "--" +
      row.variant.specs.size_label.toLowerCase() +
      "__protection",
  ) as T.Mesh;
  if (oldProtection) {
    oldProtection.removeFromParent();
    oldProtection.geometry.dispose();
  }
  const fresh = buildEnduro(row);
  paint.geometry.dispose();
  paint.geometry = fresh.geometry;
  const dark = group.getObjectByName(
    row.slug + "--" + row.variant.specs.size_label.toLowerCase() + "__link",
  ) as T.Mesh;
  if (!dark?.isMesh) throw Error("Expected Enduro mechanical detail");
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
  const links = new T.Mesh(buildEnduroLinks(row), dark.material);
  links.name = row.slug + "__enduro_links_v23";
  group.add(links);
  const xy = enduroRegistration(row),
    black = (dark.material as T.MeshStandardMaterial).clone();
  black.color.set("#1c1c1d");
  black.roughness = 0.8;
  const patch = (
    name: string,
    pixels: number[][],
    z: number,
    depth: number,
    material: T.Material = black,
  ) => {
    const shape = new T.Shape(
        pixels.map((p) => {
          const v = xy(p);
          return new T.Vector2(v.x, v.y);
        }),
      ),
      g = new T.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: false,
        curveSegments: 1,
      });
    g.translate(0, 0, z);
    g.deleteAttribute("uv");
    const mesh = new T.Mesh(g, material);
    mesh.name = row.slug + "__" + name;
    group.add(mesh);
  };
  // Exterior UDH outline below the drive-side axle: absent from the old generic detail.
  const hangerShape = new T.Shape(
    [
      [51, 860],
      [63, 863],
      [65, 875],
      [60, 885],
      [53, 893],
      [42, 895],
      [38, 888],
      [42, 879],
      [46, 868],
    ].map((p) => {
      const v = xy(p);
      return new T.Vector2(v.x, v.y);
    }),
  );
  const hangerHole = new T.Path(),
    hangerCentre = xy([48, 886]);
  hangerHole.absarc(
    hangerCentre.x,
    hangerCentre.y,
    0.004,
    0,
    Math.PI * 2,
    true,
  );
  hangerShape.holes.push(hangerHole);
  const hangerGeometry = new T.ExtrudeGeometry(hangerShape, {
    depth: 0.006,
    bevelEnabled: false,
    curveSegments: 20,
  });
  hangerGeometry.translate(0, 0, 0.083);
  hangerGeometry.deleteAttribute("uv");
  const hanger = new T.Mesh(hangerGeometry, black);
  hanger.name = row.slug + "__udh_hanger";
  group.add(hanger);
  // SWAT door is an attached upper-facing inset, not an unrelated box floating beside the tube.
  const down = fresh.pathEvidence.find((p) => p.name === "downtube")!.sampled;
  const range = down.straightRanges.reduce((a, b) =>
      down.points[a.from].distanceTo(down.points[a.to]) >
      down.points[b.from].distanceTo(down.points[b.to])
        ? a
        : b,
    ),
    start = down.points[range.from],
    end = down.points[range.to],
    center = start.clone().lerp(end, 0.53),
    tangent = end.clone().sub(start).normalize(),
    n = new T.Vector3(0, 0, 1).cross(tangent).normalize();
  const door = new T.Mesh(new T.BoxGeometry(0.195, 0.003, 0.035), black);
  door.position.copy(center).addScaledVector(n, 0.033);
  door.rotation.z = Math.atan2(tangent.y, tangent.x);
  door.name = row.slug + "__swat_door";
  group.add(door);
  // Low outer protector and drive-side chain guard follow actual Enduro coordinates.
  patch(
    "down_guard",
    [
      [550, 922],
      [690, 868],
      [754, 836],
      [783, 800],
      [827, 737],
      [818, 734],
      [767, 803],
      [740, 824],
      [680, 853],
      [548, 906],
    ],
    -0.03,
    0.06,
  );
  const chain = fresh.pathEvidence.find(
    (p) => p.name === "chain_stay" && p.side === 1,
  )!.sampled;
  const guardSamples = chain.samples
    .filter((p) => p.point.x < -0.06)
    .map((p) => ({
      ...p,
      point: p.point.clone().add(new T.Vector3(0, p.height * 0.82, 0.001)),
      height: 0.004,
      width: 0.013,
    }));
  const guardGeom = memberGeometry({ ...chain, samples: guardSamples }, 0.8),
    guard = new T.Mesh(guardGeom, black);
  guard.name = row.slug + "__chain_guard";
  group.add(guard);
  // Narrow caps of the paired Horst pins keep the two true rear joints legible.
  let shared: T.MeshStandardMaterial | undefined;
  for (const side of [-1, 1]) {
    const name = row.slug + "__lettering_" + side,
      old = group.getObjectByName(name) as T.Mesh;
    if (old) {
      old.removeFromParent();
      old.geometry.dispose();
    }
    const mark = lettering("S-WORKS", "#9c9c9f", 0.27, 0.034);
    if (shared) {
      mark.material.map?.dispose();
      mark.material.dispose();
      mark.material = shared;
    } else shared = mark.material;
    mark.position.copy(center).setZ(side * 0.0355);
    mark.rotation.z = Math.atan2(tangent.y, tangent.x);
    if (side < 0) mark.rotateY(Math.PI);
    mark.name = name;
    group.add(mark);
  }
  // Batch by shared material offline and restore indexing; runtime still receives static meshes.
  group.updateMatrixWorld(true);
  const batches = new Map<T.Material, T.Mesh[]>();
  group.traverse((n) => {
    if (n instanceof T.Mesh && !Array.isArray(n.material)) {
      const a = batches.get(n.material) ?? [];
      a.push(n);
      batches.set(n.material, a);
    }
  });
  for (const [mat, nodes] of batches) {
    if (nodes.length < 2) continue;
    const target = nodes[0],
      inverse = group.matrixWorld.clone().invert(),
      parts = nodes.map((n) => {
        let g = n.geometry
          .clone()
          .applyMatrix4(inverse.clone().multiply(n.matrixWorld));
        if (!(mat as T.MeshStandardMaterial).map) g.deleteAttribute("uv");
        if (g.index) {
          const f = g.toNonIndexed();
          g.dispose();
          g = f;
        }
        return g;
      }),
      merged = mergeGeometries(parts, false);
    if (!merged) throw Error("Enduro material merge failed");
    parts.forEach((g) => g.dispose());
    nodes.forEach((n) => n.geometry.dispose());
    target.position.set(0, 0, 0);
    target.quaternion.identity();
    target.scale.set(1, 1, 1);
    target.updateMatrix();
    target.geometry = mergeVertices(merged, 1e-9);
    merged.dispose();
    nodes.slice(1).forEach((n) => n.removeFromParent());
  }
  const saddleMarker = group.getObjectByName("mount_saddle");
  if (saddleMarker)
    saddleMarker.position.fromArray(enduroAnchors(row).saddle.position);
  return {
    group,
    anchors: enduroAnchors(row),
    paintable_nodes: row.asset.manifest.paintable_nodes,
  };
}
