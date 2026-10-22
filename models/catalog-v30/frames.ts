/** Offline V10.8 MY27 reconstruction from independent photographed contours. */
import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  mergeGeometries,
  mergeVertices,
  toCreasedNormals,
} from "three/addons/utils/BufferGeometryUtils.js";
import contours from "./contours.json";
import { v10Anchors, v10Registration, type Row } from "./registration";
export { v10Anchors, v10Registration } from "./registration";
import { frameBores } from "../catalog-v11/bores";
import { openBore } from "../catalog-v13/trim";
import { lettering } from "../catalog-v9/decals";
type Outline = { outer: number[][]; holes: number[][][] };
const vec = (p: number[]) => new T.Vector3(p[0], p[1], p[2] ?? 0);
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

function solid(
  row: Row,
  outline: Outline,
  halfWidth: number,
  side = 0,
  role = "fixed",
  bores: { pixel: number[]; radius: number }[] = [],
) {
  const xy = v10Registration(row);
  const round = (points: number[][]) => {
    const path = new T.Shape();
    for (let i = 0; i < points.length; i++) {
      const prev = new T.Vector2(
          ...(points[(i + points.length - 1) % points.length] as [
            number,
            number,
          ]),
        ),
        cur = new T.Vector2(...(points[i] as [number, number])),
        next = new T.Vector2(
          ...(points[(i + 1) % points.length] as [number, number]),
        );
      const d = Math.min(
          9,
          cur.distanceTo(prev) * 0.28,
          cur.distanceTo(next) * 0.28,
        ),
        a = cur.clone().addScaledVector(prev.clone().sub(cur).normalize(), d),
        b = cur.clone().addScaledVector(next.clone().sub(cur).normalize(), d);
      if (i === 0) path.moveTo(a.x, a.y);
      else path.lineTo(a.x, a.y);
      path.quadraticCurveTo(cur.x, cur.y, b.x, b.y);
    }
    path.closePath();
    return path;
  };
  const shape = round(outline.outer);
  for (const hole of outline.holes) shape.holes.push(round(hole));
  const scale = xy([646, 754]).distanceTo(xy([645, 754]));
  for (const b of bores) {
    const h = new T.Path();
    h.absarc(b.pixel[0], b.pixel[1], b.radius / scale, 0, Math.PI * 2, true);
    shape.holes.push(h);
  }
  const bevel =
    halfWidth < 0.004 ? 1.2 : role === "lug" ? 3 : role === "fixed" ? 4 : 6;
  const g = new T.ExtrudeGeometry(shape, {
    depth: 2,
    bevelEnabled: true,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelThickness: 0.4,
    bevelSegments: 4,
    curveSegments: 6,
  });
  const p = g.getAttribute("position"),
    originalNormals = g.getAttribute("normal"),
    capMask = Array.from(
      { length: p.count },
      (_, i) => Math.abs(originalNormals.getZ(i)) > 0.9999,
    );
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i),
      q = xy([x, y]);
    const paired = role === "rear",
      t = (676 - x) / (676 - 303),
      center =
        side *
        (paired
          ? T.MathUtils.lerp(0.038, 0.088, t)
          : role === "guard"
            ? 0.026
            : role === "recess"
              ? 0.044
              : role === "rocker"
                ? 0.048
                : role === "port"
                  ? 0.0225
                  : 0.034);
    let width = halfWidth;
    // Constant broad side faces; diameter and hidden depth remain exterior estimates.
    const depth = ((z - 1) / 1.4) * width;
    p.setXYZ(i, q.x, q.y, center + depth);
  }
  // Image Y points down: registration reflects the XY plane. Reverse triangle winding,
  // without moving any vertex, so the transformed extrusion has outward-facing walls.
  const faces: number[] = [];
  for (let i = 0; i < p.count; i += 3) faces.push(i, i + 2, i + 1);
  g.setIndex(faces);
  g.deleteAttribute("uv");
  g.computeVertexNormals();
  const faceNormals = g.getAttribute("normal").array.slice();
  // Three's helper hashes units at 0.01: evaluate in millimetres, not metres.
  g.scale(1000, 1000, 1000);
  const smooth = toCreasedNormals(g, Math.PI / 2.6);
  smooth.scale(0.001, 0.001, 0.001);
  // Broad carbon caps retain their planar normals; only perimeter bevels interpolate.
  const normals = smooth.getAttribute("normal");
  for (let i = 0; i < normals.count; i++)
    if (capMask[i])
      normals.setXYZ(
        i,
        faceNormals[i * 3],
        faceNormals[i * 3 + 1],
        faceNormals[i * 3 + 2],
      );
  const indexed = mergeVertices(smooth, 1e-7);
  if (smooth !== g) smooth.dispose();
  g.dispose();
  return indexed;
}
function combine(parts: T.BufferGeometry[]) {
  const flat = parts.map((g) => (g.index ? g.toNonIndexed() : g.clone())),
    merged = mergeGeometries(flat, false)!;
  flat.forEach((g) => g.dispose());
  parts.forEach((g) => g.dispose());
  const result = mergeVertices(merged, 1e-7);
  merged.dispose();
  return result;
}

