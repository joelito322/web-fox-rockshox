// atlas-bike-v2: explicit DH frame layout, dual crowns, direct stem and idler chain route.
import { useMemo } from "react";
import * as THREE from "three";
import BikeV1, { Tube, Ring, Coil } from "./BikeV1";
import { assemblyV2 } from "../../model/assemblyV2";
import type { Point } from "../../model/assembly";
import type { Configuration, Slot, VariantMap } from "../../model";

type Props = {
  slot: Slot;
  color: string;
  configuration: Configuration;
  variants: VariantMap;
  onSelect: (slot: Slot) => void;
};
function BentTube({
  points,
  radius,
  color,
}: {
  points: Point[];
  radius: number;
  color: string;
}) {
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
    [points],
  );
  return (
    <mesh castShadow>
      <tubeGeometry args={[curve, 24, radius, 10, false]} />
      <meshStandardMaterial color={color} metalness={0.45} roughness={0.38} />
    </mesh>
  );
}
export default function BikeV2(props: Props) {
  const { slot, color, configuration, variants, onSelect } = props;
  const get = (s: Slot) =>
    variants[configuration.items.find((i) => i.slot === s)?.variantId ?? ""];
  const variant = get(slot);
  if (!variant) return null;
  const resolved = assemblyV2(configuration, variants);
  const {
    rear,
    front,
    seat,
    head,
    lower,
    bar,
    pivot,
    idler,
    upperCrown,
    shockUpper,
    shockLower,
  } = resolved;
  const dark = "#272b29",
    silver = "#a9ada9";
  const atZ = (p: Point, z: number): Point => [p[0], p[1], z];
  let node: React.ReactNode;
  if (slot === "frame" && idler) {
    node = (
      <>
        <BentTube
          points={[
            [0, 0, 0],
            [0.12, 0.035, 0],
            [lower[0] * 0.7, lower[1] * 0.58, 0],
            lower,
          ]}
          radius={0.031}
          color={color}
        />
        <Tube a={seat} b={head} r={0.024} color={color} />
        <Tube a={head} b={lower} r={0.029} color={color} />
        {[-0.04, 0.04].map((z) => (
          <group key={z}>
            <Tube
              a={[0, 0, z]}
              b={[seat[0], seat[1], z]}
              r={0.019}
              color={color}
            />
            <Tube a={atZ(pivot, z)} b={atZ(rear, z)} r={0.018} color={color} />
            <Tube
              a={[0.025, 0.045, z]}
              b={atZ(rear, z)}
              r={0.015}
              color={color}
            />
            <Tube
              a={atZ(pivot, z)}
              b={[pivot[0] + 0.075, pivot[1] + 0.015, z]}
              r={0.023}
              color={dark}
            />
            <Tube
              a={[pivot[0] + 0.075, pivot[1] + 0.015, z]}
              b={[0.025, 0.045, z]}
              r={0.015}
              color={dark}
            />
            <Ring
              at={atZ(pivot, z * 1.3)}
              r={0.012}
              tube={0.004}
              color={silver}
            />
          </group>
        ))}
        <Tube
          a={[idler[0], idler[1], 0]}
          b={atZ(idler, 0.09)}
          r={0.009}
          color={silver}
        />
        <Ring at={atZ(idler, 0.09)} r={0.032} tube={0.009} color={dark} />
        <Ring at={atZ(idler, 0.095)} r={0.012} tube={0.004} color={silver} />
      </>
    );
  } else if (slot === "fork" && variant.specs.crown_type === "dual") {
    const middle: Point = [
      front[0] + (lower[0] - front[0]) * 0.48,
      front[1] + (lower[1] - front[1]) * 0.48,
      0,
    ];
    const diameter = variant.specs.stanchion_diameter_mm;
    const stanchionRadius =
      typeof diameter === "number" ? diameter / 2000 : 0.02;
    node = (
      <>
        {[-0.055, 0.055].map((z) => (
          <group key={z}>
            <Tube
              a={atZ(upperCrown, z)}
              b={atZ(middle, z)}
              r={stanchionRadius}
              color="#bb9753"
            />
            <Tube
              a={atZ(middle, z)}
              b={atZ(front, z)}
              r={stanchionRadius + 0.008}
              color={color}
            />
          </group>
        ))}
        {[lower, upperCrown].map((p, i) => (
          <Tube
            key={i}
            a={atZ(p, -0.075)}
            b={atZ(p, 0.075)}
            r={0.019}
            color={dark}
          />
        ))}
        <BentTube
          points={[
            atZ(middle, -0.055),
            [middle[0] - 0.025, middle[1] + 0.04, 0],
            atZ(middle, 0.055),
          ]}
          radius={0.014}
          color={color}
        />
        <Tube
          a={atZ(front, -0.075)}
          b={atZ(front, 0.075)}
          r={0.01}
          color={silver}
        />
      </>
    );
  } else if (slot === "stem" && variant.specs.mount_type === "direct_mount") {
    node = (
      <>
        {[-0.026, 0.026].map((z) => (
          <Tube
            key={z}
            a={atZ(upperCrown, z)}
            b={atZ(bar, z)}
            r={0.012}
            color={color}
          />
        ))}
        <Tube a={atZ(bar, -0.035)} b={atZ(bar, 0.035)} r={0.02} color={color} />
      </>
    );
  } else if (slot === "shock") {
    const bodyEnd: Point = shockUpper.map(
      (v, i) => v * 0.3 + shockLower[i] * 0.7,
    ) as Point;
    node = (
      <>
        <Tube a={shockUpper} b={shockLower} r={0.01} color={silver} />
        {variant.specs.spring_type === "coil" ? (
          <Coil a={shockUpper} b={shockLower} color={color} />
        ) : (
          <Tube a={shockUpper} b={bodyEnd} r={0.026} color={color} />
        )}
        {[shockUpper, shockLower].map((p, i) => (
          <Ring key={i} at={p} r={0.009} tube={0.004} color={dark} />
        ))}
        <Tube
          a={[shockUpper[0] + 0.035, shockUpper[1] - 0.005, 0]}
          b={[shockUpper[0] + 0.035, shockUpper[1] - 0.075, 0]}
          r={0.015}
          color={dark}
        />
      </>
    );
  } else if (slot.endsWith("_hub")) {
    const at = slot === "front_hub" ? front : rear;
    const width =
      typeof variant.specs.axle_width_mm === "number"
        ? variant.specs.axle_width_mm / 1000
        : 0.11;
    node = (
      <Tube
        a={atZ(at, -width / 2)}
        b={atZ(at, width / 2)}
        r={0.02}
        color={color}
      />
    );
  } else if (slot === "bottom_bracket") {
    const width =
      typeof variant.specs.shell_width_mm === "number"
        ? variant.specs.shell_width_mm / 1000
        : 0.107;
    node = (
      <Tube
        a={[0, 0, -width / 2]}
        b={[0, 0, width / 2]}
        r={0.029}
        color={color}
      />
    );
  } else if (slot === "chain" && idler) {
    const crank = get("crankset");
    const teeth =
      (crank?.specs.chainring as { teeth?: number } | undefined)?.teeth ?? 34;
    const chainRadius =
      (Math.min(120, Math.max(10, teeth)) * 0.0127) / (2 * Math.PI);
    const cogTeeth = get("cassette")?.specs.sprocket_teeth;
    const smallest =
      Array.isArray(cogTeeth) && typeof cogTeeth[0] === "number"
        ? cogTeeth[0]
        : 11;
    const cogRadius = (smallest * 0.0127) / (2 * Math.PI);
    const route: Point[] = [
      [rear[0], rear[1] + cogRadius, 0.09],
      [idler[0] - 0.02, idler[1] + 0.027, 0.09],
      [idler[0] + 0.03, idler[1] + 0.005, 0.09],
      [0.025, chainRadius * 0.92, 0.09],
    ];
    node = (
      <>
        {route.slice(1).map((p, i) => (
          <Tube key={i} a={route[i]} b={p} r={0.003} color={silver} />
        ))}
        <Tube
          a={[0, -chainRadius, 0.09]}
          b={[rear[0] + 0.08, rear[1] - 0.12, 0.09]}
          r={0.003}
          color={silver}
        />
        <Tube
          a={[rear[0] + 0.08, rear[1] - 0.12, 0.09]}
          b={[rear[0], rear[1] - cogRadius, 0.09]}
          r={0.003}
          color={silver}
        />
      </>
    );
  } else {
    return <BikeV1 {...props} resolved={resolved} />;
  }
  return (
    <group
      onClick={(event) => {
        event.stopPropagation();
        onSelect(slot);
      }}
    >
      {node}
    </group>
  );
}
