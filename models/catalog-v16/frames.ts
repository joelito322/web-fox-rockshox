/** CHERRY BOMB 29 exterior, offline only. No published predecessor is mutated. */
import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  mergeGeometries,
  mergeVertices,
} from "three/addons/utils/BufferGeometryUtils.js";
import profile from "./profile.json";
import trace from "../catalog-v5/traces/da-bomb-cherry-bomb-29.json";
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
export function cherryRegistration(row: Row) {
  if (row.slug !== "da-bomb-cherry-bomb-29")
    throw Error("CHERRY-only exterior reconstruction");
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

/** Both official colour photographs expose this opening; hidden plate depth is inferred. */
export function buildCherryLink(row: Row) {
  const xy = cherryRegistration(row);
  const rocker = trace.sections.find((s) => s.name === "rocker")!;
  const outline = rocker.points.map((p) => {
    const v = xy(p);
    return new T.Vector2(v.x, v.y);
  });
  // The lower tip stays above the main pivot's solid bearing land.
  const opening = [
    [554, 543],
    [584, 539],
    [562, 566],
  ].map((p) => {
    const v = xy(p);
    return new T.Vector2(v.x, v.y);
  });
  const shape = new T.Shape(outline);
  shape.holes.push(new T.Path(opening));
  const plates = [-1, 1].map((side) => {
    const g = new T.ExtrudeGeometry(shape, {
      depth: 0.026,
      bevelEnabled: false,
      curveSegments: 1,
      steps: 1,
    });
    g.translate(0, 0, side * 0.035 - 0.013);
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
export function buildCherry(row: Row) {
  const xy = cherryRegistration(row),
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
    for (const side of member.paired ? [-1, 1] : [0]) {
      const centerPath = member.paired ? [rear.clone(), ...source] : source;
      const heights = member.paired
        ? [member.height_mm[0], ...member.height_mm]
        : member.height_mm;
      const corners = member.corners_mm ?? source.map(() => 0);
      const localCorners = member.paired
        ? [0, 7, ...corners.slice(1)]
        : corners;
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
          ["top_tube", "downtube"].includes(member.name) ? 0.88 : 0.96,
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
  const yoke =
    pathEvidence.find((m) => m.name === "shock_yoke") ??
    pathEvidence.find((m) => m.name === "lower_yoke");
  if (yoke) {
    const eye = vec(a.shock_lower.position),
      sampled = yoke.sampled.samples;
    let closest = sampled[0].point,
      distance = Infinity;
    for (const s of sampled) {
      const d = s.point.distanceToSquared(eye);
      if (d < distance) {
        closest = s.point;
        distance = d;
      }
    }
    for (const side of [-1, 1]) {
      const start = closest.clone().setZ(side * 0.021),
        end = eye.clone().setZ(side * 0.021);
      if (start.distanceTo(end) > 0.002)
        geometries.push(
          memberGeometry(
            samplePolyline([start, end], [0.01, 0.012], [0.007, 0.007], [0, 0]),
          ),
        );
      geometries.push(
        sleeve(
          eye.clone().setZ(side * 0.021 - 0.007),
          eye.clone().setZ(side * 0.021 + 0.007),
          0.013,
          0.004,
        ),
      );
    }
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

export async function frameV16(row: Row) {
  cherryRegistration(row);
  const group = (await new GLTFLoader().loadAsync("/" + row.predecessor_file))
    .scene;
  group.updateMatrixWorld(true);
  const paint = group.getObjectByName(
    row.asset.manifest.paintable_nodes[0],
  ) as T.Mesh;
  if (!paint?.isMesh || row.asset.manifest.paintable_nodes.length !== 1)
    throw Error("Expected one CHERRY painted predecessor mesh");
  const fresh = buildCherry(row);
  paint.geometry.dispose();
  paint.geometry = fresh.geometry;
  const linkName =
    row.slug +
    "--" +
    row.variant.specs.size_label.toLowerCase().replaceAll("″", "in") +
    "__link";
  const link = group.getObjectByName(linkName) as T.Mesh;
  if (!link?.isMesh) throw Error("Expected CHERRY rocker predecessor mesh");
  link.geometry.dispose();
  link.geometry = buildCherryLink(row);
  return {
    group,
    anchors: row.asset.manifest.anchors,
    paintable_nodes: row.asset.manifest.paintable_nodes,
  };
}
