import * as T from "three";
import type { SelectedVariant } from "../../../../catalog/model";
import type { Point } from "../../../model/assembly";
import type { ModelProfile } from "../../../../catalog/model/visual-profiles";
import { MeshBuilder, dark, metal, rubber, point } from "./mesh";
export const mm = (value: unknown, fallback: number) =>
  typeof value === "number" ? value / 1000 : fallback;
const treadProfiles = {
  "maxxis-assegai": {
    rows: 64,
    center: 0.014,
    shoulder: 0.019,
    sweep: 0.16,
    alternate: 3,
  },
  "maxxis-minion-dhr-ii": {
    rows: 56,
    center: 0.021,
    shoulder: 0.018,
    sweep: 0,
    alternate: 2,
  },
  "cst-bft-c1752": {
    rows: 60,
    center: 0.017,
    shoulder: 0.017,
    sweep: 0.22,
    alternate: 2,
  },
  "kenda-pinner-pro-k1241a": {
    rows: 62,
    center: 0.017,
    shoulder: 0.018,
    sweep: 0.26,
    alternate: 2,
  },
  "michelin-wild-enduro-ms-racing-line": {
    rows: 54,
    center: 0.015,
    shoulder: 0.02,
    sweep: 0.3,
    alternate: 3,
  },
  "schwalbe-gravity-magic-mary": {
    rows: 52,
    center: 0.014,
    shoulder: 0.018,
    sweep: 0.2,
    alternate: 2,
  },
} as const;
export function buildTire(
  b: MeshBuilder,
  key: ModelProfile,
  v: SelectedVariant,
  at: Point,
) {
  if (!(key in treadProfiles)) throw Error("invalid_tire_profile");
  const p = treadProfiles[key as keyof typeof treadProfiles],
    width = mm(v.specs.tire_width_mm, 0.061),
    bead = mm(v.specs.wheel_bsd_mm, 0.622) / 2;
  const section = width * 0.46,
    radius = bead + width - section - 0.004;
  const g = new T.TorusGeometry(radius, section, 12, 96);
  g.scale(1, 1, 0.88);
  g.translate(...at);
  b.add(g, rubber, 0.91, 0.02);
  for (let i = 0; i < p.rows; i++)
    for (const row of [-2, -1, 1, 2]) {
      const shoulder = Math.abs(row) === 2,
        angle = ((i + (shoulder ? 0.4 : 0)) / p.rows) * Math.PI * 2;
      const cross = shoulder ? 0.85 : 0.3,
        z = Math.sign(row) * Math.sin(cross) * section * 0.91;
      const r = radius + Math.cos(cross) * section + 0.0025;
      const size: Point = [
        shoulder ? p.shoulder : p.center,
        shoulder ? 0.008 : 0.006,
        shoulder ? 0.012 : i % p.alternate === 0 ? 0.016 : 0.01,
      ];
      const knob = new T.BoxGeometry(...size);
      knob.rotateY(Math.sign(row) * p.sweep);
      knob.rotateX(Math.sign(row) * cross);
      knob.rotateZ(angle - Math.PI / 2);
      knob.translate(
        at[0] + Math.cos(angle) * r,
        at[1] + Math.sin(angle) * r,
        at[2] + z,
      );
      b.add(knob, rubber, 0.91, 0.02);
      // Fine cut in the top of selected blocks, represented by a recessed dark slot.
    }
  for (const z of [-width * 0.38, width * 0.38])
    b.ring(point(at, z), bead + 0.006, 0.0015, "#343636", 96);
}
export function buildRim(b: MeshBuilder, v: SelectedVariant, at: Point) {
  const radius = mm(v.specs.wheel_bsd_mm, 0.622) / 2,
    width = mm(v.specs.outer_width_mm, 0.035),
    height = mm(v.specs.profile_height_mm, 0.02),
    count = Number(v.specs.spoke_hole_count) || 32;
  const profile = [
    new T.Vector2(radius - height, -width * 0.35),
    new T.Vector2(radius - height * 0.8, -width * 0.5),
    new T.Vector2(radius + 0.001, -width * 0.5),
    new T.Vector2(radius + 0.001, -width * 0.38),
    new T.Vector2(radius - height * 0.6, -width * 0.32),
    new T.Vector2(radius - height * 0.6, width * 0.32),
    new T.Vector2(radius + 0.001, width * 0.38),
    new T.Vector2(radius + 0.001, width * 0.5),
    new T.Vector2(radius - height * 0.8, width * 0.5),
    new T.Vector2(radius - height, width * 0.35),
  ];
  const g = new T.LatheGeometry(profile, 96);
  g.rotateX(Math.PI / 2);
  g.translate(...at);
  b.add(g, dark);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2,
      hubAngle = angle + (i % 2 ? -0.26 : 0.26),
      z = i % 2 ? 0.031 : -0.031;
    const hub: Point = [
        at[0] + Math.cos(hubAngle) * 0.027,
        at[1] + Math.sin(hubAngle) * 0.027,
        z,
      ],
      end: Point = [
        at[0] + Math.cos(angle) * (radius - height),
        at[1] + Math.sin(angle) * (radius - height),
        0,
      ];
    b.tube(hub, end, 0.0007, metal, 0.0007, 5);
    b.tube(
      end,
      [end[0] + Math.cos(angle) * 0.006, end[1] + Math.sin(angle) * 0.006, 0],
      0.0015,
      metal,
      0.0015,
      6,
    );
  }
  b.tube(
    [at[0], at[1] - radius + 0.002, 0],
    [at[0], at[1] - radius + 0.02, 0],
    0.002,
    dark,
  );
}
export function buildHub(
  b: MeshBuilder,
  v: SelectedVariant,
  at: Point,
  color: string,
) {
  const width = mm(v.specs.axle_width_mm, 0.11),
    rear = v.specs.position === "rear";
  b.tube(point(at, -width * 0.4), point(at, width * 0.4), 0.017, color, 0.021);
  for (const sign of [-1, 1]) {
    b.tube(
      point(at, sign * width * 0.27 - 0.003),
      point(at, sign * width * 0.27 + 0.003),
      0.029,
      color,
    );
    b.tube(
      point(at, sign * width * 0.43),
      point(at, sign * width * 0.5),
      0.011,
      metal,
    );
    b.disc(point(at, sign * width * 0.28), 0.029, 0.014, 0.003, color, 0, 16);
  }
  if (rear) {
    b.tube(point(at, width * 0.3), point(at, width * 0.57), 0.018, metal);
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      b.box(
        [
          at[0] + Math.cos(angle) * 0.019,
          at[1] + Math.sin(angle) * 0.019,
          width * 0.45,
        ],
        [0.003, 0.004, 0.025],
        metal,
        angle,
      );
    }
  }
}
export function buildRotor(
  b: MeshBuilder,
  key: ModelProfile,
  v: SelectedVariant,
  at: Point,
) {
  const r = mm(v.specs.rotor_diameter_mm, 0.203) / 2,
    z = -0.064,
    magura = key === "magura-mdr-p",
    sram = key === "sram-hs2",
    arms = magura ? 6 : sram ? 6 : 5;
  const c = point(at, z);
  b.disc(c, r, r - 0.014, 0.0019, metal, 0, 36);
  b.disc(c, 0.027, 0.016, 0.002, magura ? dark : metal, 0, 6);
  for (let i = 0; i < arms; i++) {
    const a = (i / arms) * Math.PI * 2;
    const inner: Point = [
        at[0] + Math.cos(a) * 0.024,
        at[1] + Math.sin(a) * 0.024,
        z,
      ],
      outer: Point = [
        at[0] + Math.cos(a + 0.25) * (r - 0.011),
        at[1] + Math.sin(a + 0.25) * (r - 0.011),
        z,
      ];
    b.loft(
      [inner, outer],
      [
        [0.005, 0.0015],
        [magura ? 0.008 : 0.005, 0.0015],
      ],
      sram ? metal : dark,
    );
    if (magura) b.disc(outer, 0.004, 0.0015, 0.004, metal);
  }
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    b.disc(
      [
        at[0] + Math.cos(angle) * 0.022,
        at[1] + Math.sin(angle) * 0.022,
        z - 0.003,
      ],
      0.003,
      0.001,
      0.003,
      dark,
    );
  }
}
