/** Canyon Sender CFR high-pivot MY25 exterior, offline only. No published predecessor is mutated. */
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
export function senderRegistration(row: Row) {
  if (row.slug !== "canyon-sender-cfr-high-pivot")
    throw Error("Sender-only exterior reconstruction");
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

export function senderAnchors(row: Row) {
  const xy = senderRegistration(row),
    anchors = structuredClone(row.asset.manifest.anchors);
  const positions = {
    seat_tube: profile.image_landmarks.seat_top,
    shock_upper: profile.image_landmarks.shock_upper,
    shock_lower: profile.image_landmarks.shock_lower,
    suspension_pivot: profile.image_landmarks.pivot,
    chain_idler: profile.image_landmarks.idler,
  };
  for (const [name, p] of Object.entries(positions))
    anchors[name].position = xy(p).toArray();
  // Perspective tracing determines the axis; documented eye length determines its scale.
  const shockLower = vec(anchors.shock_lower.position),
    shockAxis = vec(anchors.shock_upper.position).sub(shockLower).normalize();
  anchors.shock_upper.position = shockLower
    .clone()
    .addScaledVector(shockAxis, mm(row.variant.specs.shock_fit.eye_to_eye_mm))
    .toArray();
  const oldSeat = vec(row.asset.manifest.anchors.seat_tube.position),
    oldSaddle = vec(row.asset.manifest.anchors.saddle.position);
  const tube = profile.members.find((m) => m.name === "seat_tube")!,
    newSeat = vec(anchors.seat_tube.position),
    axis = newSeat
      .clone()
      .sub(xy(tube.path[tube.path.length - 2]))
      .normalize();
  anchors.saddle.position = newSeat
    .clone()
    .addScaledVector(axis, oldSaddle.distanceTo(oldSeat))
    .toArray();
  return anchors;
}
function plate(
  row: Row,
  pixels: number[][],
  depth: number,
  z: number,
  holes: number[][][] = [],
) {
  const xy = senderRegistration(row),
    pts = (ps: number[][]) =>
      ps.map((p) => {
        const v = xy(p);
        return new T.Vector2(v.x, v.y);
      });
  const shape = new T.Shape(pts(pixels));
  for (const h of holes) shape.holes.push(new T.Path(pts(h)));
  const g = new T.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.0015,
    bevelSize: 0.002,
    bevelSegments: 2,
    curveSegments: 24,
  });
  g.translate(0, 0, z - depth / 2);
  g.deleteAttribute("uv");
  return g;
}
function borePlate(
  row: Row,
  pixels: number[][],
  depth: number,
  z: number,
  centres: number[][],
) {
  const xy = senderRegistration(row),
    shape = new T.Shape(
      pixels.map((p) => {
        const v = xy(p);
        return new T.Vector2(v.x, v.y);
      }),
    );
  for (const p of centres) {
    const v =
        p[0] === profile.image_landmarks.shock_upper[0] &&
        p[1] === profile.image_landmarks.shock_upper[1]
          ? vec(senderAnchors(row).shock_upper.position)
          : xy(p),
      h = new T.Path();
    h.absarc(v.x, v.y, 0.005, 0, Math.PI * 2, true);
    shape.holes.push(h);
  }
  const g = new T.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.0015,
    bevelSize: 0.002,
    bevelSegments: 2,
    curveSegments: 24,
  });
  g.translate(0, 0, z - depth / 2);
  g.deleteAttribute("uv");
  return g;
}
export function buildSenderLink(row: Row) {
  const parts = [-1, 1].map((side) =>
    plate(row, profile.link.outer, 0.01, side * 0.033, [profile.link.hole]),
  );
  const merged = mergeGeometries(parts, false)!;
  parts.forEach((p) => p.dispose());
  return merged;
}
export function buildSender(row: Row) {
  const xy = senderRegistration(row),
    a = senderAnchors(row),
    head = vec(a.head_tube.position),
    lower = vec(a.head_tube_lower.position),
    rear = vec(a.rear_axle.position),
    seat = vec(a.seat_tube.position),
    up = vec(a.saddle.position).sub(seat).normalize();
  const parts: T.BufferGeometry[] = [],
    pathEvidence: {
      name: string;
      side: number;
      sampled: ReturnType<typeof samplePolyline>;
    }[] = [];
  for (const m of profile.members as Member[]) {
    const ps = m.path.map((p) => xy(p));
    if (m.name === "top_tube")
      ps[ps.length - 1] = lower.clone().lerp(head, 0.8);
    if (m.name === "downtube") {
      ps[0] = new T.Vector3();
      ps[ps.length - 1] = lower.clone().lerp(head, 0.4);
    }
    if (m.name === "seat_tube") ps[ps.length - 1] = seat.clone();
    for (const side of m.paired ? [-1, 1] : [0]) {
      const path = ps.map((p) =>
        p
          .clone()
          .setZ(
            side *
              T.MathUtils.lerp(
                0.043,
                0.081,
                T.MathUtils.clamp(p.x / rear.x, 0, 1),
              ),
          ),
      );
      const sampled = samplePolyline(
        path,
        m.height_mm.map((h, i) =>
          mm(
            i === m.height_mm.length - 1 &&
              ["top_tube", "downtube"].includes(m.name)
              ? 18
              : h,
          ),
        ),
        path.map((_, i) =>
          mm(
            i === path.length - 1 && ["top_tube", "downtube"].includes(m.name)
              ? 24
              : m.width_mm,
          ),
        ),
        (m.corners_mm ?? path.map(() => 0)).map(mm),
      );
      pathEvidence.push({ name: m.name, side, sampled });
      parts.push(
        memberGeometry(
          sampled,
          ["top_tube", "downtube"].includes(m.name) ? 0.68 : 0.85,
        ),
      );
    }
  }

  parts.push(
    sleeve(seat.clone().addScaledVector(up, -0.037), seat, 0.02145, 0.01645),
  );
  parts.push(
    sleeve(
      new T.Vector3(0, 0, -0.0415),
      new T.Vector3(0, 0, 0.0415),
      0.028,
      0.0195,
    ),
  );
  // The swept seat branch overlaps the top member; no flat polygon patch covers the carbon Y.
  // Fixed shock clevis from the diagonal, with two cheeks and a central gap.
  for (const side of [-1, 1]) {
    parts.push(
      sleeve(
        vec(a.suspension_pivot.position).setZ(side * 0.045 - 0.008),
        vec(a.suspension_pivot.position).setZ(side * 0.045 + 0.008),
        0.022,
        0.006,
      ),
    );
    parts.push(
      sleeve(
        rear.clone().setZ(side * 0.081 - 0.008),
        rear.clone().setZ(side * 0.081 + 0.008),
        0.017,
        0.006,
      ),
    );
  }
  const expanded = parts.map((g) => (g.index ? g.toNonIndexed() : g.clone()));
  const merged = mergeGeometries(expanded, false)!;
  expanded.forEach((g) => g.dispose());
  parts.forEach((g) => g.dispose());
  let geometry = mergeVertices(merged, 1e-6);
  merged.dispose();
  const bores = frameBores({
    ...row,
    asset: { ...row.asset, manifest: { ...row.asset.manifest, anchors: a } },
  });
  const axis = head.clone().sub(lower).normalize();
  bores[0].radius = 0.0318;
  bores[0].start = lower.clone().addScaledVector(axis, -0.06);
  bores[0].end = head.clone().addScaledVector(axis, 0.06);
  for (const bore of bores) {
    const next = openBore(geometry, bore);
    geometry.dispose();
    geometry = next;
  }
  // Add the untouched analytic hollow sleeve after cutting its member roots.
  // Running subtraction over its own inner wall would create faceted rim remnants.
  const headShell = taperedHead(lower, head),
    finished = mergeGeometries([geometry, headShell], false)!;
  geometry.dispose();
  headShell.dispose();
  geometry = mergeVertices(finished, 1e-6);
  finished.dispose();
  return { geometry, pathEvidence };
}
export async function frameV24(row: Row) {
  const old = (await new GLTFLoader().loadAsync("/" + row.predecessor_file))
    .scene;
  const oldPaint = old.getObjectByName(
    row.asset.manifest.paintable_nodes[0],
  ) as T.Mesh;
  if (!oldPaint?.isMesh) throw Error("Expected painted Sender predecessor");
  const group = new T.Group(),
    paintMat = (oldPaint.material as T.MeshStandardMaterial).clone(),
    dark = new T.MeshStandardMaterial({ color: "#191c1c", roughness: 0.7 }),
    metal = new T.MeshStandardMaterial({
      color: "#777d7e",
      metalness: 0.8,
      roughness: 0.3,
    });
  paintMat.metalness = 0.12;
  paintMat.roughness = 0.48;
  const fresh = buildSender(row),
    paint = new T.Mesh(fresh.geometry, paintMat);
  paint.name = row.slug + "__paint_v24";
  group.add(paint);
  const xy = senderRegistration(row),
    a = senderAnchors(row),
    blackParts: T.BufferGeometry[] = [];
  for (const side of [-1, 1])
    blackParts.push(
      borePlate(row, profile.mount_plate, 0.012, side * 0.027, [
        profile.image_landmarks.shock_upper,
      ]),
    );
  // The old green frame's linkage is a different generation; reconstruct this topology.
  for (const side of [-1, 1])
    blackParts.push(plate(row, profile.rear_bridge, 0.016, side * 0.045));
  blackParts.push(buildSenderLink(row));
  const pivot = vec(a.suspension_pivot.position);
  blackParts.push(
    sleeve(pivot.clone().setZ(-0.058), pivot.clone().setZ(0.058), 0.021, 0.006),
  );
  const idler = vec(a.chain_idler.position).setZ(0.064);
  const gearShape = new T.Shape();
  for (let i = 0; i < 128; i++) {
    const a = (i / 128) * Math.PI * 2,
      r = i % 4 < 2 ? 0.031 : 0.028;
    const x = Math.cos(a) * r,
      y = Math.sin(a) * r;
    if (i === 0) gearShape.moveTo(x, y);
    else gearShape.lineTo(x, y);
  }
  gearShape.closePath();
  const centreHole = new T.Path();
  centreHole.absarc(0, 0, 0.008, 0, Math.PI * 2, true);
  gearShape.holes.push(centreHole);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2,
      h = new T.Path();
    h.absarc(
      Math.cos(a) * 0.018,
      Math.sin(a) * 0.018,
      0.0055,
      0,
      Math.PI * 2,
      true,
    );
    gearShape.holes.push(h);
  }
  const gear = new T.ExtrudeGeometry(gearShape, {
    depth: 0.012,
    bevelEnabled: false,
    curveSegments: 16,
  });
  gear.translate(idler.x, idler.y, idler.z - 0.006);
  gear.deleteAttribute("uv");
  blackParts.push(gear);
  // Only the drive side has pulley/guide and chainstay guard.
  const guard = profile.members.find((m) => m.name === "lower_stay")!;
  const guardPs = guard.path.map((p) =>
    xy(p, 0.061).add(new T.Vector3(0, 0.019, 0)),
  );
  blackParts.push(
    memberGeometry(
      samplePolyline(
        guardPs,
        guardPs.map(() => 0.005),
        guardPs.map(() => 0.017),
        guardPs.map(() => 0),
      ),
    ),
  );
  blackParts.push(
    plate(
      row,
      [
        [790, 667],
        [821, 654],
        [858, 598],
        [870, 596],
        [847, 638],
        [827, 671],
        [806, 691],
        [790, 689],
      ],
      0.074,
      0,
    ),
  );
  // Fork stops sit on the two upper-member flanks, not floating beside the head.
  for (const side of [-1, 1])
    blackParts.push(
      plate(
        row,
        [
          [1006, 319],
          [1053, 284],
          [1066, 280],
          [1064, 288],
          [1012, 330],
          [1004, 331],
        ],
        0.005,
        side * 0.025,
      ),
    );
  // UDH hanger is drive-side only; brake tabs remain on the opposite rear arm.
  blackParts.push(
    borePlate(
      row,
      [
        [486, 665],
        [508, 666],
        [516, 680],
        [510, 692],
        [510, 705],
        [500, 713],
        [489, 704],
        [493, 693],
        [482, 685],
      ],
      0.01,
      0.088,
      [[500, 703]],
    ),
  );
  blackParts.push(
    plate(
      row,
      [
        [521, 646],
        [532, 628],
        [548, 620],
        [555, 628],
        [548, 641],
        [530, 654],
      ],
      0.01,
      -0.088,
    ),
  );
  const collarAt = vec(a.seat_tube.position);
  blackParts.push(
    sleeve(
      collarAt
        .clone()
        .addScaledVector(
          vec(a.saddle.position).sub(collarAt).normalize(),
          -0.009,
        ),
      collarAt,
      0.0235,
      0.01645,
    ),
  );
  const flats = blackParts.map((g) => (g.index ? g.toNonIndexed() : g.clone()));
  const bm = mergeGeometries(flats, false)!;
  blackParts.forEach((g) => g.dispose());
  flats.forEach((g) => g.dispose());
  const dg = mergeVertices(bm, 1e-6);
  bm.dispose();
  const details = new T.Mesh(dg, dark);
  details.name = row.slug + "__detail_v24";
  group.add(details);
  // Exposed bolt heads and true hollow shell walls; no mirrored derailleur hardware.
  for (const [p, z, r] of [
    [profile.image_landmarks.pivot, 0.062, 0.01],
    [profile.image_landmarks.shock_upper, 0.038, 0.007],
    [[919, 469], 0.038, 0.0045],
    [[927, 483], 0.038, 0.0045],
    [profile.image_landmarks.shock_lower, 0.046, 0.007],
    [profile.link.fixed_pivot, 0.05, 0.008],
    [profile.link.rear_pivot, 0.055, 0.008],
  ] as [number[], number, number][])
    for (const side of [-1, 1]) {
      const c =
          p === profile.image_landmarks.shock_upper
            ? vec(a.shock_upper.position).setZ(side * z)
            : xy(p, side * z),
        g = new T.CylinderGeometry(r, r, 0.006, 12);
      g.rotateX(Math.PI / 2);
      g.translate(c.x, c.y, c.z);
      const mesh = new T.Mesh(g, metal);
      mesh.name = "bolt";
      group.add(mesh);
    }
  for (const side of [-1, 1]) {
    const mark = lettering("CANYON", "#dedfce", 0.36, 0.07);
    mark.position.copy(xy([938, 494], side * 0.036));
    mark.rotation.z = Math.atan2(
      xy([1007, 384]).y - xy([854, 605]).y,
      xy([1007, 384]).x - xy([854, 605]).x,
    );
    if (side < 0) mark.rotateY(Math.PI);
    mark.name = row.slug + "__lettering_" + side;
    group.add(mark);
  }
  for (const [name, v] of Object.entries(a) as [string, any][]) {
    const marker = new T.Object3D();
    marker.name = "mount_" + name;
    marker.position.fromArray(v.position);
    group.add(marker);
  }
  // Offline batch per material, retaining vertex indices and texture-bearing labels.
  group.updateMatrixWorld(true);
  const sets = new Map<T.Material, T.Mesh[]>();
  group.traverse((n) => {
    if (n instanceof T.Mesh && !Array.isArray(n.material)) {
      const set = sets.get(n.material) ?? [];
      set.push(n);
      sets.set(n.material, set);
    }
  });
  for (const [material, meshes] of sets) {
    if (meshes.length < 2) continue;
    const gs = meshes.map((n) => {
      const g = n.geometry.clone().applyMatrix4(n.matrixWorld);
      if (!(material as T.MeshStandardMaterial).map) g.deleteAttribute("uv");
      return g.index ? g.toNonIndexed() : g;
    });
    const merged = mergeGeometries(gs, false)!;
    gs.forEach((g) => g.dispose());
    const g = mergeVertices(merged, 1e-9);
    merged.dispose();
    for (const mesh of meshes) {
      mesh.removeFromParent();
      mesh.geometry.dispose();
    }
    const mesh = new T.Mesh(g, material);
    mesh.name =
      material === paintMat
        ? paint.name
        : row.slug + (material === dark ? "__detail_v24" : "__metal_v24");
    group.add(mesh);
  }
  old.traverse((n) => {
    if (n instanceof T.Mesh) {
      n.geometry.dispose();
      for (const m of Array.isArray(n.material) ? n.material : [n.material])
        m.dispose();
    }
  });
  return { group, anchors: a, paintable_nodes: [paint.name] };
}
