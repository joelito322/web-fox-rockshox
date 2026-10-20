import type { AssemblyV2 } from "../../../model/assemblyV2";
import type { ModelProfile } from "../../../../catalog/model/visual-profiles";
import type { Point } from "../../../model/assembly";
import { MeshBuilder, dark, metal, point, mix } from "./mesh";
// Cross sections and bends estimated from the linked exterior reference photos, in metres.
const frameProfiles = {
  "commencal-meta-sx-v5": {
    bulk: 0.032,
    bend: 0.13,
    top: 0.021,
    split: false,
    rocker: 0.12,
  },
  "commencal-supreme-dh-v5": {
    bulk: 0.038,
    bend: 0.17,
    top: 0.026,
    split: true,
    rocker: 0.24,
  },
  "santa-cruz-nomad-7-my27": {
    bulk: 0.041,
    bend: 0.16,
    top: 0.026,
    split: false,
    rocker: 0.11,
  },
  "canyon-sender-cfr-high-pivot": {
    bulk: 0.043,
    bend: 0.22,
    top: 0.028,
    split: true,
    rocker: 0.23,
  },
  "specialized-s-works-enduro-udh": {
    bulk: 0.042,
    bend: 0.16,
    top: 0.029,
    split: true,
    rocker: 0.15,
  },
  "da-bomb-cherry-bomb-29": {
    bulk: 0.032,
    bend: 0.1,
    top: 0.023,
    split: false,
    rocker: 0.26,
  },
  "scott-ransom-rc-427727": {
    bulk: 0.054,
    bend: 0.16,
    top: 0.025,
    split: false,
    rocker: 0.1,
  },
  "trek-slash-al-gen-6": {
    bulk: 0.039,
    bend: 0.12,
    top: 0.023,
    split: false,
    rocker: 0.24,
  },
} as const;
export function buildFrame(
  b: MeshBuilder,
  key: ModelProfile,
  a: AssemblyV2,
  color: string,
) {
  if (!(key in frameProfiles)) throw Error("invalid_frame_profile");
  const p = frameProfiles[key as keyof typeof frameProfiles],
    { seat, head, lower, rear, pivot, idler } = a;
  const bb: Point = [0, 0, 0];
  const topSeat: Point = [seat[0] + 0.012, seat[1] - 0.025, 0];
  const knee: Point = [0.07, p.bend * 0.37, 0],
    shoulder: Point = [lower[0] * 0.7, lower[1] * 0.6, 0];
  b.loft(
    [bb, knee, shoulder, lower],
    [
      [0.03, 0.035],
      [p.bulk, 0.035],
      [p.bulk * 0.9, 0.031],
      [p.bulk * 0.85, 0.034],
    ],
    color,
  );
  b.loft(
    [topSeat, mix(topSeat, head, 0.42), head],
    [
      [p.top, 0.023],
      [p.top * 0.72, 0.021],
      [p.top * 1.1, 0.029],
    ],
    color,
  );
  b.loft(
    [lower, mix(lower, head, 0.5), head],
    [
      [0.034, 0.032],
      [0.033, 0.033],
      [0.029, 0.028],
    ],
    color,
  );
  // Bent seat tube and real rear triangle opening, leaving room for the shock.
  const seatBase: Point = [-0.01, 0.065, 0],
    seatKnee: Point = [seat[0] * 0.75, 0.22, 0];
  if (p.split)
    for (const z of [-0.029, 0.029])
      b.loft(
        [point(seatBase, z), point(seatKnee, z), point(seat, z)],
        [
          [0.017, 0.014],
          [0.018, 0.013],
          [0.02, 0.016],
        ],
        color,
      );
  else
    b.loft(
      [seatBase, seatKnee, seat],
      [
        [key.startsWith("scott") ? 0.048 : 0.025, 0.026],
        [0.027, 0.025],
        [0.018, 0.018],
      ],
      color,
    );
  for (const z of [-0.043, 0.043]) {
    const rearEnd = point(rear, z * 1.7),
      yoke: Point = [-0.045, 0.045, z * 1.15];
    const stayTop: Point = [seat[0] - 0.025, p.rocker, z];
    b.loft(
      [rearEnd, [-0.29, rear[1] + 0.015, z * 1.65], yoke],
      [
        [0.012, 0.009],
        [0.014, 0.012],
        [0.022, 0.016],
      ],
      color,
    );
    b.loft(
      [rearEnd, [-0.27, (p.rocker + rear[1]) * 0.57, z * 1.6], stayTop],
      [
        [0.009, 0.009],
        [0.013, 0.011],
        [0.017, 0.016],
      ],
      color,
    );
    const rp = point(pivot, z),
      tip: Point = [pivot[0] + 0.075, pivot[1] + 0.015, z];
    b.loft(
      [stayTop, rp],
      [
        [0.012, 0.009],
        [0.016, 0.009],
      ],
      dark,
    );
    b.plate(
      [
        [rp[0] - 0.015, rp[1] - 0.018],
        [tip[0] + 0.014, tip[1] - 0.012],
        [stayTop[0] + 0.015, stayTop[1] + 0.019],
        [rp[0] - 0.02, rp[1] + 0.02],
      ],
      z,
      0.012,
      dark,
    );
    for (const at of [rp, tip, rearEnd]) {
      b.disc(
        point(at, z > 0 ? z + 0.009 : z - 0.009),
        0.011,
        0.004,
        0.004,
        metal,
      );
      b.tube(point(at, z - 0.01), point(at, z + 0.01), 0.0045, dark);
    }
  }
  b.tube([0, 0, -0.045], [0, 0, 0.045], 0.026, color);
  // Chainstay protector, down-tube guard, cable ports and shock mounts.
  b.loft(
    [
      [0.01, 0.005, -0.001],
      [0.13, 0.064, -0.001],
      [0.3, 0.24, -0.001],
    ],
    [
      [0.032, 0.037],
      [0.037, 0.037],
      [0.033, 0.032],
    ],
    dark,
  );
  b.loft(
    [
      [-0.39, 0.018, 0.078],
      [-0.24, 0.03, 0.075],
      [-0.09, 0.05, 0.052],
    ],
    [
      [0.008, 0.014],
      [0.008, 0.014],
      [0.008, 0.013],
    ],
    dark,
  );
  for (const at of [a.shockUpper, a.shockLower])
    for (const z of [-0.026, 0.026]) {
      b.tube(point(at, z - 0.007), point(at, z + 0.007), 0.013, color);
      b.disc(point(at, z + 0.009), 0.007, 0.002, 0.003, metal);
    }
  b.ring(point(seat, 0.0), 0.02, 0.003, dark);
  if (key.startsWith("scott")) {
    // Enclosed shock access housing; no fictitious exposed mechanism.
    b.loft(
      [
        [0, 0.025, 0],
        [0.025, 0.1, 0],
        [0.09, 0.19, 0],
      ],
      [
        [0.054, 0.043],
        [0.052, 0.041],
        [0.035, 0.03],
      ],
      color,
    );
    b.plate(
      [
        [-0.015, 0.045],
        [0.08, 0.12],
        [0.09, 0.17],
        [0.015, 0.12],
      ],
      0.044,
      0.002,
      dark,
    );
  }
  if (idler) {
    b.disc(point(idler, 0.065), 0.034, 0.012, 0.006, dark, 16);
    b.disc(point(idler, 0.07), 0.016, 0.004, 0.003, metal);
  }
  // External housing kept simple and separate from the load-bearing structure.
  b.path(
    [
      [head[0], head[1] - 0.05, -0.035],
      [0.32, 0.32, -0.038],
      [0.04, 0.05, -0.045],
      [-0.26, 0.04, -0.06],
      [rear[0], rear[1], -0.075],
    ],
    0.0022,
    dark,
    28,
  );
}
