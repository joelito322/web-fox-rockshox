// Procedural resource atlas-bike-v1. Once published, physical changes require a new generator key.
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { assembly, type Assembly } from "../../model/assembly";
import type { Configuration, Slot, VariantMap } from "../../model";
type Point = [number, number, number];
export function Tube({
  a,
  b,
  r = 0.022,
  color = "#5b6554",
}: {
  a: Point;
  b: Point;
  r?: number;
  color?: string;
}) {
  const direction = new THREE.Vector3(...b).sub(new THREE.Vector3(...a));
  const center = new THREE.Vector3(...a)
    .add(new THREE.Vector3(...b))
    .multiplyScalar(0.5);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize(),
  );
  return (
    <mesh position={center} quaternion={quaternion} castShadow>
      <cylinderGeometry args={[r, r, direction.length(), 12]} />
      <meshStandardMaterial color={color} metalness={0.45} roughness={0.38} />
    </mesh>
  );
}
export function Ring({
  at,
  r,
  tube,
  color,
  metalness = 0.3,
}: {
  at: Point;
  r: number;
  tube: number;
  color: string;
  metalness?: number;
}) {
  return (
    <mesh position={at} castShadow>
      <torusGeometry args={[r, tube, 10, 56]} />
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={0.5}
      />
    </mesh>
  );
}
function WheelSpokes({
  at,
  r,
  count = 28,
}: {
  at: Point;
  r: number;
  count?: number;
}) {
  const geometry = useMemo(() => {
    const vertices: number[] = [];
    for (let i = 0; i < count; i++) {
      const a = (i * Math.PI * 2) / count;
      vertices.push(
        0,
        0,
        i % 2 ? 0.025 : -0.025,
        Math.cos(a + 0.17) * r,
        Math.sin(a + 0.17) * r,
        0,
      );
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    return g;
  }, [r, count]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <lineSegments position={at} geometry={geometry}>
      <lineBasicMaterial color="#94988c" />
    </lineSegments>
  );
}
function Tire({
  at,
  r,
  width = 0.058,
}: {
  at: Point;
  r: number;
  width?: number;
}) {
  const geometry = useMemo(
    () => new THREE.BoxGeometry(0.017, 0.014, 0.046),
    [],
  );
  const matrices = useMemo(
    () =>
      Array.from({ length: 56 }, (_, i) => {
        const a = (i * Math.PI) / 28;
        return new THREE.Matrix4().compose(
          new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0),
          new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 0, 1),
            a - Math.PI / 2,
          ),
          new THREE.Vector3(1, 1, 1),
        );
      }),
    [r],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group position={at}>
      <Ring
        at={[0, 0, 0]}
        r={r - width / 2}
        tube={width / 2}
        color="#191b18"
        metalness={0}
      />
      <instancedMesh
        args={[geometry, undefined, 56]}
        ref={(mesh) => {
          if (mesh) {
            matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
            mesh.instanceMatrix.needsUpdate = true;
          }
        }}
      >
        <meshStandardMaterial color="#232720" roughness={0.95} />
      </instancedMesh>
    </group>
  );
}
export function Coil({ a, b, color }: { a: Point; b: Point; color: string }) {
  const direction = new THREE.Vector3(...b).sub(new THREE.Vector3(...a)),
    length = direction.length();
  const center = new THREE.Vector3(...a)
    .add(new THREE.Vector3(...b))
    .multiplyScalar(0.5);
  const rotation = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize(),
  );
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        Array.from({ length: 129 }, (_, i) => {
          const t = i / 128,
            angle = t * Math.PI * 16;
          return new THREE.Vector3(
            Math.cos(angle) * 0.027,
            (t - 0.5) * length * 0.8,
            Math.sin(angle) * 0.027,
          );
        }),
      ),
    [length],
  );
  return (
    <mesh position={center} quaternion={rotation} castShadow>
      <tubeGeometry args={[curve, 128, 0.0035, 6, false]} />
      <meshStandardMaterial color={color} metalness={0.55} roughness={0.35} />
    </mesh>
  );
}
export default function BikeV1({
  slot,
  color,
  variants,
  configuration,
  onSelect,
  resolved: suppliedAssembly,
}: {
  slot: Slot;
  color: string;
  variants: VariantMap;
  configuration: Configuration;
  onSelect: (slot: Slot) => void;
  resolved?: Assembly;
}) {
  const item = configuration.items.find((i) => i.slot === slot)!;
  const variant = variants[item.variantId];
  if (!variant) return null;
  const resolved = suppliedAssembly ?? assembly(configuration, variants);
  const { rear, front, seat, head, lower, saddle, bar } = resolved;
  const middle: Point = [
    front[0] + (lower[0] - front[0]) * 0.48,
    front[1] + (lower[1] - front[1]) * 0.48,
    0,
  ];
  const radius = resolved.radius(slot.startsWith("front") ? "front" : "rear");
  const at = slot.startsWith("front") ? front : rear;
  const getVariant = (position: Slot) =>
    variants[
      configuration.items.find((i) => i.slot === position)?.variantId ?? ""
    ];
  const length = (value: unknown, fallback: number) =>
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0 &&
    value <= 2000
      ? value / 1000
      : fallback;
  const crank = getVariant("crankset");
  const crankLength = length(crank?.specs.crank_length_mm, 0.17);
  const crankX = Math.sin(Math.PI / 9) * crankLength,
    crankY = Math.cos(Math.PI / 9) * crankLength;
  const chainring = crank?.specs.chainring as { teeth?: number } | undefined;
  const chainringRadius =
    typeof chainring?.teeth === "number"
      ? (Math.min(120, Math.max(10, chainring.teeth)) * 0.0127) / (2 * Math.PI)
      : 0.065;
  const rimBSD = variant.specs.wheel_bsd_mm;
  const rimRadius = typeof rimBSD === "number" ? rimBSD / 2000 : radius - 0.042;
  const spokeCount =
    typeof variant.specs.spoke_hole_count === "number"
      ? Math.max(8, Math.min(64, Math.floor(variant.specs.spoke_hole_count)))
      : 28;
  const teeth = Array.isArray(variant.specs.sprocket_teeth)
    ? variant.specs.sprocket_teeth.filter(
        (t): t is number => typeof t === "number" && t > 0 && t <= 100,
      )
    : [];
  const sprockets = teeth.length
    ? [...teeth].reverse().map((t) => (t * 0.0127) / (2 * Math.PI))
    : Array.from(
        {
          length:
            typeof variant.specs.speed_count === "number"
              ? Math.min(24, Math.max(1, Math.floor(variant.specs.speed_count)))
              : 6,
        },
        (_, i) => Math.max(0.02, 0.07 - i * 0.004),
      );
  const halfBar = length(getVariant("handlebar")?.specs.width_mm, 0.76) / 2;

  const dark = "#262e24",
    silver = "#adb1a2";
  let node: React.ReactNode = null;
  if (slot === "frame")
    node = (
      <>
        <Tube a={[0, 0, 0]} b={seat} r={0.025} color={color} />
        <Tube a={seat} b={head} r={0.025} color={color} />
        <Tube a={[0, 0, 0]} b={lower} r={0.033} color={color} />
        <Tube a={head} b={lower} r={0.029} color={color} />
        {[-0.047, 0.047].map((z) => (
          <group key={z}>
            <Tube
              a={[0, 0, z]}
              b={[rear[0], rear[1], z]}
              r={0.014}
              color={color}
            />
            <Tube
              a={[seat[0] * 0.7, seat[1] * 0.7, z]}
              b={[rear[0], rear[1], z]}
              r={0.014}
              color={color}
            />
          </group>
        ))}
      </>
    );
  else if (slot === "fork")
    node = (
      <>
        {[-0.046, 0.046].map((z) => (
          <group key={z}>
            <Tube
              a={[lower[0], lower[1], z]}
              b={[middle[0], middle[1], z]}
              r={0.016}
              color="#b99b61"
            />
            <Tube
              a={[middle[0], middle[1], z]}
              b={[front[0], front[1], z]}
              r={0.023}
              color={color}
            />
          </group>
        ))}
        <Tube
          a={[middle[0], middle[1] + 0.015, -0.046]}
          b={[middle[0], middle[1] + 0.015, 0.046]}
          r={0.022}
          color={color}
        />
        {variant.specs.crown_type === "dual" && (
          <Tube
            a={[head[0], head[1] + 0.04, -0.05]}
            b={[head[0], head[1] + 0.04, 0.05]}
            r={0.02}
            color={dark}
          />
        )}
      </>
    );
  else if (slot.endsWith("_rim"))
    node = (
      <>
        <Ring at={at} r={rimRadius} tube={0.009} color={color} />
        <WheelSpokes at={at} r={rimRadius} count={spokeCount} />
      </>
    );
  else if (slot.endsWith("_tire"))
    node = (
      <Tire
        at={at}
        r={radius}
        width={length(variant.specs.tire_width_mm, 0.058)}
      />
    );
  else if (slot.endsWith("_hub"))
    node = (
      <Tube
        a={[at[0], at[1], -0.06]}
        b={[at[0], at[1], 0.06]}
        r={0.02}
        color={color}
      />
    );
  else if (slot.endsWith("_rotor"))
    node = (
      <Ring
        at={[at[0], at[1], 0.055]}
        r={(Number(variant.specs.rotor_diameter_mm) || 200) / 2000}
        tube={0.006}
        color={silver}
      />
    );
  else if (slot.endsWith("_brake"))
    node = (
      <>
        <mesh position={[at[0] - 0.04, at[1] + 0.07, 0.065]} castShadow>
          <boxGeometry
            args={[
              variant.specs.piston_count === 2 ? 0.032 : 0.04,
              variant.specs.piston_count === 2 ? 0.04 : 0.062,
              0.027,
            ]}
          />
          <meshStandardMaterial color={color} />
        </mesh>
        {(variant.specs.piston_count === 2 ? [0] : [-0.015, 0.015]).map((y) => (
          <mesh
            key={y}
            position={[at[0] - 0.04, at[1] + 0.07 + y, 0.081]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.008, 0.008, 0.004, 12]} />
            <meshStandardMaterial color={dark} metalness={0.5} />
          </mesh>
        ))}
        <Tube
          a={[bar[0], bar[1], slot === "front_brake" ? -0.25 : 0.25]}
          b={[
            bar[0] + 0.04,
            bar[1] - 0.025,
            slot === "front_brake" ? -0.3 : 0.3,
          ]}
          r={0.007}
          color={dark}
        />
      </>
    );
  else if (slot === "shock")
    node = (
      <>
        <Tube
          a={resolved.shockUpper}
          b={resolved.shockLower}
          r={0.015}
          color={silver}
        />
        {variant.specs.spring_type === "coil" ? (
          <Coil a={resolved.shockUpper} b={resolved.shockLower} color={color} />
        ) : (
          <Tube
            a={resolved.shockUpper}
            b={[
              resolved.shockUpper[0] * 0.25 + resolved.shockLower[0] * 0.75,
              resolved.shockUpper[1] * 0.25 + resolved.shockLower[1] * 0.75,
              0,
            ]}
            r={0.027}
            color={color}
          />
        )}
      </>
    );
  else if (slot === "bottom_bracket")
    node = (
      <Tube a={[0, 0, -0.055]} b={[0, 0, 0.055]} r={0.029} color={color} />
    );
  else if (slot === "crankset")
    node = (
      <>
        <Ring at={[0, 0, 0.08]} r={chainringRadius} tube={0.012} color={dark} />
        <Tube
          a={[0, 0, 0.085]}
          b={[crankX, -crankY, 0.085]}
          r={0.012}
          color={color}
        />
        <Tube
          a={[0, 0, -0.085]}
          b={[-crankX, crankY, -0.085]}
          r={0.012}
          color={color}
        />
      </>
    );
  else if (slot === "pedals")
    node = (
      <>
        {[1, -1].map((i) => (
          <mesh
            key={i}
            position={[i * crankX, -i * crankY, i * 0.12]}
            castShadow
          >
            <boxGeometry
              args={[
                length(variant.specs.platform_length_mm, 0.09),
                length(variant.specs.platform_thickness_mm, 0.018),
                length(variant.specs.platform_width_mm, 0.08),
              ]}
            />
            <meshStandardMaterial color={color} />
          </mesh>
        ))}
      </>
    );
  else if (slot === "cassette")
    node = (
      <>
        {sprockets.map((r, i) => (
          <Ring
            key={i}
            at={[rear[0], rear[1], 0.055 + i * 0.0033]}
            r={r}
            tube={0.004}
            color={silver}
          />
        ))}
      </>
    );
  else if (slot === "chain")
    node = (
      <>
        <Tube
          a={[rear[0], rear[1] + 0.045, 0.09]}
          b={[0, chainringRadius, 0.09]}
          r={0.003}
          color={silver}
        />
        <Tube
          a={[rear[0] + 0.04, rear[1] - 0.055, 0.09]}
          b={[0, -chainringRadius, 0.09]}
          r={0.003}
          color={silver}
        />
      </>
    );
  else if (slot === "rear_derailleur")
    node = (
      <>
        <Tube
          a={[rear[0] + 0.01, rear[1], 0.095]}
          b={[rear[0] + 0.08, rear[1] - 0.12, 0.095]}
          r={0.015}
          color={color}
        />
        <Ring
          at={[rear[0] + 0.08, rear[1] - 0.12, 0.095]}
          r={0.015}
          tube={0.004}
          color={dark}
        />
        <mesh position={[bar[0], bar[1] - 0.025, 0.24]}>
          <boxGeometry args={[0.045, 0.025, 0.03]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </>
    );
  else if (slot === "seatpost")
    node = (
      <Tube
        a={seat}
        b={[saddle[0], saddle[1] - 0.01, saddle[2]]}
        r={0.014}
        color={color}
      />
    );
  else if (slot === "saddle")
    node = (
      <mesh
        position={saddle}
        scale={[
          length(variant.specs.length_mm, 0.26) / 2,
          0.025,
          length(variant.specs.width_mm, 0.145) / 2,
        ]}
        castShadow
      >
        <sphereGeometry args={[1, 20, 10]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    );
  else if (slot === "stem")
    node = <Tube a={head} b={bar} r={0.023} color={color} />;
  else if (slot === "handlebar")
    node = (
      <>
        <Tube a={[bar[0], bar[1], -halfBar]} b={bar} r={0.009} color={color} />
        <Tube a={bar} b={[bar[0], bar[1], halfBar]} r={0.009} color={color} />
      </>
    );
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
