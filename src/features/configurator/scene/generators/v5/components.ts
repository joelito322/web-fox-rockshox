import * as T from "three";
import type { Point } from "../../../model/assembly";
import type { AssemblyV2 } from "../../../model/assemblyV2";
import type { SelectedVariant } from "../../../../catalog/model";
import type { ModelProfile } from "../../../../catalog/model/visual-profiles";
import { SpatialMeshBuilder } from "../v4/mesh";
import { dark, metal, rubber, point } from "../v3/mesh";
import { buildBrake as oldBrake } from "../v3/controls";
import {
  buildDerailleur as oldDerailleur,
  crankEnd,
  crankLength,
  buildCranks as oldCranks,
} from "../v3/drivetrain";
import { mm } from "../v3/wheels";

// Exterior envelopes estimated from the model photographs in photos.json; no inferred commercial dimensions.
const calipers = {
  "shimano-slx-m7120": {
    length: 0.068,
    height: 0.036,
    nose: 0.013,
    cap: 0.01,
    lever: 1,
  },
  "shimano-slx-m7100-brake": {
    length: 0.047,
    height: 0.032,
    nose: 0.009,
    cap: 0.011,
    lever: 1,
  },
  "magura-mt4": {
    length: 0.048,
    height: 0.035,
    nose: 0.011,
    cap: 0.012,
    lever: 1.25,
  },
  "magura-mt5": {
    length: 0.072,
    height: 0.037,
    nose: 0.009,
    cap: 0.011,
    lever: 1.25,
  },
  "magura-mt5-pro": {
    length: 0.072,
    height: 0.037,
    nose: 0.009,
    cap: 0.011,
    lever: 1,
  },
  "magura-mt7-pro": {
    length: 0.074,
    height: 0.039,
    nose: 0.013,
    cap: 0.012,
    lever: 1,
  },
  "sram-maven-brz-b1": {
    length: 0.082,
    height: 0.043,
    nose: 0.016,
    cap: 0.013,
    lever: 1.1,
  },
  "sram-maven-slv-b1": {
    length: 0.082,
    height: 0.043,
    nose: 0.016,
    cap: 0.013,
    lever: 1.1,
  },
  "sram-maven-ult-b1": {
    length: 0.082,
    height: 0.043,
    nose: 0.016,
    cap: 0.013,
    lever: 1.1,
  },
} as const;
// Keep lever/cable routing from the frozen renderer, replace the caliper envelope and clamp details.
class BrakeBodyBuilder extends SpatialMeshBuilder {
  constructor(
    private readonly body: { minX: number; maxX: number; maxY: number },
  ) {
    super();
  }
  override add(g: T.BufferGeometry, c: string, r = 0.4, m = 0.55) {
    g.computeBoundingBox();
    const box = g.boundingBox!;
    // Exclude old caliper-local geometry while retaining the shared lever/hose surfaces.
    if (
      box.max.x >= this.body.minX &&
      box.min.x <= this.body.maxX &&
      box.max.y < this.body.maxY &&
      box.min.z < -0.04 &&
      box.max.z < -0.025
    ) {
      g.dispose();
      return;
    }
    super.add(g, c, r, m);
  }
}
export function brake(
  key: ModelProfile,
  v: SelectedVariant,
  a: AssemblyV2,
  front: boolean,
  color: string,
  width: number,
) {
  if (!(key in calipers)) throw Error("missing_brake_reference");
  const p = calipers[key as keyof typeof calipers],
    at = front ? a.front : a.rear;
  const x = at[0] - 0.058,
    y = at[1] + 0.06,
    z = -0.065,
    L = p.length / 2,
    H = p.height / 2;
  const b = new BrakeBodyBuilder({
    minX: x - 0.06,
    maxX: x + 0.06,
    maxY: y + 0.065,
  });
  oldBrake(b, key, v, a, front, color, width);
  // Open pad channel, separate forged halves and a top bridge; avoid a solid brick across the rotor.
  const outline: [number, number][] = [
    [-L, -H],
    [-L - 0.005, -0.005],
    [-L + 0.004, H * 0.8],
    [-L + 0.018, H],
    [L - 0.006, H],
    [L + p.nose * 0.2, H * 0.45],
    [L + p.nose * 0.3, -0.004],
    [L - 0.004, -H],
  ];
  for (const side of [-1, 1]) {
    b.plate(
      outline.map(([dx, dy]) => [x + dx, y + dy]),
      z + side * 0.011,
      0.013,
      color,
    );
    const count = v.specs.piston_count === 2 ? 1 : 2;
    for (let i = 0; i < count; i++) {
      const dx = (i - (count - 1) / 2) * 0.029;
      b.disc(
        [x + dx, y + 0.001, z + side * 0.02],
        p.cap,
        0.005,
        0.004,
        key.startsWith("magura") ? "#b7bd47" : color,
      );
      b.disc([x + dx, y + 0.001, z + side * 0.023], 0.004, 0.0015, 0.002, dark);
    }
  }
  b.box([x, y + H - 0.004, z], [p.length * 0.65, 0.009, 0.029], color);
  for (const dx of [-0.037, 0.037]) {
    b.tube(
      [x + dx, y - 0.004, z - 0.003],
      [x + dx, y + 0.028, z - 0.003],
      0.005,
      color,
    );
    b.disc([x + dx, y + 0.028, z - 0.019], 0.003, 0.001, 0.004, metal);
  }
  if (key === "shimano-slx-m7120")
    for (let i = 0; i < 5; i++)
      b.box(
        [x - 0.017 + i * 0.008, y + H + 0.008, z],
        [0.0025, 0.02, 0.024],
        dark,
      );
  if (key.startsWith("sram"))
    for (const side of [-1, 1])
      b.disc(
        [x - 0.025, y + 0.009, z + side * 0.021],
        0.004,
        0.0015,
        0.003,
        "#c2b38a",
      );
  // Banjo and bleed port are separate from the body, with an exposed pad slot.
  b.disc([x + L - 0.006, y + H - 0.005, z - 0.022], 0.006, 0.002, 0.006, metal);
  return b.finish();
}
export function rotor(
  b: SpatialMeshBuilder,
  key: ModelProfile,
  v: SelectedVariant,
  at: Point,
) {
  const r = mm(v.specs.rotor_diameter_mm, 0.203) / 2,
    z = -0.064;
  const magura = key === "magura-mdr-p",
    sram = key === "sram-hs2";
  const arms = magura ? 6 : sram ? 6 : 5,
    thick = mm(
      v.specs.rotor_thickness_mm,
      magura ? 0.002 : sram ? 0.002 : 0.0018,
    );
  const shape = new T.Shape(),
    segments = 180;
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const rr =
      r -
      (sram
        ? 0.0008 * (0.5 + 0.5 * Math.cos(angle * 18))
        : 0.0018 * (0.5 + 0.5 * Math.cos(angle * 12)));
    if (i === 0) shape.moveTo(rr, 0);
    else shape.lineTo(Math.cos(angle) * rr, Math.sin(angle) * rr);
  }
  shape.closePath();
  const inside = new T.Path();
  inside.absarc(0, 0, r - 0.015, 0, Math.PI * 2, true);
  shape.holes.push(inside);
  // Actual open ventilation slots instead of a row of tiny circles on an otherwise solid ring.
  for (let i = 0; i < (sram ? 24 : magura ? 30 : 24); i++) {
    const angle = (i / (sram ? 24 : magura ? 30 : 24)) * Math.PI * 2;
    const hole = new T.Path();
    const c = new T.Vector2(
      Math.cos(angle) * (r - 0.0075),
      Math.sin(angle) * (r - 0.0075),
    );
    const tangent = new T.Vector2(-Math.sin(angle), Math.cos(angle)),
      radial = new T.Vector2(Math.cos(angle), Math.sin(angle));
    const corners = [
      [-0.004, -0.0018],
      [0.004, -0.0018],
      [0.004, 0.0018],
      [-0.004, 0.0018],
    ];
    corners.reverse().forEach(([u, w], j) => {
      const p = c
        .clone()
        .addScaledVector(tangent, u)
        .addScaledVector(radial, w);
      if (j) hole.lineTo(p.x, p.y);
      else hole.moveTo(p.x, p.y);
    });
    hole.closePath();
    shape.holes.push(hole);
  }
  const g = new T.ExtrudeGeometry(shape, {
    depth: thick,
    bevelEnabled: false,
    curveSegments: 4,
  });
  g.translate(at[0], at[1], z - thick / 2);
  b.add(g, metal, 0.32, 0.85);
  b.disc(point(at, z), 0.027, 0.016, thick, magura ? dark : metal, 0, 6);
  for (let i = 0; i < arms; i++) {
    const angle = (i / arms) * Math.PI * 2,
      tip = angle + (magura ? 0.18 : sram ? 0.06 : 0.3);
    b.loft(
      [
        [at[0] + Math.cos(angle) * 0.023, at[1] + Math.sin(angle) * 0.023, z],
        [
          at[0] + Math.cos(tip) * (r - 0.013),
          at[1] + Math.sin(tip) * (r - 0.013),
          z,
        ],
      ],
      [
        [0.0045, 0.001],
        [magura ? 0.007 : 0.005, 0.001],
      ],
      sram ? metal : dark,
    );
    if (magura)
      b.disc(
        [
          at[0] + Math.cos(tip) * (r - 0.016),
          at[1] + Math.sin(tip) * (r - 0.016),
          z,
        ],
        0.0035,
        0.001,
        0.003,
        metal,
      );
  }
}
export function derailleur(
  b: SpatialMeshBuilder,
  key: ModelProfile,
  v: SelectedVariant,
  a: AssemblyV2,
  color: string,
) {
  oldDerailleur(b, key, v, a, color);
  const dh = key === "sram-gx-dh-a3",
    r = a.rear,
    x = r[0] + 0.026,
    y = r[1] - 0.015;
  // Distinct parallelogram, clutch housing and hollow cage contours.
  const outline: [number, number][] = dh
    ? [
        [-0.015, 0.014],
        [0.018, 0.021],
        [0.055, -0.005],
        [0.054, -0.04],
        [0.025, -0.065],
        [-0.007, -0.041],
      ]
    : [
        [-0.018, 0.014],
        [0.019, 0.024],
        [0.061, 0.001],
        [0.067, -0.033],
        [0.034, -0.064],
        [0.006, -0.049],
        [-0.016, -0.016],
      ];
  b.plate(
    outline.map(([dx, dy]) => [x + dx, y + dy]),
    0.111,
    0.012,
    color,
  );
  b.disc([x + 0.018, y - 0.043, 0.124], dh ? 0.019 : 0.023, 0.006, 0.012, dark);
  b.disc([x + 0.018, y - 0.043, 0.132], 0.008, 0.003, 0.003, metal);
  b.loft(
    [
      [x - 0.002, y + 0.005, 0.107],
      [x + 0.042, y - 0.027, 0.107],
    ],
    [
      [0.006, 0.004],
      [0.006, 0.004],
    ],
    metal,
  );
  const lowerY = r[1] - (dh ? 0.12 : 0.17);
  b.plate(
    [
      [r[0] + 0.027, r[1] - 0.06],
      [r[0] + 0.044, r[1] - 0.043],
      [r[0] + 0.092, lowerY - 0.006],
      [r[0] + 0.082, lowerY - 0.02],
      [r[0] + 0.071, lowerY + 0.003],
    ],
    0.112,
    0.003,
    dark,
    [{ x: r[0] + 0.061, y: (r[1] - 0.055 + lowerY) / 2, r: 0.008 }],
  );
}
export function cranks(
  b: SpatialMeshBuilder,
  key: ModelProfile,
  v: SelectedVariant,
  color: string,
) {
  oldCranks(b, key, v, color);
  // Machined pedal eye and recessed face on each forged arm.
  for (const side of [-1, 1]) {
    const end = crankEnd(crankLength(v), side),
      start: Point = [0, 0, side * 0.097];
    b.loft(
      [
        [
          start[0] + (end[0] - start[0]) * 0.2,
          start[1] + (end[1] - start[1]) * 0.2,
          side * 0.096,
        ],
        [end[0] * 0.82, end[1] * 0.82, side * 0.096],
      ],
      [
        [key.startsWith("shimano") ? 0.006 : 0.004, 0.001],
        [0.004, 0.001],
      ],
      dark,
    );
    b.disc([end[0], end[1], side * 0.097], 0.009, 0.005, 0.002, metal);
  }
}
const tread = {
  "maxxis-assegai": {
    rows: 48,
    center: 0.012,
    side: 0.018,
    stagger: 0.5,
    ramp: 0.15,
    paired: 3,
  },
  "maxxis-minion-dhr-ii": {
    rows: 44,
    center: 0.022,
    side: 0.018,
    stagger: 0.25,
    ramp: 0,
    paired: 2,
  },
  "cst-bft-c1752": {
    rows: 46,
    center: 0.017,
    side: 0.017,
    stagger: 0.5,
    ramp: 0.24,
    paired: 2,
  },
  "kenda-pinner-pro-k1241a": {
    rows: 46,
    center: 0.016,
    side: 0.017,
    stagger: 0.4,
    ramp: 0.3,
    paired: 2,
  },
  "michelin-wild-enduro-ms-racing-line": {
    rows: 42,
    center: 0.014,
    side: 0.02,
    stagger: 0.5,
    ramp: 0.2,
    paired: 3,
  },
  "schwalbe-gravity-magic-mary": {
    rows: 42,
    center: 0.013,
    side: 0.018,
    stagger: 0.5,
    ramp: 0.12,
    paired: 2,
  },
} as const;
export function tire(
  b: SpatialMeshBuilder,
  key: ModelProfile,
  v: SelectedVariant,
  at: Point,
) {
  if (!(key in tread)) throw Error("missing_tire_reference");
  const p = tread[key as keyof typeof tread],
    w = mm(v.specs.tire_width_mm, 0.061),
    bead = mm(v.specs.wheel_bsd_mm, 0.622) / 2;
  const tube = w * 0.46,
    radius = bead + w - tube - 0.004;
  const carcass = new T.TorusGeometry(radius, tube, 12, 96);
  carcass.scale(1, 1, 0.91);
  carcass.translate(...at);
  b.add(carcass, rubber, 0.93, 0.02);
  for (let i = 0; i < p.rows; i++)
    for (const lane of [-2, -1, 1, 2]) {
      const shoulder = Math.abs(lane) === 2,
        phase = ((i + (shoulder ? p.stagger : 0)) / p.rows) * Math.PI * 2;
      const cross = shoulder ? 0.9 : 0.3,
        sign = Math.sign(lane),
        r = radius + Math.cos(cross) * tube + 0.002;
      const length = shoulder
          ? p.side
          : i % p.paired === 0
            ? p.center
            : p.center * 0.75,
        width = shoulder ? 0.011 : 0.013;
      // Six-sided ramped blocks with a real separation in the top face.
      const polygon: [number, number][] = [
        [-length / 2, -width / 2],
        [length * 0.35, -width / 2],
        [length / 2, -width * 0.25],
        [length / 2, width / 2],
        [-length * 0.35, width / 2],
        [-length / 2, width * 0.25],
      ];
      const shape = new T.Shape(polygon.map(([x, y]) => new T.Vector2(x, y)));
      const slot = new T.Path();
      slot.moveTo(-length * 0.28, -0.0007);
      slot.lineTo(-length * 0.28, 0.0007);
      slot.lineTo(length * 0.28, 0.0007);
      slot.lineTo(length * 0.28, -0.0007);
      slot.closePath();
      shape.holes.push(slot);
      const g = new T.ExtrudeGeometry(shape, {
        depth: shoulder ? 0.006 : 0.005,
        bevelEnabled: false,
      });
      g.rotateX(-Math.PI / 2);
      g.rotateY(sign * p.ramp);
      g.rotateX(sign * cross);
      g.rotateZ(phase - Math.PI / 2);
      g.translate(
        at[0] + Math.cos(phase) * r,
        at[1] + Math.sin(phase) * r,
        sign * Math.sin(cross) * tube * 0.91,
      );
      b.add(g, rubber, 0.93, 0.02);
    }
}
export function rim(b: SpatialMeshBuilder, v: SelectedVariant, at: Point) {
  const radius = mm(v.specs.wheel_bsd_mm, 0.622) / 2,
    width = mm(v.specs.outer_width_mm, 0.035),
    height = mm(v.specs.profile_height_mm, 0.02),
    count = Number(v.specs.spoke_hole_count) || 32;
  const profile = [
    new T.Vector2(radius - height, -width * 0.36),
    new T.Vector2(radius - height * 0.85, -width * 0.5),
    new T.Vector2(radius + 0.001, -width * 0.5),
    new T.Vector2(radius + 0.001, -width * 0.37),
    new T.Vector2(radius - height * 0.55, -width * 0.31),
    new T.Vector2(radius - height * 0.55, width * 0.31),
    new T.Vector2(radius + 0.001, width * 0.37),
    new T.Vector2(radius + 0.001, width * 0.5),
    new T.Vector2(radius - height * 0.85, width * 0.5),
    new T.Vector2(radius - height, width * 0.36),
  ];
  const g = new T.LatheGeometry(profile, 96);
  g.rotateX(Math.PI / 2);
  g.translate(...at);
  b.add(g, dark);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2,
      side = i % 2 ? 1 : -1;
    const flangeAngle =
      angle +
      (Math.floor(i / 2) % 2 ? 1 : -1) * 3 * ((Math.PI * 2) / (count / 2));
    const end: Point = [
      at[0] + Math.cos(angle) * (radius - height),
      at[1] + Math.sin(angle) * (radius - height),
      side * 0.001,
    ];
    b.tube(
      [
        at[0] + Math.cos(flangeAngle) * 0.028,
        at[1] + Math.sin(flangeAngle) * 0.028,
        side * 0.031,
      ],
      end,
      0.00075,
      metal,
      0.00075,
      6,
    );
    b.tube(
      end,
      [
        end[0] + Math.cos(angle) * 0.008,
        end[1] + Math.sin(angle) * 0.008,
        end[2],
      ],
      0.0016,
      metal,
      0.0016,
      6,
    );
  }
  b.tube(
    [at[0], at[1] - radius + 0.004, 0],
    [at[0], at[1] - radius + 0.024, 0],
    0.002,
    dark,
  );
}
export function pedals(
  b: SpatialMeshBuilder,
  v: SelectedVariant,
  crank: SelectedVariant | undefined,
  color: string,
) {
  const length = mm(v.specs.platform_length_mm, 0.105),
    width = mm(v.specs.platform_width_mm, 0.12),
    thickness = mm(v.specs.platform_thickness_mm, 0.02);
  for (const side of [-1, 1]) {
    const p = crankEnd(crankLength(crank), side),
      z = side * (0.085 + width / 2 + 0.012);
    const outline = [
      [-0.5, -0.38],
      [-0.35, -0.5],
      [0.36, -0.5],
      [0.5, -0.34],
      [0.5, 0.32],
      [0.32, 0.5],
      [-0.35, 0.5],
      [-0.5, 0.34],
    ];
    const shape = new T.Shape(
      outline.map(([x, y]) => new T.Vector2(x * length, y * width)),
    );
    for (const sign of [-1, 1]) {
      const hole = new T.Path();
      hole.moveTo(-length * 0.3, sign * width * 0.13);
      hole.lineTo(length * 0.3, sign * width * 0.13);
      hole.lineTo(length * 0.3, sign * width * 0.33);
      hole.lineTo(-length * 0.3, sign * width * 0.33);
      hole.closePath();
      shape.holes.push(hole);
    }
    const g = new T.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: true,
      bevelSize: 0.001,
      bevelThickness: 0.001,
      bevelSegments: 2,
    });
    g.rotateX(Math.PI / 2);
    g.translate(p[0], p[1] + thickness / 2, z);
    b.add(g, color);
    b.tube(p, [p[0], p[1], z], 0.006, metal);
    for (const x of [-0.36, 0, 0.36])
      for (const dz of [-0.4, 0.4])
        for (const top of [-1, 1])
          b.tube(
            [p[0] + x * length, p[1] + (top * thickness) / 2, z + dz * width],
            [
              p[0] + x * length,
              p[1] + top * (thickness / 2 + 0.004),
              z + dz * width,
            ],
            0.0016,
            metal,
            0.0016,
            6,
          );
  }
}
