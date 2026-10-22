/** Offline TUES MK4 reconstruction from independent photographed contours. */
import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  mergeGeometries,
  mergeVertices,
  toCreasedNormals,
} from "three/addons/utils/BufferGeometryUtils.js";
import contours from "./contours.json";
import { tuesAnchors, tuesRegistration } from "./registration";
export { tuesAnchors, tuesRegistration } from "./registration";
import { frameBores } from "../catalog-v11/bores";
import { openBore } from "../catalog-v13/trim";
import { lettering } from "../catalog-v9/decals";
type Row = {
  slug: string;
  variant: any;
  asset: any;
  predecessor_file?: string;
};
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
  const xy = tuesRegistration(row);
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
  const scale = xy([851, 817]).distanceTo(xy([850, 817]));
  for (const b of bores) {
    const h = new T.Path();
    h.absarc(b.pixel[0], b.pixel[1], b.radius / scale, 0, Math.PI * 2, true);
    shape.holes.push(h);
  }
  const bevel = halfWidth < 0.004 ? 1.2 : role === "lug" ? 3 : role === "fixed" ? 4 : 6;
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
      t = (899 - x) / (899 - 443),
      center =
        side *
        (paired
          ? T.MathUtils.lerp(0.035, 0.082, t)
          : role === "guard"
            ? 0.026
            : role === "rocker"
              ? 0.048
              : role === "port"
                ? 0.0225
                : 0.034);
    let width = halfWidth;
    if (role === "fixed" && halfWidth > 0.02)
      width = -0.07375 + 0.00006063 * x + 0.00007362 * y;
    const depth = ((z - 1) / 1.4) * width;
    p.setXYZ(i, q.x, q.y, center + depth);
  }
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
export function buildTuesLinks(row: Row) {
  return combine(
    [-1, 1].map((side) =>
      solid(row, contours.flip_link, 0.009, side, "rocker", [
        { pixel: [899, 675], radius: 0.0065 },
        { pixel: [997, 687], radius: 0.0065 },
      ]),
    ),
  );
}
export function buildTues(row: Row) {
  const a = tuesAnchors(row),
    xy = tuesRegistration(row),
    head = vec(a.head_tube.position),
    lower = vec(a.head_tube_lower.position),
    seat = vec(a.seat_tube.position),
    parts: T.BufferGeometry[] = [];
  parts.push(solid(row, contours.front, 0.028));
  for (const side of [-1, 1]) {
    parts.push(
      solid(row, contours.upper_rear, 0.011, side, "rear", [
        { pixel: [443, 824], radius: 0.0065 },
        { pixel: [534, 824], radius: 0.0055 },
        { pixel: [899, 675], radius: 0.0065 },
      ]),
    );
    parts.push(
      solid(row, contours.lower_rear, 0.012, side, "rear", [
        { pixel: [534, 824], radius: 0.0055 },
        { pixel: [854, 744], radius: 0.0065 },
      ]),
    );
    parts.push(solid(row, contours.lower_support, 0.008, side, "link"));
  }
  parts.push(taperedHead(lower, head));
  const seatAxis = vec(a.saddle.position).sub(seat).normalize();
  parts.push(
    sleeve(seat.clone().addScaledVector(seatAxis, -0.035), seat, 0.019, 0.0148),
  );
  parts.push(
    sleeve(
      new T.Vector3(0, 0, -0.0415),
      new T.Vector3(0, 0, 0.0415),
      0.028,
      0.0195,
    ),
  );
  // Molded broad bridges, not generic hollow tubes. Their hidden depth remains estimated.
  for (const [pixel, size] of [
    [
      [818, 678],
      [0.018, 0.017, 0.08],
    ],
    [
      [792, 820],
      [0.018, 0.015, 0.087],
    ],
  ] as [number[], number[]][]) {
    const p = xy(pixel),
      g = new T.BoxGeometry(...(size as [number, number, number]));
    g.deleteAttribute("uv");
    g.translate(p.x, p.y, 0);
    parts.push(g);
  }
  // Non-drive brake adapter base integrates both posts.
  const brake = solid(
    row,
    {
      outer: [
        [487, 775],
        [508, 759],
        [559, 738],
        [574, 745],
        [567, 762],
        [517, 783],
        [495, 793],
      ],
      holes: [],
    },
    0.008,
    -1,
    "rear",
  );
  parts.push(brake);
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
  for (const bore of bores) {
    const next = openBore(geometry, bore);
    geometry.dispose();
    geometry = next;
  }
  return { geometry };
}
export async function frameV28(row: Row) {
  tuesRegistration(row);
  const group = (await new GLTFLoader().loadAsync("/" + row.predecessor_file))
    .scene;
  group.updateMatrixWorld(true);
  const paint = group.getObjectByName(
    row.asset.manifest.paintable_nodes[0],
  ) as T.Mesh;
  if (!paint?.isMesh) throw Error("Expected TUES painted mesh");
  const removed: T.Mesh[] = [];
  group.traverse((n) => {
    if (n instanceof T.Mesh && n !== paint) removed.push(n);
  });
  for (const n of removed) {
    n.removeFromParent();
    n.geometry.dispose();
  }
  paint.geometry.dispose();
  paint.geometry = buildTues(row).geometry;
  const black = new T.MeshStandardMaterial({
      color: "#161b1c",
      roughness: 0.7,
      metalness: 0.1,
    }),
    metal = new T.MeshStandardMaterial({
      color: "#737a7a",
      roughness: 0.34,
      metalness: 0.7,
    });
  const add = (name: string, g: T.BufferGeometry, mat: T.Material) => {
    const mesh = new T.Mesh(g, mat);
    mesh.name = row.slug + "__" + name;
    group.add(mesh);
  };
  add("flip_link", buildTuesLinks(row), paint.material as T.Material);
  const a = tuesAnchors(row),
    xy = tuesRegistration(row);
  for (const [pixel, z, r] of [
    [[443, 824], 0.095, 0.01],
    [[534, 824], 0.094, 0.011],
    [[854, 744], 0.052, 0.012],
    [[899, 675], 0.06, 0.012],
    [[997, 687], 0.06, 0.012],
  ] as [number[], number, number][]) {
    const p = xy(pixel);
    for (const side of [-1, 1])
      add(
        "cap_" + pixel.join("_") + "_" + side,
        sleeve(
          p.clone().setZ(side * z - 0.003),
          p.clone().setZ(side * z + 0.003),
          r,
          0.004,
        ),
        metal,
      );
  }
  for (const pixel of [
    [899, 675],
    [997, 687],
  ])
    for (const side of [-1, 1]) {
      const p = xy(pixel);
      add(
        "link_spacer_" + pixel.join("_") + "_" + side,
        sleeve(
          p.clone().setZ(side * 0.037),
          p.clone().setZ(side * 0.059),
          0.01,
          0.005,
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
          p.clone().setZ(side * 0.038 - 0.002),
          p.clone().setZ(side * 0.038 + 0.002),
          0.009,
          0.004,
        ),
        metal,
      );
    }
  // Paired molded upper-eye wings overlap the broad diagonal and terminate around its actual eye.
  for (const side of [-1, 1])
    add(
      "upper_eye_support_" + side,
      solid(
        row,
        {
          outer: [
            [1010, 558],
            [1023, 545],
            [1048, 536],
            [1065, 534],
            [1052, 564],
            [1031, 581],
            [1018, 580],
          ],
          holes: [],
        },
        0.006,
        side,
        "lug",
      ),
      paint.material as T.Material,
    );
  // Guard geometry follows the traced broad surfaces instead of an old centreline.
  add(
    "chain_guard",
    solid(
      row,
      {
        outer: [
          [554, 809],
          [631, 809],
          [739, 806],
          [784, 802],
          [795, 805],
          [785, 811],
          [740, 815],
          [631, 818],
          [554, 817],
        ],
        holes: [],
      },
      0.002,
      1,
      "rear",
    ),
    black,
  );
  for (let i = 0; i < 15; i++) {
    const p = xy([563 + i * 14, 810], 0.079 - i * 0.0017),
      g = new T.BoxGeometry(0.005, 0.004, 0.02);
    g.translate(p.x, p.y, p.z);
    g.deleteAttribute("uv");
    add("chain_rib_" + i, g, black);
  }
  for (const side of [-1, 1])
    add(
      "down_guard_" + side,
      solid(
        row,
        {
          outer: [
            [887, 781],
            [917, 776],
            [941, 762],
            [964, 738],
            [985, 708],
            [992, 713],
            [971, 747],
            [947, 772],
            [919, 786],
            [889, 792],
          ],
          holes: [],
        },
        0.0015,
        side,
        "guard",
      ),
      black,
    );
  // Drive-side hanger and removable ILA inserts remain asymmetrical where appropriate.
  add(
    "hanger",
    solid(
      row,
      {
        outer: [
          [435, 826],
          [451, 819],
          [464, 832],
          [456, 851],
          [442, 860],
          [432, 847],
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
      "ila_" + side,
      solid(
        row,
        {
          outer: [
            [432, 813],
            [445, 807],
            [458, 815],
            [462, 827],
            [450, 835],
            [434, 834],
          ],
          holes: [],
        },
        0.002,
        side,
        "rear",
        [{ pixel: [443, 824], radius: 0.0065 }],
      ),
      black,
    );
  // Frame ports on their actual broad faces, not suspended around the head.
  for (const side of [-1, 1])
    add(
      "port_" + side,
      solid(
        row,
        {
          outer: [
            [1218, 319],
            [1236, 303],
            [1241, 309],
            [1224, 328],
          ],
          holes: [],
        },
        0.0015,
        side,
        "port",
      ),
      black,
    );
  for (const side of [-1, 1]) {
    const mark = lettering("YT", "#181c1c", 0.047, 0.035);
    mark.position.copy(xy([1211, 297], side * 0.0225));
    mark.rotation.z = 0.67;
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
