import * as T from "three";
import type { SelectedVariant } from "../../../../catalog/model";
import type { AssemblyV2 } from "../../../model/assemblyV2";
import type { Point } from "../../../model/assembly";
import type { ModelProfile } from "../../../../catalog/model/visual-profiles";
import { MeshBuilder, dark, metal, gold, point, mix } from "./mesh";
const forks = {
  "ohlins-rxf38-m3": {
    diameter: 38,
    stanchion: metal,
    arch: 0.048,
    crown: gold,
    accent: "#e8cf39",
  },
  "fox-38-factory-my27": {
    diameter: 38,
    stanchion: gold,
    arch: 0.05,
    crown: dark,
    accent: "#ddd9cf",
  },
  "fox-40-factory-my27": {
    diameter: 40,
    stanchion: gold,
    arch: 0.058,
    crown: dark,
    accent: "#ddd9cf",
  },
  "rockshox-zeb-ultimate-b1": {
    diameter: 38,
    stanchion: dark,
    arch: 0.048,
    crown: dark,
    accent: "#e9e6df",
  },
  "marzocchi-bomber-z1-rail": {
    diameter: 36,
    stanchion: dark,
    arch: 0.045,
    crown: dark,
    accent: "#f4f2e9",
  },
} as const;
export function buildFork(
  b: MeshBuilder,
  key: ModelProfile,
  v: SelectedVariant,
  a: AssemblyV2,
  color: string,
) {
  if (!(key in forks)) throw Error("invalid_fork_profile");
  const p = forks[key as keyof typeof forks],
    { front, lower, upperCrown } = a,
    dual = v.specs.crown_type === "dual";
  const seal = mix(front, lower, 0.65),
    spacing = 0.065;
  for (const z of [-spacing, spacing]) {
    const foot = point(front, z),
      se = point(seal, z),
      cr = point(dual ? upperCrown : lower, z);
    const r =
      (typeof v.specs.stanchion_diameter_mm === "number"
        ? v.specs.stanchion_diameter_mm
        : p.diameter) / 2000;
    b.tube(se, cr, r, p.stanchion);
    b.loft(
      [foot, mix(foot, se, 0.12), mix(foot, se, 0.6), se],
      [
        [0.017, 0.02],
        [0.022, 0.023],
        [r + 0.006, r + 0.007],
        [r + 0.004, r + 0.005],
      ],
      color,
    );
    b.tube(mix(foot, se, 0.96), mix(foot, se, 1.015), r + 0.007, dark);
    b.tube(point(front, z - 0.025), point(front, z + 0.025), 0.014, color);
    b.disc(
      point(front, z > 0 ? z + 0.026 : z - 0.026),
      0.009,
      0.003,
      0.004,
      metal,
    );
    const top = mix(se, cr, 1.025);
    b.tube(cr, top, r * 0.8, dark);
    b.tube(top, mix(se, cr, 1.04), 0.009, z > 0 ? "#2974c0" : dark);
    // A broad graphic panel on each lower, not a change in physical leg diameter.
    const sticker = mix(foot, se, 0.65);
    b.loft(
      [
        [sticker[0] + 0.02, sticker[1] - 0.07, z],
        [sticker[0] + 0.02, sticker[1] + 0.065, z],
      ],
      [
        [0.003, 0.012],
        [0.003, 0.012],
      ],
      p.accent,
    );
    b.box(
      [sticker[0] + 0.024, sticker[1], z],
      [0.004, 0.055, 0.016],
      color,
      -0.15,
    );
  }
  const archY = front[1] + a.radius("front") + 0.022;
  b.loft(
    [
      [seal[0] - 0.016, seal[1] - 0.03, -spacing],
      [seal[0] + 0.045, archY, -0.045],
      [seal[0] + 0.045, archY + 0.012, 0],
      [seal[0] + 0.045, archY, 0.045],
      [seal[0] - 0.016, seal[1] - 0.03, spacing],
    ],
    [
      [0.012, 0.014],
      [0.012, 0.015],
      [0.014, 0.015],
      [0.012, 0.015],
      [0.012, 0.014],
    ],
    color,
  );
  for (const crown of dual ? [lower, upperCrown] : [lower]) {
    b.loft(
      [
        point(crown, -spacing - 0.014),
        point(crown, -spacing),
        crown,
        point(crown, spacing),
        point(crown, spacing + 0.014),
      ],
      [
        [0.012, 0.015],
        [0.019, 0.022],
        [0.022, 0.026],
        [0.019, 0.022],
        [0.012, 0.015],
      ],
      p.crown,
    );
    for (const z of [-spacing, spacing])
      b.disc(point(crown, z), 0.009, 0.003, 0.004, metal);
  }
  b.tube(front, point(front, 0.085), 0.008, metal);
  b.path(
    [
      [a.bar[0], a.bar[1], -0.26],
      [lower[0] - 0.1, lower[1] + 0.04, -0.09],
      [seal[0] - 0.032, seal[1], -0.09],
      [front[0] - 0.02, front[1] + 0.035, -0.085],
    ],
    0.0024,
    dark,
    28,
  );
}
export function buildShock(
  b: MeshBuilder,
  key: ModelProfile,
  v: SelectedVariant,
  a: AssemblyV2,
  color: string,
) {
  const upper = a.shockUpper,
    lower = a.shockLower,
    body = mix(upper, lower, 0.6),
    coil = v.specs.spring_type === "coil";
  const ohlins = key === "ohlins-ttx22m2-coil",
    fox = key === "fox-float-x2-factory-my26",
    vivid = key === "rockshox-vivid-coil-ultimate-d1";
  b.tube(upper, lower, 0.0065, fox ? gold : metal);
  b.tube(upper, body, coil ? 0.016 : 0.025, fox ? gold : dark);
  if (coil) {
    const d = new T.Vector3(...lower).sub(new T.Vector3(...upper)),
      length = d.length(),
      q = new T.Quaternion().setFromUnitVectors(
        new T.Vector3(0, 1, 0),
        d.clone().normalize(),
      );
    const points: Point[] = [];
    for (let i = 0; i <= 140; i++) {
      const t = i / 140,
        angle = t * Math.PI * 2 * 8;
      const p = new T.Vector3(
        Math.cos(angle) * 0.026,
        length * (0.13 + t * 0.73),
        Math.sin(angle) * 0.026,
      )
        .applyQuaternion(q)
        .add(new T.Vector3(...upper));
      points.push(p.toArray() as Point);
    }
    b.path(points, 0.004, ohlins ? "#eec531" : vivid ? "#df4a47" : color, 180);
    for (const t of [0.1, 0.88])
      b.tube(mix(upper, lower, t), mix(upper, lower, t + 0.035), 0.029, dark);
  } else {
    b.tube(body, mix(upper, lower, 0.82), 0.028, color);
    b.tube(mix(upper, lower, 0.8), mix(upper, lower, 0.85), 0.03, dark);
  }
  const off: Point = [upper[0] + 0.045, upper[1] - 0.008, 0],
    end: Point = [off[0], off[1] - 0.085, 0];
  b.tube(upper, off, 0.014, ohlins ? gold : dark);
  b.tube(off, end, fox ? 0.019 : 0.015, ohlins ? gold : dark);
  b.tube(off, [off[0], off[1], 0.022], 0.011, ohlins ? "#2573ac" : "#3287ca");
  for (const at of [upper, lower]) b.disc(at, 0.013, 0.006, 0.025, dark);
}
