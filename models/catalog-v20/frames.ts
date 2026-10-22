/** GT Fury Carbon High Pivot exterior, offline only. No published predecessor is mutated. */
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
export function furyRegistration(row: Row) {
  if (row.slug !== "gt-fury-carbon-high-pivot")
    throw Error("Fury-only exterior reconstruction");
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
    for (const radius of [outer, 0.0245])
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

/** Paired Fury LTS rocker: its photographed slot remains open. */
export function buildFuryLink(row: Row) {
  const xy = furyRegistration(row);
  const links = (profile as any).links as {
    outer: number[][];
    hole: number[][];
  }[];
  const plates: T.BufferGeometry[] = [];
  for (const link of links) {
    const points = (pixels: number[][]) =>
      pixels.map((p) => {
        const v = xy(p);
        return new T.Vector2(v.x, v.y);
      });
    const shape = new T.Shape(points(link.outer));
    for (const pixel of [
      profile.links[0].fixed_pivot,
      profile.links[0].rear_pivot,
      profile.links[0].shock_upper,
    ]) {
      const v = xy(pixel),
        bore = new T.Path();
      bore.absarc(v.x, v.y, 0.005, 0, Math.PI * 2, true);
      shape.holes.push(bore);
    }
    for (const side of [-1, 1]) {
      const g = new T.ExtrudeGeometry(shape, {
        depth: 0.01,
        bevelEnabled: false,
        curveSegments: 1,
        steps: 1,
      });
      g.translate(0, 0, side * 0.043 - 0.005);
      g.deleteAttribute("uv");
      plates.push(g);
    }
  }
  const merged = mergeGeometries(plates, false)!;
  plates.forEach((g) => g.dispose());
  const result = mergeVertices(merged, 1e-6);
  merged.dispose();
  return result;
}

/** Paired lower shock-bay cheeks with the observed triangular opening. */
export function buildFuryBay(row: Row) {
  const xy = furyRegistration(row),
    parts: T.BufferGeometry[] = [];
  const points = (ps: number[][]) =>
    ps.map((p) => {
      const v = xy(p);
      return new T.Vector2(v.x, v.y);
    });
  const shape = new T.Shape(points(profile.bay.outer));
  shape.holes.push(new T.Path(points(profile.bay.hole)));
  const eye = vec(row.asset.manifest.anchors.shock_lower.position),
    bore = new T.Path();
  bore.absarc(eye.x, eye.y, 0.005, 0, Math.PI * 2, true);
  shape.holes.push(bore);
  for (const side of [-1, 1]) {
    const g = new T.ExtrudeGeometry(shape, {
      depth: 0.018,
      bevelEnabled: false,
      curveSegments: 24,
    });
    g.translate(0, 0, side * 0.028 - 0.009);
    g.deleteAttribute("uv");
    parts.push(g);
  }
  const geometry = mergeGeometries(parts, false)!;
  parts.forEach((g) => g.dispose());
  return geometry;
}

/** Pure painted exterior. Guards and axle hardware stay in predecessor. */
export function buildFury(row: Row) {
  const xy = furyRegistration(row),
    a = row.asset.manifest.anchors,
    head = vec(a.head_tube.position),
    lower = vec(a.head_tube_lower.position),
    seat = vec(a.seat_tube.position),
    rear = vec(a.rear_axle.position);
  const headAxis = head.clone().sub(lower).normalize();
  const up = vec(a.saddle.position).sub(seat).normalize();
  const geometries: T.BufferGeometry[] = [];
  const pathEvidence: {
    name: string;
    side: number;
    sampled: ReturnType<typeof samplePolyline>;
  }[] = [];
  const members = profile.members as Member[];
  for (const member of members) {
    const source = member.path.map((p) => xy(p));

    if (member.name === "seat_tube") source[source.length - 1] = seat.clone();
    if (member.name === "top_tube")
      source[source.length - 1] = lower.clone().lerp(head, 0.8);
    if (member.name === "downtube")
      // The diagonal enters within the sleeve, above its lower bearing rim.
      // Keep its terminal cross-section inside the rim before drilling the bore;
      // otherwise subtraction exposes a detached crescent below the head tube.
      source[source.length - 1] = lower.clone().lerp(head, 0.4);
    for (const side of member.paired ? [-1, 1] : [0]) {
      const centerPath = source;

      const heights = [...member.height_mm];
      if (member.name === "downtube") heights[heights.length - 1] = 25;
      const corners = member.corners_mm ?? source.map(() => 0);
      const localCorners = corners;
      const path = centerPath.map((p) => {
        const progress = T.MathUtils.clamp(p.x / rear.x, 0, 1);
        return p
          .clone()
          .setZ(
            side *
              T.MathUtils.lerp(
                0.045,
                mm((row.variant.specs.rear_hub?.width_mm ?? 148) / 2) + 0.007,
                progress,
              ),
          );
      });
      const sampled = samplePolyline(
        path,
        heights.map(mm),
        path.map(() => mm(member.width_mm)),
        localCorners.map(mm),
      );
      pathEvidence.push({ name: member.name, side, sampled });
      geometries.push(
        memberGeometry(
          sampled,
          ["top_tube", "downtube"].includes(member.name) ? 0.68 : 0.85,
        ),
      );
    }
  }
  // The Fury lower stay ends at a distinct dropout pivot below/in front of the axle.
  // A compact paired adapter connects it to the axle instead of bending the whole stay.
  const chainJoint = xy(
    profile.members.find((m) => m.name === "chain_stay")!.path[0],
  );
  for (const side of [-1, 1]) {
    const rearZ = mm((row.variant.specs.rear_hub?.width_mm ?? 148) / 2) + 0.007;
    const jointZ = T.MathUtils.lerp(
      0.045,
      rearZ,
      T.MathUtils.clamp(chainJoint.x / rear.x, 0, 1),
    );
    geometries.push(
      memberGeometry(
        samplePolyline(
          [
            rear.clone().setZ(side * rearZ),
            chainJoint.clone().setZ(side * jointZ),
          ],
          [0.014, 0.015],
          [0.011, 0.012],
          [0, 0],
        ),
        0.83,
      ),
    );
    const fixed = xy(profile.links[0].fixed_pivot).setZ(side * 0.034);
    const parent = xy([780, 734]).setZ(side * 0.034);
    geometries.push(
      memberGeometry(
        samplePolyline([parent, fixed], [0.018, 0.018], [0.012, 0.012], [0, 0]),
        0.8,
      ),
    );
    geometries.push(
      sleeve(
        fixed.clone().setZ(side * 0.034 - 0.008),
        fixed.clone().setZ(side * 0.034 + 0.008),
        0.018,
        0.005,
      ),
    );
  }
  // Head/seat/BB walls are explicit hollow sleeves rather than filled cylinders.
  geometries.push(taperedHead(lower, head));
  geometries.push(
    sleeve(
      seat.clone().addScaledVector(up, -0.036),
      seat,
      mm((row.variant.specs.seatpost_diameter_mm ?? 31.6) / 2) + 0.004,
      mm((row.variant.specs.seatpost_diameter_mm ?? 31.6) / 2) - 0.001,
    ),
  );
  const bbWidth = mm(row.variant.specs.bb_shell?.width_mm ?? 73);
  geometries.push(
    sleeve(
      new T.Vector3(0, 0, -bbWidth / 2),
      new T.Vector3(0, 0, bbWidth / 2),
      0.027,
      0.0195,
    ),
  );
  // Existing dark rocker carries the upper shock eye: adding a fixed bridge there
  // would fuse a moving linkage. Only its frame pivot and the lower yoke are paint.
  const pivot = vec(a.suspension_pivot.position);
  for (const side of [-1, 1]) {
    geometries.push(
      sleeve(
        pivot.clone().setZ(side * 0.039 - 0.007),
        pivot.clone().setZ(side * 0.039 + 0.007),
        0.018,
        0.005,
      ),
    );
    geometries.push(
      sleeve(
        rear.clone().setZ(side * 0.075 - 0.008),
        rear.clone().setZ(side * 0.075 + 0.008),
        0.016,
        0.006,
      ),
    );
  }
  geometries.push(buildFuryBay(row));
  // Seat branch, spine and upper member meet in a closed carbon web, not a Force triangle.
  const junction = new T.Shape(
    profile.junction.map((p) => {
      const v = xy(p);
      return new T.Vector2(v.x, v.y);
    }),
  );
  const web = new T.ExtrudeGeometry(junction, {
    depth: 0.048,
    bevelEnabled: false,
    curveSegments: 1,
  });
  web.translate(0, 0, -0.024);
  web.deleteAttribute("uv");
  geometries.push(web);
  // Main pivot closes the two chainstay roots; gear/guide remain unilateral outside it.
  geometries.push(
    sleeve(pivot.clone().setZ(-0.054), pivot.clone().setZ(0.054), 0.023, 0.006),
  );
  // Keep identical attribute layouts across analytic lofts and extruded sleeves.
  const expanded = geometries.map((g) =>
    g.index ? g.toNonIndexed() : g.clone(),
  );
  const merge = mergeGeometries(expanded, false)!;
  expanded.forEach((g) => g.dispose());
  geometries.forEach((g) => g.dispose());
  let geometry = mergeVertices(merge, 1e-6);
  merge.dispose();
  // Finite long head cut clears both ends; seat/BB retain original insertion scope.
  const bores = frameBores(row);
  bores[0].radius = 0.0246;
  bores[0].start = lower.clone().addScaledVector(headAxis, -0.06);
  bores[0].end = head.clone().addScaledVector(headAxis, 0.06);
  for (const bore of bores) {
    const next = openBore(geometry, bore);
    geometry.dispose();
    geometry = next;
  }
  // Restore the inward-facing head lining, cleared by subtraction's larger radius.
  const lining = new T.CylinderGeometry(
      0.0245,
      0.0245,
      head.distanceTo(lower),
      32,
      1,
      true,
    ),
    index = lining.index!,
    normals = lining.getAttribute("normal");
  for (let i = 0; i < index.count; i += 3) {
    const k = index.getX(i + 1);
    index.setX(i + 1, index.getX(i + 2));
    index.setX(i + 2, k);
  }
  for (let i = 0; i < normals.count; i++)
    normals.setXYZ(i, -normals.getX(i), -normals.getY(i), -normals.getZ(i));
  lining.applyQuaternion(
    new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), headAxis),
  );
  const middle = lower.clone().add(head).multiplyScalar(0.5);
  lining.translate(middle.x, middle.y, middle.z);
  lining.deleteAttribute("uv");
  const finished = mergeGeometries([geometry, lining], false)!;
  geometry.dispose();
  lining.dispose();
  geometry = mergeVertices(finished, 1e-6);
  finished.dispose();
  return { geometry, pathEvidence };
}

