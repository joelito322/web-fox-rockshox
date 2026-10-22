/** COMMENCAL Furious V3 2021 Gun Metal exterior, offline only. No published predecessor is mutated. */
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
export function furiousRegistration(row: Row) {
  if (row.slug !== "commencal-furious-v3-2021")
    throw Error("FURIOUS-only exterior reconstruction");
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
    [0, 0.035],
    [length, 0.03],
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

/** Gun Metal 2021 side/oblique and exploded FURIOUS V3 details expose this opening. Depth inferred. */
export function buildFuriousLink(row: Row) {
  const xy = furiousRegistration(row);
  const points = (pixels: number[][]) =>
    pixels.map((p) => {
      const v = xy(p);
      return new T.Vector2(v.x, v.y);
    });
  const outline = points(profile.rocker.outer),
    opening = points(profile.rocker.hole);
  const shape = new T.Shape(outline);
  shape.holes.push(new T.Path(opening));
  const plates = [-1, 1].map((side) => {
    const g = new T.ExtrudeGeometry(shape, {
      depth: 0.01,
      bevelEnabled: false,
      curveSegments: 1,
      steps: 1,
    });
    g.translate(0, 0, side * 0.043 - 0.005);
    g.deleteAttribute("uv");
    return g;
  });
  const merged = mergeGeometries(plates, false)!;
  plates.forEach((g) => g.dispose());
  const geometry = mergeVertices(merged, 1e-6);
  merged.dispose();
  return geometry;
}

/** Pure painted exterior. Guards and axle hardware stay in predecessor. */
export function buildFurious(row: Row) {
  const xy = furiousRegistration(row),
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
    if (member.name === "downtube") {
      source[0].set(0, 0, 0);
    }
    if (member.name === "seat_tube") source[source.length - 1] = seat.clone();
    if (member.name === "top_tube") {
      source[source.length - 1] = lower.clone().lerp(head, 0.8);
      // Keep the photographed seat shoulder; the long upper run reaches inside
      // the head sleeve on one axis instead of forming an artificial final neck.
      const line = new T.Line3(source[1], source.at(-1)!);
      source[source.length - 2].copy(
        line.closestPointToPoint(source.at(-2)!, true, new T.Vector3()),
      );
    }
    if (member.name === "downtube")
      source[source.length - 1] = lower.clone().lerp(head, 0.4);
    for (const side of member.paired ? [-1, 1] : [0]) {
      const centerPath = source;
      const heights = member.height_mm;
      const localCorners = member.corners_mm ?? source.map(() => 0);
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
          member.paired
            ? 0.7
            : member.name === "downtube"
              ? 0.78
              : member.name === "top_tube"
                ? 0.84
                : 0.96,
        ),
      );
    }
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
  // The FURIOUS shock upper cradle is fixed to the down tube; lower eye belongs to rocker.
  const upper = vec(a.shock_upper.position),
    main = xy(profile.main_pivot),
    fixed = vec(a.suspension_pivot.position);
  for (const side of [-1, 1]) {
    for (const at of [main, fixed])
      geometries.push(
        sleeve(
          at.clone().setZ(side * 0.039 - 0.007),
          at.clone().setZ(side * 0.039 + 0.007),
          0.018,
          0.005,
        ),
      );
    // The 2021 oblique photograph exposes a flared pocket, not a generic rod/washer.
    const outline = [
      [1039, 468],
      [1050, 463],
      [1060, 466],
      [1067, 483],
      [1084, 499],
      [1082, 513],
      [1066, 513],
      [1056, 495],
      [1044, 490],
    ].map((p) => {
      const v = xy(p);
      return new T.Vector2(v.x, v.y);
    });
    const cradle = new T.Shape(outline),
      hole = new T.Path();
    hole.absarc(upper.x, upper.y, 0.004, 0, Math.PI * 2, true);
    cradle.holes.push(hole);
    const ear = new T.ExtrudeGeometry(cradle, {
      depth: 0.012,
      bevelEnabled: false,
      curveSegments: 16,
    });
    ear.translate(0, 0, side * 0.019 - 0.006);
    ear.deleteAttribute("uv");
    geometries.push(ear);
    // White dropout plate joins the lower axle to the distinct rear stay joint.
    const joint = xy(profile.rear_seatstay_joint),
      z = mm((row.variant.specs.rear_hub?.width_mm ?? 150) / 2) + 0.007;
    geometries.push(
      memberGeometry(
        samplePolyline(
          [rear.clone().setZ(side * z), joint.clone().setZ(side * z)],
          [0.014, 0.013],
          [0.011, 0.011],
          [0, 0],
        ),
      ),
    );
    geometries.push(
      sleeve(
        rear.clone().setZ(side * z - 0.008),
        rear.clone().setZ(side * z + 0.008),
        0.016,
        0.006,
      ),
    );
    // Structural transverse bearing shells are added below, ahead of tyre space.
  }
  // Front chainstay bearing shell and seatstay clevis bridge, documented in exploded views.
  geometries.push(
    sleeve(main.clone().setZ(-0.058), main.clone().setZ(0.058), 0.024, 0.006),
  );
  for (const side of [-1, 1]) {
    const joint = xy(profile.rocker.rear_pivot).setZ(side * 0.043);
    geometries.push(
      sleeve(
        joint.clone().setZ(side * 0.043 - 0.009),
        joint.clone().setZ(side * 0.043 + 0.009),
        0.018,
        0.005,
      ),
    );
  }
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
  bores[0].start = lower.clone().addScaledVector(headAxis, -0.06);
  bores[0].end = head.clone().addScaledVector(headAxis, 0.06);
  for (const bore of bores) {
    const next = openBore(geometry, bore);
    geometry.dispose();
    geometry = next;
  }
  // Restore the inward-facing head lining, cleared by subtraction's larger radius.
  const lining = new T.CylinderGeometry(
      0.0272,
      0.0272,
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

/** Approximate the compact italic 2021 graphics without reusing 2025 FRS typography. */
function factoryWordmark(
  text: string,
  color: string,
  width: number,
  height: number,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 192;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.font = "italic 900 132px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(text, 512, 102, 1000);
  const map = new T.CanvasTexture(canvas);
  map.colorSpace = T.SRGBColorSpace;
  return new T.Mesh(
    new T.PlaneGeometry(width, height),
    new T.MeshStandardMaterial({
      map,
      transparent: true,
      alphaTest: 0.08,
      roughness: 0.6,
      side: T.DoubleSide,
      depthWrite: false,
    }),
  );
}

/** Explicit local zones: replace old generic rocker and block-shaped hanger, retain brake bosses/metal. */
export const REBUILT_DARK_ZONES = [
  { min: [785.066, 561.998], max: [963.399, 648.737], padding_m: 0.008 },
  { min: [362.735, 746.557], max: [429.155, 816.072], padding_m: 0.003 },
];
export function isRebuiltLinkTriangle(row: Row, points: T.Vector3[]) {
  const xy = furiousRegistration(row);
  return REBUILT_DARK_ZONES.some((z) => {
    const box = new T.Box3().setFromPoints(
      [
        [z.min[0], z.min[1]],
        [z.max[0], z.min[1]],
        [z.min[0], z.max[1]],
        [z.max[0], z.max[1]],
      ].map((p) => xy(p)),
    );
    return points.some(
      (p) =>
        p.x >= box.min.x - z.padding_m &&
        p.x <= box.max.x + z.padding_m &&
        p.y >= box.min.y - z.padding_m &&
        p.y <= box.max.y + z.padding_m,
    );
  });
}

export async function frameV19(row: Row) {
  furiousRegistration(row);
  const group = (await new GLTFLoader().loadAsync("/" + row.predecessor_file))
    .scene;
  group.updateMatrixWorld(true);
  const paint = group.getObjectByName(
    row.asset.manifest.paintable_nodes[0],
  ) as T.Mesh;
  if (!paint?.isMesh || row.asset.manifest.paintable_nodes.length !== 1)
    throw Error("Expected one FURIOUS painted predecessor mesh");
  const fresh = buildFurious(row);
  paint.geometry.dispose();
  paint.geometry = fresh.geometry;
  const dark = group.getObjectByName(row.slug + "__detail_1") as T.Mesh;
  if (!dark?.isMesh) throw Error("Expected FURIOUS dark mesh");
  const flat = dark.geometry.index
    ? dark.geometry.toNonIndexed()
    : dark.geometry.clone();
  const attrs = Object.keys(flat.attributes),
    values: Record<string, number[]> = {};
  attrs.forEach((k) => (values[k] = []));
  const p = flat.attributes.position;
  for (let i = 0; i < p.count; i += 3) {
    if (
      isRebuiltLinkTriangle(
        row,
        [0, 1, 2].map((j) => new T.Vector3().fromBufferAttribute(p, i + j)),
      )
    )
      continue;
    for (const k of attrs) {
      const a = flat.attributes[k];
      for (let j = 0; j < 3; j++)
        for (let c = 0; c < a.itemSize; c++)
          values[k].push(a.array[(i + j) * a.itemSize + c]);
    }
  }
  const kept = new T.BufferGeometry();
  for (const k of attrs)
    kept.setAttribute(
      k,
      new T.Float32BufferAttribute(values[k], flat.attributes[k].itemSize),
    );
  flat.dispose();
  dark.geometry.dispose();
  dark.geometry = mergeVertices(kept, 1e-6);
  kept.dispose();
  const link = new T.Mesh(buildFuriousLink(row), dark.material);
  link.name =
    row.slug + "--" + row.variant.specs.size_label.toLowerCase() + "__link";
  group.add(link);
  // Upper shock ear on the rocker reaches the immutable length-adjusted lower eye.
  const xy = furiousRegistration(row),
    lowerEye = vec(row.asset.manifest.anchors.shock_lower.position),
    traceEye = xy(profile.rocker.shock_joint);
  for (const side of [-1, 1]) {
    const ear = memberGeometry(
      samplePolyline(
        [
          traceEye.clone().setZ(side * 0.043),
          lowerEye.clone().setZ(side * 0.019),
        ],
        [0.012, 0.012],
        [0.007, 0.007],
        [0, 0],
      ),
    );
    const m = new T.Mesh(ear, dark.material);
    m.name = link.name + "__ear_" + side;
    group.add(m);
  }
  // The factory wordmark belongs on the top tube, not a generic down tube decal.
  let sharedWordmark: T.MeshStandardMaterial | undefined;
  const top = fresh.pathEvidence.find((p) => p.name === "top_tube")!.sampled;
  const range = top.straightRanges.reduce((a, b) =>
    top.points[a.from].distanceTo(top.points[a.to]) >
    top.points[b.from].distanceTo(top.points[b.to])
      ? a
      : b,
  );
  const start = top.points[range.from],
    end = top.points[range.to],
    center = start.clone().lerp(end, 0.8);
  for (const side of [-1, 1]) {
    const name = row.slug + "__lettering_" + side,
      old = group.getObjectByName(name) as T.Mesh;
    if (old) {
      old.removeFromParent();
      old.geometry.dispose();
    }
    const decal = factoryWordmark(
      "COMMENCAL",
      "#15191a",
      start.distanceTo(end) * 0.34,
      0.019,
    );
    if (sharedWordmark) {
      decal.material.map?.dispose();
      decal.material.dispose();
      decal.material = sharedWordmark;
    } else sharedWordmark = decal.material;
    decal.position.copy(center).setZ(side * 0.0208);
    decal.rotation.z = Math.atan2(end.y - start.y, end.x - start.x);
    if (side < 0) decal.rotateY(Math.PI);
    decal.name = name;
    group.add(decal);
  }
  const patch = (
    name: string,
    pixels: number[][],
    z: number,
    depth: number,
    material: T.Material,
    holes: number[][][] = [],
  ) => {
    const points = (v: number[][]) =>
      v.map((p) => {
        const q = xy(p);
        return new T.Vector2(q.x, q.y);
      });
    const shape = new T.Shape(points(pixels));
    for (const hole of holes) shape.holes.push(new T.Path(points(hole)));
    const g = new T.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
      curveSegments: 1,
      steps: 1,
    });
    g.translate(0, 0, z);
    if (name === "chain_guard" || name.startsWith("chain_rib_")) {
      const p = g.getAttribute("position"),
        rear = vec(row.asset.manifest.anchors.rear_axle.position);
      for (let i = 0; i < p.count; i++) {
        const progress = T.MathUtils.clamp(p.getX(i) / rear.x, 0, 1);
        const surface =
          T.MathUtils.lerp(
            0.045,
            mm((row.variant.specs.rear_hub?.width_mm ?? 150) / 2) + 0.007,
            progress,
          ) + 0.0125;
        p.setZ(i, p.getZ(i) - z + surface);
      }
      g.computeVertexNormals();
    }
    g.deleteAttribute("uv");
    const m = new T.Mesh(g, material);
    m.name = row.slug + "__" + name;
    group.add(m);
  };
  const black = (dark.material as T.MeshStandardMaterial).clone();
  black.color.set("#191c1d");
  black.roughness = 0.78;
  // Diagonal skid strip and local upper protector, located from the Gun Metal 2021 photo.
  patch(
    "lower_skid",
    [
      [830.727, 771.372],
      [860.688, 757.417],
      [912.052, 718.755],
      [958.522, 673.865],
      [990.548, 635.378],
      [999.34, 619.336],
      [999.805, 638.145],
      [969.768, 681.744],
      [921.462, 734.631],
      [864.217, 780.189],
      [840.893, 790.662],
    ],
    -0.025,
    0.05,
    black,
  );
  patch(
    "upper_skid",
    [
      [1093.121, 482.803],
      [1106.154, 450.76],
      [1134.333, 394.066],
      [1170.82, 343.567],
      [1186.213, 333.735],
      [1183.109, 349.726],
      [1153.036, 403.017],
      [1121.95, 458.598],
      [1102.284, 483.86],
    ],
    -0.025,
    0.05,
    black,
  );
  // Drive-side chain guard has the characteristic painted inset, not a solid bar.
  patch(
    "chain_guard",
    [
      [441.794, 745.837],
      [700.272, 737.784],
      [722.167, 742.716],
      [709.619, 752.521],
      [696.814, 768.03],
      [705.816, 776.499],
      [452.269, 781.087],
      [438.336, 776.083],
    ],
    0.078,
    0.012,
    black,
    [
      [
        [634.415, 750.925],
        [681.623, 750.496],
        [694.418, 755.51],
        [680.32, 768.18],
        [635.387, 768.589],
        [627.017, 761.254],
      ],
    ],
  );
  // Ribs are positioned in the Furious photograph space, on the one drive-side guard.
  for (let i = 0; i < 12; i++) {
    const x = 455 + i * 21,
      y = 744 - i * 0.6;
    patch(
      "chain_rib_" + i,
      [
        [x, y],
        [x + 5, y],
        [x + 5, y + 8],
        [x + 1, y + 8],
      ],
      0.078,
      0.014,
      black,
    );
  }
  // Bumpers are a pair on the head/down junction, as documented by FURIOUS V3 tech.
  for (const side of [-1, 1])
    patch(
      "fork_bumper_" + side,
      [
        [1243, 263],
        [1270, 250],
        [1281, 258],
        [1282, 270],
        [1251, 289],
        [1242, 280],
      ],
      side > 0 ? 0.028 : -0.034,
      0.006,
      black,
    );
  patch(
    "derailleur_hanger",
    [
      [379.887, 758.372],
      [398.245, 761.056],
      [398.778, 770.742],
      [392.011, 782.205],
      [390.931, 793.617],
      [381.32, 805.106],
      [372.632, 802.335],
      [377.693, 790.887],
      [375.485, 781.786],
      [378.777, 769.214],
    ],
    0.084,
    0.009,
    black,
    [
      [
        [381.611, 789.711],
        [384.93, 787.971],
        [389.099, 791.353],
        [386.538, 796.507],
        [382.113, 798.828],
        [379.65, 795.43],
      ],
    ],
  );
  for (const side of [-1, 1]) {
    const center = xy(profile.main_pivot),
      cap = sleeve(
        center.clone().setZ(side * 0.063 - 0.002),
        center.clone().setZ(side * 0.063 + 0.002),
        0.018,
        0.0045,
      );
    const m = new T.Mesh(cap, black);
    m.name = row.slug + "__main_pivot_cap_" + side;
    group.add(m);
  }
  // Rear brake adapter rises on the non-drive side, never mirror it.
  patch(
    "brake_adapter",
    [
      [377.223, 709.94],
      [389.714, 688.733],
      [382.799, 676.824],
      [388.742, 671.069],
      [400.077, 690.919],
      [414.024, 665.138],
      [408.278, 653.789],
      [414.884, 649.738],
      [424.481, 669.034],
      [406.992, 702.828],
      [403.351, 719.393],
    ],
    -0.086,
    0.013,
    paint.material as T.Material,
    [
      [
        [390.341, 700.129],
        [402.984, 692.033],
        [411.269, 677.135],
        [411.708, 685.112],
        [401.367, 704.019],
        [392.517, 708.66],
      ],
    ],
  );
  let sharedFrs: T.MeshStandardMaterial | undefined;
  for (const side of [-1, 1]) {
    // A short decal on each seatstay; generic lettering remains an approximation.
    const start = xy([604, 669]),
      end = xy([746, 632]),
      c = start.clone().lerp(end, 0.5);
    const label = lettering(
      "FURIOUS",
      "#101112",
      start.distanceTo(end) * 0.88,
      0.022,
    );
    if (sharedFrs) {
      label.material.map?.dispose();
      label.material.dispose();
      label.material = sharedFrs;
    } else sharedFrs = label.material;
    label.position.copy(c).setZ(side * 0.073);
    label.rotation.z = Math.atan2(end.y - start.y, end.x - start.x);
    if (side < 0) label.rotateY(Math.PI);
    label.name = row.slug + "__frs_decal_" + side;
    group.add(label);
  }
  // Bake same-material accessories into five draw groups offline. Connected surfaces
  // remain separable by the existing motion rig; no extra runtime geometry work.
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
    if (!merged) throw Error("FURIOUS material merge failed");
    parts.forEach((g) => g.dispose());
    nodes.forEach((n) => n.geometry.dispose());
    target.geometry = mergeVertices(merged, 1e-9);
    merged.dispose();
    for (const n of nodes.slice(1)) n.removeFromParent();
  }
  return {
    group,
    anchors: row.asset.manifest.anchors,
    paintable_nodes: row.asset.manifest.paintable_nodes,
  };
}
