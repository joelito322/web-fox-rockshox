import * as T from "three";
import type { SelectedVariant } from "../../../../catalog/model";
import type { AssemblyV2 } from "../../../model/assemblyV2";
import type { Point } from "../../../model/assembly";
import type { ModelProfile } from "../../../../catalog/model/visual-profiles";
import { MeshBuilder, dark, metal, point, mix } from "./mesh";
import { mm } from "./wheels";
export function buildBrake(
  b: MeshBuilder,
  key: ModelProfile,
  v: SelectedVariant,
  a: AssemblyV2,
  front: boolean,
  color: string,
  width: number,
) {
  const at = front ? a.front : a.rear,
    pistons = Number(v.specs.piston_count) || 4,
    magura = key.startsWith("magura"),
    maven = key.startsWith("sram"),
    length = pistons === 4 ? 0.062 : 0.043;
  const x = at[0] - 0.055,
    y = at[1] + 0.058,
    z = -0.065;
  b.plate(
    [
      [x - length * 0.5, y - 0.016],
      [x + length * 0.37, y - 0.014],
      [x + length * 0.52, y],
      [x + length * 0.35, y + 0.02],
      [x - length * 0.35, y + 0.021],
      [x - length * 0.52, y + 0.005],
    ],
    z,
    0.028,
    color,
  );
  b.box([x, y - 0.011, z], [length * 0.72, 0.01, 0.005], dark);
  for (let i = 0; i < pistons / 2; i++)
    for (const side of [-1, 1]) {
      const pos: Point = [
        x + (i - (pistons / 2 - 1) / 2) * 0.025,
        y + 0.003,
        z + side * 0.017,
      ];
      b.disc(
        pos,
        maven ? 0.012 : 0.01,
        0.004,
        0.004,
        magura ? "#d6e43c" : color,
      );
      b.disc(point(pos, pos[2] + side * 0.003), 0.006, 0.002, 0.003, dark);
    }
  for (const dx of [-length * 0.45, length * 0.45]) {
    b.tube([x + dx, y + 0.009, z], [x + dx, y + 0.034, z], 0.005, dark);
    b.disc([x + dx, y + 0.028, z - 0.018], 0.004, 0.0015, 0.005, metal);
  }
  if (key.startsWith("shimano"))
    for (let i = 0; i < 5; i++)
      b.box([x - 0.018 + i * 0.009, y + 0.027, z], [0.003, 0.022, 0.019], dark);
  const blade = key === "magura-mt4" || key === "magura-mt5" ? 1.2 : 1,
    side = front ? -1 : 1,
    bar = a.bar,
    gripZ = side * (width / 2 - 0.145),
    lever: Point = [bar[0] + 0.01, bar[1] - 0.018, gripZ];
  b.tube(
    [bar[0], bar[1], gripZ - 0.009],
    [bar[0], bar[1], gripZ + 0.009],
    0.017,
    dark,
  );
  b.loft(
    [
      lever,
      [lever[0] + 0.025, lever[1] - 0.008, lever[2]],
      [lever[0] + 0.037, lever[1] - 0.02, lever[2] + side * 0.035],
    ],
    [
      [maven ? 0.02 : 0.014, 0.018],
      [0.015, 0.021],
      [0.009, 0.011],
    ],
    color,
  );
  b.path(
    [
      [lever[0] + 0.025, lever[1] - 0.012, lever[2] + side * 0.014],
      [lever[0] + 0.04, lever[1] - 0.028, lever[2] + side * 0.055],
      [lever[0] + 0.047, lever[1] - 0.024, lever[2] + side * 0.095 * blade],
    ],
    0.0045,
    dark,
    16,
  );
  b.tube(
    [lever[0] + 0.006, lever[1], lever[2]],
    [lever[0] + 0.006, lever[1] + 0.007, lever[2]],
    0.006,
    magura ? "#cfd83a" : metal,
  );
  const hose: Point[] = [
    [lever[0] + 0.03, lever[1], lever[2]],
    [bar[0] + 0.13, bar[1] - 0.08, gripZ * 0.4],
    [a.head[0] - 0.015, a.head[1] - 0.08, -0.07],
  ];
  if (!front)
    hose.push(
      [0.3, 0.29, -0.045],
      [0.025, 0.055, -0.047],
      [-0.26, 0.04, -0.07],
    );
  hose.push([x + 0.025, y + 0.025, z]);
  b.path(hose, 0.0022, dark, 32);
  if (key === "magura-mt7-pro")
    b.tube(
      [lever[0] + 0.026, lever[1] - 0.012, lever[2]],
      [lever[0] + 0.026, lever[1] - 0.012, lever[2] + side * 0.026],
      0.005,
      "#d8dc31",
    );
}
export function buildControls(
  b: MeshBuilder,
  category: string,
  v: SelectedVariant,
  a: AssemblyV2,
  color: string,
) {
  if (category === "handlebar") {
    const half = mm(v.specs.width_mm, 0.78) / 2,
      rise = mm(v.specs.rise_mm, 0.025),
      clamp = mm(v.specs.clamp_diameter_mm, 0.0318) / 2;
    for (const sign of [-1, 1]) {
      const p: Point[] = [
        [a.bar[0], a.bar[1], 0],
        [a.bar[0], a.bar[1], sign * 0.08],
        [a.bar[0] - 0.012, a.bar[1] + rise * 0.65, sign * 0.18],
        [a.bar[0] - 0.04, a.bar[1] + rise, sign * half],
      ];
      b.loft(
        p,
        [
          [clamp, clamp],
          [clamp, clamp],
          [0.012, 0.012],
          [0.011, 0.011],
        ],
        color,
      );
      const end = p[3],
        start = mix(p[2], end, 0.4);
      b.tube(start, end, 0.015, dark);
      for (let i = 0; i < 15; i++)
        b.tube(
          mix(start, end, i / 15),
          mix(start, end, (i + 0.3) / 15),
          0.0156,
          "#303434",
          0.0156,
          10,
        );
      b.tube(end, [end[0], end[1], end[2] + sign * 0.003], 0.016, metal);
    }
  } else if (category === "stem") {
    const direct = v.specs.mount_type === "direct_mount",
      start = direct ? a.upperCrown : a.head,
      end = a.bar;
    if (direct)
      for (const z of [-0.028, 0.028])
        b.loft(
          [point(start, z), point(end, z)],
          [
            [0.011, 0.014],
            [0.014, 0.014],
          ],
          color,
        );
    else {
      b.tube(
        [start[0], start[1] - 0.005, 0],
        [start[0], start[1] + 0.033, 0],
        0.022,
        color,
      );
      b.loft(
        [start, end],
        [
          [0.021, 0.02],
          [0.018, 0.024],
        ],
        color,
      );
    }
    b.tube(point(end, -0.027), point(end, 0.027), 0.023, color);
    for (const z of [-0.021, 0.021])
      for (const y of [-0.016, 0.016])
        b.disc([end[0] + 0.02, end[1] + y, z], 0.003, 0.001, 0.004, metal);
  } else if (category === "seatpost") {
    const diameter = mm(v.specs.diameter_mm, 0.0316),
      end: Point = [a.saddle[0], a.saddle[1] - 0.03, 0];
    b.tube(a.seat, end, diameter / 2, color);
    b.tube(
      mix(a.seat, end, 0.04),
      mix(a.seat, end, 0.1),
      diameter / 2 + 0.004,
      dark,
    );
    b.loft(
      [end, [end[0] - 0.01, end[1] + 0.01, 0]],
      [
        [0.015, 0.022],
        [0.011, 0.025],
      ],
      dark,
    );
  } else if (category === "saddle") {
    const length = mm(v.specs.length_mm, 0.26),
      width = mm(v.specs.width_mm, 0.145),
      at = a.saddle;
    // Narrow nose, flared rear wings and relief channel, rather than an ellipsoid.
    const sections = 12,
      verts: number[] = [],
      indices: number[] = [];
    for (let i = 0; i <= sections; i++) {
      const t = i / sections,
        x = at[0] + (t - 0.55) * length,
        w =
          ((t < 0.4
            ? Math.sin(((t / 0.4) * Math.PI) / 2)
            : Math.max(0.2, 1 - (t - 0.4) * 1.2)) *
            width) /
          2;
      for (let j = 0; j <= 8; j++) {
        const z = ((j / 8) * 2 - 1) * w,
          y =
            at[1] +
            0.012 * Math.sin(t * Math.PI) -
            0.009 * Math.pow(z / (width / 2), 2) -
            0.004 * Math.exp(-Math.pow(z / 0.012, 2));
        verts.push(x, y, z);
        if (i < sections && j < 8) {
          const q = i * 9 + j;
          indices.push(q, q + 9, q + 1, q + 1, q + 9, q + 10);
        }
      }
    }
    b.loft(
      [
        [at[0] - length * 0.53, at[1] - 0.008, 0],
        [at[0] - length * 0.25, at[1] - 0.008, 0],
        [at[0] + length * 0.18, at[1] - 0.006, 0],
        [at[0] + length * 0.44, at[1] - 0.009, 0],
      ],
      [
        [0.004, width * 0.2],
        [0.008, width * 0.46],
        [0.006, width * 0.22],
        [0.003, width * 0.09],
      ],
      color,
    );
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(verts, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    b.add(g, color, 0.85, 0.02);
    for (const z of [-0.025, 0.025])
      b.path(
        [
          [at[0] - 0.085, at[1] - 0.012, z],
          [at[0] - 0.055, at[1] - 0.03, z],
          [at[0] + 0.045, at[1] - 0.03, z],
          [at[0] + 0.07, at[1] - 0.015, z],
        ],
        0.003,
        metal,
        14,
      );
  } else if (category === "bottom_bracket") {
    const width = mm(v.specs.shell_width_mm, 0.092),
      r = v.specs.spindle_standard === "DUB" ? 0.021 : 0.02;
    b.tube([0, 0, -width / 2], [0, 0, width / 2], r, dark);
    for (const z of [-width / 2, width / 2]) {
      b.disc([0, 0, z], 0.025, 0.014, 0.006, color);
      b.disc([0, 0, z + (z > 0 ? 0.004 : -0.004)], 0.02, 0.013, 0.002, metal);
    }
  }
}