/** Declared local replacement mask for predecessor black rocker triangles only. */
export const FURY_LINK_PIXEL_BOUNDS = {
  min: [625, 605],
  max: [970, 790],
  padding_m: 0.008,
} as const;
export function isRebuiltLinkTriangle(row: Row, points: T.Vector3[]) {
  const xy = furyRegistration(row),
    mask = FURY_LINK_PIXEL_BOUNDS;
  const bounds = new T.Box3().setFromPoints(
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

export async function frameV20(row: Row) {
  furyRegistration(row);
  const group = (await new GLTFLoader().loadAsync("/" + row.predecessor_file))
    .scene;
  group.updateMatrixWorld(true);
  const paint = group.getObjectByName(
    row.asset.manifest.paintable_nodes[0],
  ) as T.Mesh;
  if (!paint?.isMesh || row.asset.manifest.paintable_nodes.length !== 1)
    throw Error("Expected one Fury painted predecessor mesh");
  const fresh = buildFury(row);
  paint.geometry.dispose();
  paint.geometry = fresh.geometry;
  // The predecessor combines the old rocker, pulley and hanger into detail_1.
  // Remove only rocker triangles; retain the asymmetric drive-side hardware.
  const dark = group.getObjectByName(row.slug + "__detail_1") as T.Mesh;
  if (!dark?.isMesh) throw Error("Expected Fury dark predecessor mesh");
  const xy = furyRegistration(row);
  const flat = dark.geometry.index
    ? dark.geometry.toNonIndexed()
    : dark.geometry.clone();
  const attrs = Object.keys(flat.attributes);
  const values: Record<string, number[]> = {};
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
  const link = new T.Mesh(buildFuryLink(row), dark.material);
  link.name =
    row.slug + "--" + row.variant.specs.size_label.toLowerCase() + "__link";
  group.add(link);
  const diagonal = fresh.pathEvidence.find(
    (p) => p.name === "downtube",
  )!.sampled;
  const range = diagonal.straightRanges.reduce((a, b) =>
    diagonal.points[a.from].distanceTo(diagonal.points[a.to]) >
    diagonal.points[b.from].distanceTo(diagonal.points[b.to])
      ? a
      : b,
  );
  const start = diagonal.points[range.from],
    end = diagonal.points[range.to],
    center = start.clone().lerp(end, 0.79);
  let shared: T.MeshStandardMaterial | undefined;
  for (const side of [-1, 1]) {
    const name = row.slug + "__lettering_" + side,
      old = group.getObjectByName(name) as T.Mesh;
    if (old) {
      old.removeFromParent();
      old.geometry.dispose();
    }
    const mark = lettering("GT", "#79d8c5", 0.145, 0.055);
    // Tighten the canvas crop for the two-letter mark, without changing historic decals.
    mark.material.map!.repeat.set(0.24, 1);
    mark.material.map!.offset.set(0.38, 0);
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
  const black = (dark.material as T.MeshStandardMaterial).clone();
  black.color.set("#171b1c");
  black.roughness = 0.75;
  const patch = (
    name: string,
    pixels: number[][],
    z: number,
    depth: number,
    material: T.Material,
    holes: number[][][] = [],
  ) => {
    const pts = (a: number[][]) =>
        a.map((p) => {
          const v = xy(p);
          return new T.Vector2(v.x, v.y);
        }),
      shape = new T.Shape(pts(pixels));
    for (const hole of holes) shape.holes.push(new T.Path(pts(hole)));
    const g = new T.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
      curveSegments: 1,
    });
    g.translate(0, 0, z);
    g.deleteAttribute("uv");
    const m = new T.Mesh(g, material);
    m.name = row.slug + "__" + name;
    group.add(m);
  };
  patch(
    "chain_guide",
    [
      [697, 844],
      [710, 827],
      [768, 806],
      [787, 807],
      [781, 824],
      [758, 846],
      [732, 849],
      [716, 847],
    ],
    0.055,
    0.012,
    black,
  );
  patch(
    "down_guard",
    [
      [814, 1036],
      [880, 999],
      [980, 928],
      [1033, 875],
      [1118, 731],
      [1152, 689],
      [1162, 683],
      [1150, 702],
      [1095, 789],
      [1046, 882],
      [997, 942],
      [895, 1017],
      [824, 1054],
    ],
    -0.03,
    0.06,
    black,
  );
  // The chain guard follows its own angled rail and transverse taper, on the drive side only.
  const chain = fresh.pathEvidence.find(
    (p) => p.name === "chain_stay" && p.side === 1,
  )!.sampled;
  const guardPath = chain.samples.map((p) =>
    p.point.clone().add(new T.Vector3(0, p.height * 0.85, 0.004)),
  );
  const heights = chain.samples.map(() => 0.005),
    widths = chain.samples.map(() => 0.014);
  const guardGeometry = memberGeometry(
    samplePolyline(
      guardPath,
      heights,
      widths,
      guardPath.map(() => 0),
    ),
    0.7,
  );
  const guard = new T.Mesh(guardGeometry, black);
  guard.name = row.slug + "__chain_guard";
  group.add(guard);
  for (let i = 1; i < guardPath.length - 1; i += 4) {
    const at = guardPath[i],
      g = new T.BoxGeometry(0.005, 0.006, 0.027);
    g.translate(at.x, at.y + 0.005, at.z);
    const rib = new T.Mesh(g, black);
    rib.name = row.slug + "__rib_" + i;
    group.add(rib);
  }
  for (const side of [-1, 1])
    patch(
      "fork_bumper_" + side,
      [
        [1266, 307],
        [1345, 254],
        [1405, 215],
        [1397, 233],
        [1310, 291],
      ],
      side > 0 ? 0.014 : -0.021,
      0.007,
      black,
    );
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
    if (!merged) throw Error("Fury material merge failed");
    parts.forEach((g) => g.dispose());
    nodes.forEach((n) => n.geometry.dispose());
    target.geometry = mergeVertices(merged, 1e-9);
    merged.dispose();
    nodes.slice(1).forEach((n) => n.removeFromParent());
  }

  return {
    group,
    anchors: row.asset.manifest.anchors,
    paintable_nodes: row.asset.manifest.paintable_nodes,
  };
}
