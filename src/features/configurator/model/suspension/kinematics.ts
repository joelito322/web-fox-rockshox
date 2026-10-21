import profiles from "./profiles.json";
import type { Assembly, Point } from "../assembly";
import type { Configuration, VariantMap } from "../index";
export type Body = "fixed" | "input" | "output" | "rear";
export type Transform = { origin: Point; target: Point; angle: number };
export const identity: Transform = {
  origin: [0, 0, 0],
  target: [0, 0, 0],
  angle: 0,
};
export function transform(p: Point, t: Transform): Point {
  if (t.angle === 0 && t.origin.every((n, i) => n === t.target[i]))
    return [...p];
  const x = p[0] - t.origin[0],
    y = p[1] - t.origin[1],
    c = Math.cos(t.angle),
    s = Math.sin(t.angle);
  return [
    t.target[0] + x * c - y * s,
    t.target[1] + x * s + y * c,
    p[2] + t.target[2] - t.origin[2],
  ];
}
const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const angle = (a: Point, b: Point) => Math.atan2(b[1] - a[1], b[0] - a[0]);
export function circleIntersection(
  c: Point,
  r: number,
  b: Point,
  s: number,
  reference: Point,
): Point | null {
  const d = distance(c, b);
  if (d < 1e-8 || d > r + s + 1e-8 || d < Math.abs(r - s) - 1e-8) return null;
  const x = (r * r - s * s + d * d) / (2 * d),
    h = Math.sqrt(Math.max(0, r * r - x * x));
  const ux = (b[0] - c[0]) / d,
    uy = (b[1] - c[1]) / d;
  const one: Point = [c[0] + x * ux - h * uy, c[1] + x * uy + h * ux, 0],
    two: Point = [c[0] + x * ux + h * uy, c[1] + x * uy - h * ux, 0];
  return distance(one, reference) <= distance(two, reference) ? one : two;
}
export type Linkage = { a: Point; b: Point; c: Point; d: Point };
export function linkagePose(
  j: Linkage,
  radians: number,
  previous: Point = j.d,
) {
  if (radians === 0)
    return {
      fixed: identity,
      input: identity,
      output: identity,
      rear: identity,
      c: j.c,
      d: j.d,
    };
  const input: Transform = { origin: j.a, target: j.a, angle: radians };
  const c = transform(j.c, input),
    d = circleIntersection(
      c,
      distance(j.c, j.d),
      j.b,
      distance(j.b, j.d),
      previous,
    );
  if (!d) return null;
  const output: Transform = {
    origin: j.b,
    target: j.b,
    angle: angle(j.b, d) - angle(j.b, j.d),
  };
  const rear: Transform = {
    origin: j.c,
    target: c,
    angle: angle(c, d) - angle(j.c, j.d),
  };
  return { fixed: identity, input, output, rear, c, d };
}
export type MotionPose = {
  bodies: Record<Body, Transform>;
  rear: Point;
  front: Point;
  shockUpper: Point;
  shockLower: Point;
  forkCompression: number;
  rearCompression: number;
};
export type MotionDefinition = ReturnType<typeof createMotionDefinition>;
export function createMotionDefinition(
  configuration: Configuration,
  variants: VariantMap,
  a: Assembly,
) {
  const get = (slot: string) =>
    variants[configuration.items.find((i) => i.slot === slot)?.variantId ?? ""];
  const frame = get("frame"),
    fork = get("fork"),
    shock = get("shock");
  const profile = profiles[frame?.component.slug as keyof typeof profiles];
  const anchors = frame?.visual_assets?.manifest.anchors;
  const supported =
    !!profile &&
    frame?.visual_assets?.kind === "glb" &&
    !!anchors?.head_tube &&
    !!anchors?.rear_axle;
  if (!supported) return null;
  const registration = profile.registration,
    bb = registration.bottom_bracket;
  const u = [
      registration.head_top[0] - bb[0],
      bb[1] - registration.head_top[1],
    ],
    v = [registration.rear_axle[0] - bb[0], bb[1] - registration.rear_axle[1]];
  const det = u[0] * v[1] - v[0] * u[1],
    head = anchors.head_tube.position,
    rear = anchors.rear_axle.position;
  const map = (pixel: number[]): Point => {
    const x = pixel[0] - bb[0],
      y = bb[1] - pixel[1],
      c = (x * v[1] - v[0] * y) / det,
      d = (u[0] * y - x * u[1]) / det;
    return [c * head[0] + d * rear[0], c * head[1] + d * rear[1], 0];
  };
  const j = Object.fromEntries(
    Object.entries(profile.joints).map(([k, v]) => [k, map(v)]),
  ) as Linkage;
  const rearBody = profile.rear_body as Body;
  const regions = profile.regions.map((region) => ({
    role: region.role as Body,
    closed: region.closed,
    points: region.points.map(map),
  }));
  // Fixed/moving eyes differ by architecture; each assignment is explicit and versioned.
  const upperBody = profile.shock_upper_body as Body;
  const lowerBody = profile.shock_lower_body as Body;
  const rearTravel =
    Number(
      frame.specs.rear_travel_mm ??
        frame.specs.travel_mm ??
        (frame.component.disciplines.includes("downhill") ? 200 : 170),
    ) / 1000;
  const forkTravel =
    fork?.visual_assets?.kind === "glb"
      ? Math.max(0, Number(fork?.specs.travel_mm ?? 0)) / 1000
      : 0;
  const stroke =
    typeof shock?.specs.stroke_mm === "number"
      ? shock.specs.stroke_mm / 1000
      : 0.065;
  const restLength = distance(a.shockUpper, a.shockLower);
  const sample = (theta: number, prev: Point = j.d) => {
    const b = linkagePose(j, theta, prev);
    if (!b) return null;
    return {
      b,
      rear: transform(a.rear, b[rearBody]),
      upper: transform(a.shockUpper, b[upperBody]),
      lower: transform(a.shockLower, b[lowerBody]),
    };
  };
  const plus = sample(0.0001),
    minus = sample(-0.0001);
  const direction =
    (plus?.rear[1] ?? -Infinity) > (minus?.rear[1] ?? -Infinity) ? 1 : -1;
  let limit = 0,
    previous = j.d;
  for (let i = 1; i <= 240; i++) {
    const theta = (direction * i * profile.max_input_radians) / 240,
      s = sample(theta, previous);
    if (!s) break;
    const compression = restLength - distance(s.upper, s.lower);
    if (
      s.rear[1] - a.rear[1] > rearTravel ||
      compression > stroke * 0.98 ||
      compression < -0.004
    )
      break;
    limit = theta;
    previous = s.b.d;
  }
  const axisLength = distance(a.head, a.lower),
    forkAxis: Point = axisLength
      ? [
          (a.head[0] - a.lower[0]) / axisLength,
          (a.head[1] - a.lower[1]) / axisLength,
          0,
        ]
      : [0, 1, 0];
  function pose(frontFraction: number, rearFraction: number): MotionPose {
    const clamp = (n: number) =>
      Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
    const s = sample(limit * clamp(rearFraction)) ?? sample(0)!;
    const forkCompression = forkTravel * clamp(frontFraction);
    return {
      bodies: s.b,
      rear: s.rear,
      front: [
        a.front[0] + forkAxis[0] * forkCompression,
        a.front[1] + forkAxis[1] * forkCompression,
        a.front[2],
      ],
      shockUpper: s.upper,
      shockLower: s.lower,
      forkCompression,
      rearCompression: Math.max(0, s.rear[1] - a.rear[1]),
    };
  }
  return {
    shockSpring: shock?.specs.spring_type,
    version: profile.version,
    slug: frame.component.slug,
    architecture: profile.architecture,
    estimated: profile.estimated,
    joints: j,
    regions,
    pose,
    base: a,
    forkAxis,
    forkTravel,
    stroke,
    rearBody,
    upperBody,
    lowerBody,
    rearAvailable: Math.abs(limit) > 0.003,
    maxAngle: limit,
    restLength,
  };
}
