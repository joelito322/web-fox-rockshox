/** Offline v10 exterior reconstruction. Published v1–v9 resources remain unchanged. */
import * as T from "three";
import { lettering } from "../catalog-v9/decals";
import historicProfiles from "../catalog-v10/frame-profiles.json";
import capraProfile from "./profile.json";
import { samplePolyline } from "./path";
const profiles = {
  ...historicProfiles,
  "yt-capra-mk3-carbon-mx": capraProfile,
};
import { RoundedMeshBuilder } from "../catalog-v10/rounded-mesh";

import {
  dark,
  metal,
  mix,
  point,
} from "../../src/features/configurator/scene/generators/v3/mesh";
import type { Point } from "../../src/features/configurator/model/assembly";

type Variant = {
  specs: Record<string, any>;
  allowed_finishes: { options: { material: { color: string } }[] };
};
type Profile = (typeof profiles)[keyof typeof profiles];
const vector = (p: Point) => new T.Vector3(...p);
const mm = (n: number) => n / 1000;
const anchor = (position: Point, estimated = true) => ({
  position,
  rotation: [0, 0, 0] as Point,
  estimated,
});
function sleeve(
  b: RoundedMeshBuilder,
  from: Point,
  to: Point,
  outer: number,
  inner: number,
  color: string,
) {
  const shape = new T.Shape();
  shape.absarc(0, 0, outer, 0, Math.PI * 2, false);
  const hole = new T.Path();
  hole.absarc(0, 0, inner, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const length = vector(to).distanceTo(vector(from));
  const g = new T.ExtrudeGeometry(shape, {
    depth: length,
    bevelEnabled: false,
    curveSegments: 24,
  });
  g.applyQuaternion(
    new T.Quaternion().setFromUnitVectors(
      new T.Vector3(0, 0, 1),
      vector(to).sub(vector(from)).normalize(),
    ),
  );
  g.translate(...from);
  b.add(g, color);
}
function loft(
  b: RoundedMeshBuilder,
  path: Point[],
  heights: number[],
  width: number,
  color: string,
  corners?: number[],
  exponent = 0.8,
) {
  const sampled = samplePolyline(
    path.map(vector),
    heights.map(mm),
    path.map(() => mm(width)),
    (
      corners ?? path.map((_, i) => (i > 0 && i < path.length - 1 ? 12 : 0))
    ).map(mm),
  );
  const positions: number[] = [],
    indices: number[] = [],
    sides = 24;
  sampled.samples.forEach((sample, i) => {
    const tangent = sample.tangent,
      normal = new T.Vector3(0, 0, 1).cross(tangent).normalize(),
      binormal = tangent.clone().cross(normal).normalize();
    for (let j = 0; j < sides; j++) {
      const a = (j / sides) * Math.PI * 2,
        c = Math.cos(a),
        s = Math.sin(a);
      positions.push(
        ...sample.point
          .clone()
          .addScaledVector(
            normal,
            Math.sign(c) * Math.abs(c) ** exponent * sample.height,
          )
          .addScaledVector(
            binormal,
            Math.sign(s) * Math.abs(s) ** exponent * sample.width,
          )
          .toArray(),
      );
      if (i < sampled.samples.length - 1) {
        const k = i * sides + j,
          l = i * sides + ((j + 1) % sides);
        indices.push(k, l, k + sides, l, l + sides, k + sides);
      }
    }
  });
  for (let j = 1; j < sides - 1; j++) {
    indices.push(0, j + 1, j);
    const k = (sampled.samples.length - 1) * sides;
    indices.push(k, k + j, k + j + 1);
  }
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  b.add(g, color);
  return sampled;
}
export function buildNewFrame(slug: keyof typeof profiles, variant: Variant) {
  if (slug !== "yt-capra-mk3-carbon-mx")
    throw Error("CAPRA-only full path reconstruction");
  const profile: Profile = profiles[slug],
    specs = variant.specs;
  const estimated = { ...profile.estimated_geometry };
  if (specs.size_label === "L" && !specs.geometry) {
    estimated.reach_mm += 25;
    estimated.stack_mm += 8;
  }
  const geo = { ...estimated, ...specs.geometry },
    p = profile.image_landmarks;
  const bb = p.bottom_bracket,
    headImage = p.head_top,
    rearImage = p.rear_axle;
  const h: Point = [mm(geo.reach_mm), mm(geo.stack_mm), 0];
  const drop = mm(geo.bb_drop_mm ?? (specs.wheel_rear === "29" ? 25 : 0));
  const rear: Point = [
    -Math.sqrt(mm(geo.chainstay_mm) ** 2 - drop ** 2),
    drop,
    0,
  ];
  const u = [headImage[0] - bb[0], bb[1] - headImage[1]],
    v = [rearImage[0] - bb[0], bb[1] - rearImage[1]];
  const determinant = u[0] * v[1] - v[0] * u[1];
  const xy = (pixel: number[], z = 0): Point => {
    const x = pixel[0] - bb[0],
      y = bb[1] - pixel[1];
    const a = (x * v[1] - v[0] * y) / determinant,
      c = (u[0] * y - x * u[1]) / determinant;
    return [a * h[0] + c * rear[0], a * h[1] + c * rear[1], z];
  };
  const angle = (geo.head_angle_deg * Math.PI) / 180,
    length = mm(geo.head_tube_mm);
  const lower: Point = [
    h[0] + Math.cos(angle) * length,
    h[1] - Math.sin(angle) * length,
    0,
  ];
  const seat = xy(p.seat_top),
    pivot = xy(p.pivot),
    upper = xy(p.shock_upper),
    rawLower = xy(p.shock_lower);
  const direction = vector(rawLower).sub(vector(upper)).normalize();
  const shockLower = vector(upper)
    .addScaledVector(direction, mm(specs.shock_fit?.eye_to_eye_mm ?? 250))
    .toArray() as Point;
  const color = variant.allowed_finishes.options[0].material.color,
    b = new RoundedMeshBuilder();
  const paths: Point[][] = [];
  const pathEvidence: {
    name: string;
    side: number;
    sampled: ReturnType<typeof samplePolyline>;
  }[] = [];
  for (const member of profile.members) {
    const path = member.path.map((pixel) => xy(pixel));
    if (member.name === "downtube") {
      path[0] = [0, 0, 0];
      path[path.length - 1] = vector(lower)
        .lerp(vector(h), 0.43)
        .toArray() as Point;
    }
    if (member.name === "top_tube")
      path[path.length - 1] = vector(lower)
        .lerp(vector(h), 0.85)
        .toArray() as Point;
    if (member.name === "seat_tube") {
      path[path.length - 1] = seat;
    }
    paths.push(path);
    if (
      slug === "yt-capra-mk3-carbon-mx" &&
      member.name === "lower_window_rail"
    ) {
      loft(
        b,
        path.map((p) => point(p, 0.026)),
        member.height_mm,
        12,
        color,
      );
      continue;
    }
    for (const side of member.paired ? [-1, 1] : [0]) {
      const local = path.map((at) => {
        const factor = Math.min(1, Math.max(0, at[0] / rear[0]));
        return point(
          at,
          side *
            (0.044 + (mm(profile.axle_width_mm) / 2 + 0.008 - 0.044) * factor),
        );
      });
      const sampled = loft(
        b,
        local,
        member.height_mm,
        member.width_mm,
        color,
        "corners_mm" in member ? (member.corners_mm as number[]) : undefined,
        ["downtube", "top_tube"].includes(member.name) ? 0.6 : 0.8,
      );
      pathEvidence.push({ name: member.name, side, sampled });
    }
  }
  sleeve(b, lower, h, 0.034, 0.026, color);
  const seatDir = vector(seat)
    .sub(
      vector(
        xy(
          profile.members
            .find((m) => m.name === "seat_tube" || m.name === "seat_bridge")!
            .path.slice(-2)[0],
        ),
      ),
    )
    .normalize();
  sleeve(
    b,
    vector(seat).addScaledVector(seatDir, -0.032).toArray() as Point,
    seat,
    0.019,
    mm((specs.seatpost_diameter_mm ?? 31.6) / 2),
    color,
  );
  const bbWidth = mm(specs.bb_shell?.width_mm ?? 83);
  sleeve(b, [0, 0, -bbWidth / 2], [0, 0, bbWidth / 2], 0.026, 0.0205, color);
  for (const link of profile.links) {
    const path = link.map((pixel) => xy(pixel));
    for (const side of [-1, 1]) {
      b.rockerPlate(path, side * 0.043, 0.01, dark, path.length > 2);
      for (const at of path) {
        b.disc(point(at, side * 0.054), 0.011, 0.004, 0.004, metal);
        b.tube(point(at, -0.052), point(at, 0.052), 0.004, dark);
      }
    }
  }
  // Separate mounting ears, linked to the nearest fixed frame/link location instead of floating.
  const closestOn = (path: Point[], target: Point) => {
    let best = vector(path[0]),
      error = Infinity;
    for (let i = 0; i < path.length - 1; i++) {
      const line = new T.Line3(vector(path[i]), vector(path[i + 1])),
        candidate = line.closestPointToPoint(
          vector(target),
          true,
          new T.Vector3(),
        ),
        distance = candidate.distanceTo(vector(target));
      if (distance < error) {
        best = candidate;
        error = distance;
      }
    }
    return best.toArray() as Point;
  };
  for (const eye of [upper, shockLower]) {
    // Front shock eye is carried by the diagonal; rear eye belongs to its yoke.
    // Project onto actual segments, not sparsely sampled landmark endpoints.
    const parent = closestOn(
      eye === upper ? paths[0] : profile.links.flat().map((pixel) => xy(pixel)),
      eye,
    );
    for (const side of [-1, 1]) {
      loft(
        b,
        [point(parent, side * 0.035), point(eye, side * 0.019)],
        [11, 12],
        7,
        color,
      );
      sleeve(
        b,
        point(eye, side < 0 ? -0.026 : 0.014),
        point(eye, side < 0 ? -0.014 : 0.026),
        0.012,
        0.004,
        color,
      );
    }
    b.tube(point(eye, -0.031), point(eye, 0.031), 0.004, metal);
  }
  for (const side of [-1, 1]) {
    sleeve(
      b,
      point(rear, side * (mm(profile.axle_width_mm) / 2)),
      point(rear, side * (mm(profile.axle_width_mm) / 2 + 0.016)),
      0.016,
      0.006,
      color,
    );
  }
  // Axle bridge, left brake bosses and drive-side hanger are intentionally asymmetric.
  b.tube(point(rear, -0.09), point(rear, 0.09), 0.006, metal);
  for (const delta of [0.055, 0.09])
    b.tube(
      [rear[0] + delta, rear[1] + 0.04, -0.074],
      [rear[0] + delta, rear[1] + 0.06, -0.074],
      0.007,
      dark,
    );
  loft(
    b,
    [
      [rear[0], rear[1], 0.087],
      [rear[0] + 0.012, rear[1] - 0.041, 0.087],
    ],
    [9, 7],
    5,
    dark,
  );
  const idlerPixel = "idler" in profile ? profile.idler : null;
  const idler = idlerPixel ? xy(idlerPixel as number[]) : null;
  if (idler) {
    b.tube(point(idler, 0.026), point(idler, 0.072), 0.006, metal);
    b.disc(point(idler, 0.068), 0.028, 0.004, 0.009, dark, 18);
    b.disc(point(idler, 0.075), 0.01, 0.003, 0.004, metal);
    loft(b, [point(pivot, 0.04), point(idler, 0.04)], [14, 12], 8, dark);
  }
  const down = paths[0];

  const frontRadius = specs.wheel_front === "27.5" ? 0.352 : 0.37,
    rearRadius = specs.wheel_rear === "29" ? 0.37 : 0.352;
  const front: Point = [
    rear[0] + mm(geo.wheelbase_mm ?? geo.reach_mm + 800),
    rear[1] + frontRadius - rearRadius,
    0,
  ];
  const anchors = {
    rear_axle: anchor(rear),
    front_axle: anchor(front),
    head_tube: anchor(h),
    head_tube_lower: anchor(lower),
    seat_tube: anchor(seat),
    saddle: anchor([seat[0] - 0.024, seat[1] + 0.14, 0]),
    shock_upper: anchor(upper),
    shock_lower: anchor(shockLower),
    suspension_pivot: anchor(pivot),
    ...(idler ? { chain_idler: anchor(idler) } : {}),
  };
  const stays = paths.filter((_, i) => profile.members[i].paired);
  for (const path of stays) {
    const root = path[path.length - 1];
    // Rearward-most bridges are deliberately omitted: they would cross the tyre.
    // The clevis closes only at the forward root and follows each side into it.
    b.loft(
      [
        point(root, -0.044),
        point([root[0] + 0.01, root[1], 0], 0),
        point(root, 0.044),
      ],
      [
        [0.014, 0.014],
        [0.012, 0.014],
        [0.014, 0.014],
      ],
      color,
    );
    for (const side of [-1, 1])
      sleeve(
        b,
        point(root, side * 0.043 - 0.008),
        point(root, side * 0.043 + 0.008),
        0.018,
        0.006,
        color,
      );
  }
  // Replace the flat floating guard with a strip on the underside of this tube.
  const brand = slug.startsWith("santa-cruz")
    ? "SANTA CRUZ"
    : slug.startsWith("gt-")
      ? "GT"
      : slug.startsWith("commencal")
        ? "COMMENCAL"
        : "YT";
  const labelStart = mix(down[2], down[3], 0.25),
    labelEnd = mix(down[2], down[3], 0.65);
  return {
    pathEvidence,
    surfaces: b.finish(),
    anchors,
    color,
    label: {
      text: brand,
      start: labelStart,
      end: labelEnd,
      z: mm(profile.members[0].width_mm) + 0.001,
      color: slug.startsWith("commencal") ? "#252929" : "#e8e7de",
    },
  };
}

export function newFrameGroup(slug: keyof typeof profiles, variant: Variant) {
  const resource = buildNewFrame(slug, variant),
    group = new T.Group();
  let i = 0;
  for (const surface of resource.surfaces) {
    const mesh = new T.Mesh(
      surface.geometry,
      new T.MeshStandardMaterial({
        color: surface.color,
        roughness: surface.roughness,
        metalness: surface.metalness,
      }),
    );
    mesh.name =
      slug +
      (surface.color === resource.color ? "__paint_" : "__detail_") +
      i++;
    group.add(mesh);
  }
  const label = resource.label;
  for (const side of [-1, 1]) {
    const center = mix(label.start, label.end, 0.5),
      width = vector(label.start).distanceTo(vector(label.end));
    const decal = lettering(label.text, label.color, width, 0.025);
    decal.position.set(center[0], center[1], side * label.z);
    decal.rotation.z = Math.atan2(
      label.end[1] - label.start[1],
      label.end[0] - label.start[0],
    );
    if (side < 0) decal.rotateY(Math.PI);
    decal.name = slug + "__lettering_" + side;
    group.add(decal);
  }
  return group;
}