export function buildV10Links(row: Row) {
  const parts: T.BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    parts.push(
      solid(row, contours.upper_link, 0.009, side, "link", [
        { pixel: [660, 512], radius: 0.006 },
        { pixel: [676, 600], radius: 0.006 },
      ]),
    );
    parts.push(
      solid(row, contours.lower_link, 0.009, side, "link", [
        { pixel: [654, 724], radius: 0.006 },
        { pixel: [594, 760], radius: 0.006 },
      ]),
    );
  }
  let g = combine(parts);
  g = openBore(g, {
    name: "bb_link_clearance",
    start: new T.Vector3(0, 0, -0.16),
    end: new T.Vector3(0, 0, 0.16),
    radius: 0.0195,
  });
  return g;
}
export function buildV10(row: Row) {
  const a = v10Anchors(row),
    xy = v10Registration(row),
    head = vec(a.head_tube.position),
    lower = vec(a.head_tube_lower.position),
    seat = vec(a.seat_tube.position),
    parts: T.BufferGeometry[] = [];
  parts.push(solid(row, contours.front, 0.027));
  for (const side of [-1, 1])
    parts.push(
      solid(row, contours.rear, 0.011, side, "rear", [
        { pixel: [303, 755], radius: 0.0065 },
        { pixel: [676, 600], radius: 0.0065 },
        { pixel: [594, 760], radius: 0.0065 },
      ]),
    );
  parts.push(taperedHead(lower, head));
  const up = vec(a.saddle.position).sub(seat).normalize();
  parts.push(
    sleeve(seat.clone().addScaledVector(up, -0.039), seat, 0.0182, 0.0148),
  );
  parts.push(
    sleeve(
      new T.Vector3(0, 0, -0.0415),
      new T.Vector3(0, 0, 0.0415),
      0.028,
      0.0195,
    ),
  );
  // Molded transverse supports are confined to the front of the rear tyre envelope.
  for (const [pixel, size] of [
    [
      [638, 621],
      [0.022, 0.018, 0.086],
    ],
    [
      [563, 765],
      [0.022, 0.017, 0.092],
    ],
  ] as [number[], number[]][]) {
    const p = xy(pixel),
      g = new T.BoxGeometry(...(size as [number, number, number]));
    g.deleteAttribute("uv");
    g.translate(p.x, p.y, 0);
    parts.push(g);
  }
  // Side-local brake mount support on the non-drive stay only.
  parts.push(
    solid(
      row,
      {
        outer: [
          [310, 711],
          [331, 695],
          [369, 684],
          [380, 690],
          [375, 704],
          [337, 718],
          [317, 725],
        ],
        holes: [],
      },
      0.008,
      -1,
      "rear",
    ),
  );
  let geometry = combine(parts);
  const bores = frameBores({
      ...row,
      asset: { ...row.asset, manifest: { ...row.asset.manifest, anchors: a } },
    }),
    axis = head.clone().sub(lower).normalize();
  bores[0].start = lower.clone().addScaledVector(axis, -0.07);
  bores[0].end = head.clone().addScaledVector(axis, 0.07);
  const bb = bores.find((b) => b.name === "bottom_bracket")!;
  bb.start.z = -0.16;
  bb.end.z = 0.16;
  // The upper shock eye sits between two cheeks, not through a solid central slab.
  bores.push({
    name: "upper_eye_gap",
    start: vec(a.shock_upper.position).setZ(-0.018),
    end: vec(a.shock_upper.position).setZ(0.018),
    radius: 0.02,
  });
  for (const bore of bores) {
    const next = openBore(geometry, bore);
    geometry.dispose();
    geometry = next;
  }
  return { geometry };
}
export async function frameV30(row: Row) {
  v10Registration(row);
  const group = (await new GLTFLoader().loadAsync("/" + row.predecessor_file))
    .scene;
  group.updateMatrixWorld(true);
  const paint = group.getObjectByName(
    row.asset.manifest.paintable_nodes[0],
  ) as T.Mesh;
  if (!paint?.isMesh) throw Error("Expected V10 paint mesh");
  const removed: T.Mesh[] = [];
  group.traverse((n) => {
    if (n instanceof T.Mesh && n !== paint) removed.push(n);
  });
  for (const n of removed) {
    n.removeFromParent();
    n.geometry.dispose();
  }
  paint.geometry.dispose();
  paint.geometry = buildV10(row).geometry;
  const black = new T.MeshStandardMaterial({
      color: "#171c1d",
      roughness: 0.68,
      metalness: 0.12,
    }),
    metal = new T.MeshStandardMaterial({
      color: "#7f898b",
      roughness: 0.31,
      metalness: 0.75,
    });
  const add = (name: string, g: T.BufferGeometry, mat: T.Material) => {
    const n = new T.Mesh(g, mat);
    n.name = row.slug + "__" + name;
    group.add(n);
  };
  add("vpp_links", buildV10Links(row), metal);
  const a = v10Anchors(row),
    xy = v10Registration(row);
  for (const [pixel, z, r] of [
    [[660, 512], 0.046, 0.012],
    [[676, 600], 0.048, 0.012],
    [[654, 724], 0.047, 0.012],
    [[594, 760], 0.055, 0.012],
    [[303, 755], 0.101, 0.011],
  ] as [number[], number, number][]) {
    const p = xy(pixel);
    for (const side of [-1, 1])
      add(
        "cap_" + pixel.join("_") + "_" + side,
        sleeve(
          p.clone().setZ(side * z - 0.003),
          p.clone().setZ(side * z + 0.003),
          r,
          0.0045,
        ),
        black,
      );
  }
  for (const key of ["shock_upper", "shock_lower"])
    for (const side of [-1, 1]) {
      const p = vec(a[key].position);
      add(
        key + "_" + side,
        sleeve(
          p.clone().setZ(side * 0.035 - 0.003),
          p.clone().setZ(side * 0.035 + 0.003),
          0.009,
          0.004,
        ),
        metal,
      );
    }
  // Shallow upper-link recesses retain the continuous metal plate behind their dark faces.
  for (const side of [-1, 1])
    add(
      "upper_recess_" + side,
      solid(
        row,
        {
          outer: [
            [669, 535],
            [679, 538],
            [680, 579],
            [671, 584],
          ],
          holes: [],
        },
        0.0015,
        side,
        "recess",
      ),
      black,
    );
  // The chain protector follows the lower broad carbon stay, with molded ribs.
  add(
    "chain_guard",
    solid(
      row,
      {
        outer: [
          [363, 750],
          [469, 750],
          [549, 748],
          [566, 738],
          [574, 740],
          [568, 764],
          [541, 774],
          [364, 766],
        ],
        holes: [],
      },
      0.002,
      1,
      "rear",
    ),
    black,
  );
  for (let i = 0; i < 11; i++) {
    const px = 370 + i * 16,
      p = xy([px, 749], 0.082 - i * 0.0017),
      g = new T.BoxGeometry(0.005, 0.006, 0.023);
    g.translate(p.x, p.y, p.z);
    g.deleteAttribute("uv");
    add("chain_rib_" + i, g, black);
  }
  for (const side of [-1, 1])
    add(
      "lower_guard_" + side,
      solid(
        row,
        {
          outer: [
            [682, 741],
            [721, 710],
            [758, 677],
            [778, 649],
            [784, 653],
            [771, 681],
            [732, 720],
            [692, 753],
          ],
          holes: [],
        },
        0.0015,
        side,
        "guard",
      ),
      black,
    );
  // Rear-facing fender rests on the molded bridge instead of floating between the stays.
  add(
    "fender",
    solid(
      row,
      {
        outer: [
          [612, 597],
          [641, 592],
          [651, 603],
          [645, 627],
          [631, 652],
          [621, 659],
          [616, 649],
          [623, 626],
        ],
        holes: [],
      },
      0.003,
      0,
      "fixed",
    ),
    black,
  );
  add(
    "hanger",
    solid(
      row,
      {
        outer: [
          [295, 753],
          [308, 751],
          [318, 762],
          [308, 775],
          [296, 782],
          [289, 774],
        ],
        holes: [],
      },
      0.004,
      1,
      "rear",
    ),
    black,
  );
  for (const side of [-1, 1])
    add(
      "bumper_" + side,
      solid(
        row,
        {
          outer: [
            [970, 338],
            [985, 316],
            [998, 311],
            [1004, 318],
            [985, 347],
            [976, 352],
          ],
          holes: [],
        },
        0.002,
        side,
        "port",
      ),
      black,
    );
  // ISCG mounting tabs around the outside of the BB shell, never across its opening.
  for (const angle of [-1.0, 1.0, 2.7]) {
    const p = new T.Vector3(
      Math.cos(angle) * 0.035,
      Math.sin(angle) * 0.035,
      0.046,
    );
    add(
      "iscg_" + angle,
      sleeve(p.clone().setZ(0.042), p.clone().setZ(0.049), 0.007, 0.003),
      metal,
    );
  }
  for (const side of [-1, 1]) {
    const mark = lettering("SANTA CRUZ", "#edece6", 0.28, 0.04);
    mark.position.copy(xy([889, 479], side * 0.0275));
    mark.rotation.z = Math.atan2(
      xy([963, 385]).y - xy([822, 573]).y,
      xy([963, 385]).x - xy([822, 573]).x,
    );
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
  for (const [key, anchor] of Object.entries(a)) {
    const n = group.getObjectByName("mount_" + key);
    if (n) n.position.fromArray(anchor.position);
  }
  return {
    group,
    anchors: a,
    paintable_nodes: row.asset.manifest.paintable_nodes,
  };
}
