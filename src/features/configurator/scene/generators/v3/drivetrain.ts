import type { SelectedVariant } from "../../../../catalog/model";
import type { AssemblyV2 } from "../../../model/assemblyV2";
import type { Point } from "../../../model/assembly";
import type { ModelProfile } from "../../../../catalog/model/visual-profiles";
import { MeshBuilder, dark, metal, point, mix } from "./mesh";
import { mm } from "./wheels";
export const pitchRadius = (teeth: number) => (teeth * 0.0127) / (2 * Math.PI);
export function crankLength(v?: SelectedVariant) {
  return mm(v?.specs.crank_length_mm, 0.165);
}
export function crankEnd(length: number, sign = 1): Point {
  return [
    sign * Math.sin(Math.PI / 9) * length,
    -sign * Math.cos(Math.PI / 9) * length,
    sign * 0.085,
  ];
}
export function buildCassette(
  b: MeshBuilder,
  key: ModelProfile,
  v: SelectedVariant,
  a: AssemblyV2,
) {
  const teeth = v.specs.sprocket_teeth as number[],
    largest = teeth.length - 1;
  teeth.forEach((n, i) => {
    const r = pitchRadius(n),
      z = 0.055 + (largest - i) * 0.0034,
      c = key === "sram-xg-795" ? dark : i === largest ? dark : metal,
      at = point(a.rear, z);
    b.disc(
      at,
      r,
      Math.max(0.012, r * 0.7),
      0.0018,
      c,
      n,
      Math.max(0, Math.floor(n / 3)),
    );
    b.disc(at, 0.018, 0.01, 0.002, c);
    for (let j = 0; j < 5; j++) {
      const angle = (j / 5 + i * 0.017) * Math.PI * 2;
      b.loft(
        [
          [
            a.rear[0] + Math.cos(angle) * 0.016,
            a.rear[1] + Math.sin(angle) * 0.016,
            z,
          ],
          [
            a.rear[0] + Math.cos(angle + 0.12) * r * 0.8,
            a.rear[1] + Math.sin(angle + 0.12) * r * 0.8,
            z,
          ],
        ],
        [
          [0.003, 0.001],
          [0.004, 0.001],
        ],
        c,
      );
    }
  });
}
export function buildCranks(
  b: MeshBuilder,
  key: ModelProfile,
  v: SelectedVariant,
  color: string,
) {
  const ring = v.specs.chainring as { teeth?: number } | undefined,
    teeth = ring?.teeth ?? 32,
    r = pitchRadius(teeth);
  b.disc([0, 0, 0.077], r, r * 0.73, 0.003, dark, teeth);
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4 + 0.125) * Math.PI * 2;
    b.loft(
      [
        [Math.cos(angle) * 0.012, Math.sin(angle) * 0.012, 0.077],
        [Math.cos(angle) * r * 0.84, Math.sin(angle) * r * 0.84, 0.077],
      ],
      [
        [0.008, 0.003],
        [0.006, 0.003],
      ],
      dark,
    );
  }
  for (const sign of [-1, 1]) {
    const end = crankEnd(crankLength(v), sign),
      start: Point = [0, 0, sign * 0.085];
    b.loft(
      [start, mix(start, end, 0.25), mix(start, end, 0.8), end],
      [
        [0.02, 0.01],
        [key === "truvativ-descendant-dh" ? 0.014 : 0.017, 0.009],
        [0.012, 0.008],
        [0.014, 0.008],
      ],
      color,
    );
    b.disc(end, 0.009, 0.004, 0.017, metal);
    b.disc(start, 0.013, 0.005, 0.022, dark);
  }
}
export function buildPedals(
  b: MeshBuilder,
  v: SelectedVariant,
  cranks: SelectedVariant | undefined,
  color: string,
) {
  const length = mm(v.specs.platform_length_mm, 0.105),
    width = mm(v.specs.platform_width_mm, 0.12),
    height = mm(v.specs.platform_thickness_mm, 0.02);
  for (const sign of [-1, 1]) {
    const p = crankEnd(crankLength(cranks), sign),
      z = sign * (0.085 + width / 2 + 0.012);
    b.tube(p, [p[0], p[1], z], 0.006, metal);
    // Open platform with concave center, perimeter rails and traction pins.
    for (const x of [-length * 0.42, length * 0.42])
      b.box([p[0] + x, p[1], z], [length * 0.16, height, width], color);
    for (const dz of [-width * 0.43, 0, width * 0.43])
      b.box(
        [p[0], p[1] - 0.002, z + dz],
        [length, height * 0.65, width * 0.14],
        color,
      );
    for (const x of [-length * 0.4, 0, length * 0.4])
      for (const dz of [-width * 0.41, width * 0.41])
        for (const y of [-1, 1])
          b.tube(
            [p[0] + x, p[1] + y * height * 0.45, z + dz],
            [p[0] + x, p[1] + y * (height * 0.5 + 0.004), z + dz],
            0.0017,
            metal,
            0.0017,
            6,
          );
  }
}
export function derailleurPoints(a: AssemblyV2, dh: boolean) {
  return {
    upper: [a.rear[0] + 0.042, a.rear[1] - 0.055, 0.092] as Point,
    lower: [a.rear[0] + 0.08, a.rear[1] - (dh ? 0.12 : 0.17), 0.092] as Point,
  };
}
export function buildDerailleur(
  b: MeshBuilder,
  key: ModelProfile,
  v: SelectedVariant,
  a: AssemblyV2,
  color: string,
) {
  const dh = key === "sram-gx-dh-a3" || v.specs.speed_count === 7,
    { upper, lower } = derailleurPoints(a, dh),
    r = a.rear;
  b.tube(point(r, 0.075), [r[0] + 0.025, r[1] - 0.015, 0.1], 0.013, dark);
  b.loft(
    [
      [r[0] + 0.015, r[1] - 0.015, 0.102],
      [r[0] + 0.085, r[1] - 0.035, 0.102],
      [upper[0], upper[1], 0.102],
    ],
    [
      [0.021, 0.018],
      [0.019, 0.015],
      [0.013, 0.012],
    ],
    color,
  );
  for (const z of [0.078, 0.106])
    b.loft(
      [point(upper, z), point(lower, z)],
      [
        [0.011, 0.003],
        [0.009, 0.003],
      ],
      dark,
    );
  for (const p of [upper, lower]) {
    b.disc(p, dh ? 0.022 : 0.025, 0.009, 0.006, dark, dh ? 12 : 13, 6);
    b.disc(point(p, 0.11), 0.006, 0.002, 0.004, metal);
  }
  const bar = a.bar;
  b.loft(
    [
      [bar[0] + 0.015, bar[1] - 0.018, 0.24],
      [bar[0] - 0.012, bar[1] - 0.045, 0.25],
      [bar[0] - 0.035, bar[1] - 0.04, 0.27],
    ],
    [
      [0.018, 0.018],
      [0.021, 0.019],
      [0.012, 0.014],
    ],
    dark,
  );
  b.loft(
    [
      [bar[0], bar[1] - 0.042, 0.25],
      [bar[0] - 0.045, bar[1] - 0.05, 0.28],
    ],
    [
      [0.008, 0.006],
      [0.014, 0.006],
    ],
    color,
  );
}
export function buildChain(
  b: MeshBuilder,
  a: AssemblyV2,
  crank: SelectedVariant | undefined,
  cassette: SelectedVariant | undefined,
  derailleur: SelectedVariant | undefined,
) {
  const teeth =
      (crank?.specs.chainring as { teeth?: number } | undefined)?.teeth ?? 32,
    r = pitchRadius(teeth),
    cogs = cassette?.specs.sprocket_teeth as number[] | undefined,
    cog = pitchRadius(cogs?.[1] ?? 12),
    z = 0.088;
  const dh = derailleur?.specs.speed_count === 7,
    { upper, lower } = derailleurPoints(a, dh);
  const route: Point[] = [point([a.rear[0], a.rear[1] + cog, 0], z)];
  if (a.idler)
    route.push(
      [a.idler[0] - 0.02, a.idler[1] + 0.03, z],
      [a.idler[0] + 0.03, a.idler[1] + 0.007, z],
    );
  route.push([0, r, z]);
  for (let i = 1; i <= 14; i++) {
    const angle = Math.PI / 2 - (i / 14) * Math.PI;
    route.push([Math.cos(angle) * r, Math.sin(angle) * r, z]);
  }
  route.push(
    [lower[0], lower[1] - 0.021, z],
    [lower[0] - 0.02, lower[1], z],
    [upper[0] - 0.02, upper[1], z],
    [upper[0], upper[1] + 0.02, z],
    [a.rear[0] - 0.02, a.rear[1] - cog, z],
    [a.rear[0] - cog, a.rear[1], z],
    route[0],
  );
  // Individual alternating link plates and rollers along a closed chain path.
  let carry = 0,
    index = 0;
  for (let i = 1; i < route.length; i++) {
    const start = route[i - 1],
      end = route[i],
      distance = Math.hypot(...end.map((n, j) => n - start[j]));
    for (let d = carry; d < distance; d += 0.00635) {
      const p = mix(start, end, d / distance),
        next = mix(start, end, Math.min(1, (d + 0.0058) / distance));
      for (const side of [-0.0023, 0.0023])
        b.tube(
          point(p, z + side),
          point(next, z + side),
          index % 2 ? 0.0019 : 0.0015,
          metal,
          0.0015,
          5,
        );
      b.tube(
        point(p, z - 0.0025),
        point(p, z + 0.0025),
        0.0015,
        dark,
        0.0015,
        5,
      );
      index++;
    }
    carry = (carry - distance) % 0.00635;
    if (carry < 0) carry += 0.00635;
  }
}
