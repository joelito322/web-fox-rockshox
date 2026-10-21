import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  memo,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import * as THREE from "three";
import { loadGlb, disposeVisual } from "./loadGlb";
import { resolveAssembly } from "../model/assemblyV2";
import BikeV1 from "./generators/BikeV1";
import BikeV2 from "./generators/BikeV2";
import BikeV3 from "./generators/BikeV3";
import BikeV4 from "./generators/BikeV4";
import BikeV5 from "./generators/BikeV5";
import BikeV6 from "./generators/BikeV6";
import BikeV7 from "./generators/BikeV7";
import BikeV8 from "./generators/BikeV8";
import { importedMount } from "../model/assemblyV5";
import Selection from "./Selection";
import { instantiateVisual } from "./imported-instance";
import SuspensionMotion, { type Inspection } from "./SuspensionMotion";
import { createMotionRig } from "./motion-rig";
import type { Configuration, Slot, VariantMap } from "../model";
import type { VisualAsset } from "../../catalog/model";
import {
  knownProceduralGenerator,
  type ProceduralGeneratorKey,
} from "../../catalog/model/visual";
import { supabase } from "../../../lib/supabase";

type Point = [number, number, number];
const activeAssets = new Map<string, number>();
const loaded = new Map<string, THREE.Group>();
const preparing = new Map<string, Promise<void>>();
const generators: Record<ProceduralGeneratorKey, typeof BikeV1> = {
  "atlas-bike-v1": BikeV1,
  "atlas-bike-v2": BikeV2,
  "atlas-bike-v3": BikeV3,
  "atlas-bike-v4": BikeV4,
  "atlas-bike-v5": BikeV5,
  "atlas-bike-v6": BikeV6,
  "atlas-bike-v7": BikeV7,
  "atlas-bike-v8": BikeV8,
};
export async function prepareVisual(asset: VisualAsset) {
  if (asset.kind === "procedural") {
    if (!knownProceduralGenerator(asset.generator_key))
      throw new Error("unknown_generator");
    if (
      [
        "atlas-bike-v3",
        "atlas-bike-v4",
        "atlas-bike-v5",
        "atlas-bike-v6",
        "atlas-bike-v7",
        "atlas-bike-v8",
      ].includes(asset.generator_key ?? "") &&
      !asset.manifest.parameters.profile_key
    )
      throw new Error("missing_visual_profile");
    return;
  }
  if (loaded.has(asset.id)) return;
  if (preparing.has(asset.id)) return preparing.get(asset.id);
  if (!asset.storage_path || !supabase) throw new Error("missing_visual");
  const { data } = supabase.storage
    .from("models")
    .getPublicUrl(asset.storage_path);
  const preparation = loadGlb(data.publicUrl)
    .then((scene) => {
      if (loaded.size >= 32) {
        const candidate = [...loaded.entries()].find(
          ([key]) => !activeAssets.has(key),
        );
        if (candidate) {
          const [key, value] = candidate;
          disposeVisual(value);
          loaded.delete(key);
        }
      }
      loaded.set(asset.id, scene);
    })
    .finally(() => preparing.delete(asset.id));
  preparing.set(asset.id, preparation);
  return preparation;
}
function Imported({
  asset,
  color,
  slot,
  origin,
  rotation,
  localRotation,
  onSelect,
  inspection,
}: {
  inspection?: Inspection;
  asset: VisualAsset;
  color: string;
  slot: Slot;
  origin: Point;
  rotation: Point;
  localRotation: Point;
  onSelect: (slot: Slot) => void;
}) {
  const instance = useMemo(() => {
    const source = loaded.get(asset.id);
    if (!source) throw new Error("visual_not_prepared");
    return instantiateVisual(source, asset.manifest.paintable_nodes);
  }, [asset, !!inspection]);
  const rig = useMemo(
    () =>
      inspection && ["frame", "fork", "shock"].includes(slot)
        ? createMotionRig(instance.object, slot, inspection.definition)
        : null,
    [instance, inspection?.definition, slot],
  );
  useEffect(() => () => rig?.dispose(), [rig]);
  const outer = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    if (!outer.current || !rig) return;
    outer.current.userData.applySuspension = (
      pose: Parameters<typeof rig.apply>[0],
    ) => {
      rig.apply(pose);
      if (slot === "shock") {
        outer.current!.position.fromArray(pose.shockUpper);
        outer.current!.rotation.z = Math.atan2(
          pose.shockLower[0] - pose.shockUpper[0],
          pose.shockUpper[1] - pose.shockLower[1],
        );
      }
    };
    return () => {
      if (outer.current) delete outer.current.userData.applySuspension;
    };
  }, [rig, slot]);
  const invalidate = useThree((state) => state.invalidate);
  useLayoutEffect(() => {
    instance.paint(color);
    invalidate();
  }, [instance, color, invalidate]);
  useEffect(() => () => instance.dispose(), [instance]);
  return (
    <group
      ref={outer}
      position={origin}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(slot);
      }}
    >
      <group rotation={localRotation}>
        <primitive object={rig?.object ?? instance.object} dispose={null} />
      </group>
    </group>
  );
}
const cameraFit = (width: number, height: number) =>
  Math.max(1, 1.45 / (width / Math.max(1, height)));
function SceneControls() {
  const size = useThree((state) => state.size);
  return (
    <OrbitControls
      makeDefault
      target={[0.17, 0.15, 0]}
      minDistance={1.2}
      maxDistance={4.5 * cameraFit(size.width, size.height)}
      maxPolarAngle={Math.PI * 0.85}
      enableDamping
    />
  );
}
function View({ view }: { view: string }) {
  const { camera, invalidate, size, setDpr } = useThree();
  useEffect(() => {
    setDpr(size.width < 640 ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));
  }, [setDpr, size.width]);
  useEffect(() => {
    const positions: Record<string, Point> = {
      lateral: [0.2, 0.25, 2.6],
      frontal: [3.2, 0.45, 0],
      // The longitudinal footprint needs more vertical room when viewed from above.
      superior: [0.17, 3.6, 0.01],
      perspectiva: [1.4, 0.8, 2.1],
    };
    const target = new THREE.Vector3(0.17, 0.15, 0);
    // Preserve the desktop view while fitting the bicycle in narrower viewports.
    const fit = cameraFit(size.width, size.height);
    camera.position.copy(
      new THREE.Vector3(...(positions[view] ?? positions.perspectiva))
        .sub(target)
        .multiplyScalar(fit)
        .add(target),
    );
    camera.lookAt(0.17, 0.15, 0);
    invalidate();
  }, [view, camera, invalidate, size.width, size.height]);
  return null;
}
// Geometry and lights are static during camera orbit; refresh shadows on scene changes.
function StableShadows({
  configuration,
  variants,
}: {
  configuration: Configuration;
  variants: VariantMap;
}) {
  const { gl, invalidate, size } = useThree();
  const compact = size.width < 640;
  useEffect(() => {
    const previous = gl.shadowMap.autoUpdate;
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    invalidate();
    return () => {
      gl.shadowMap.autoUpdate = previous;
    };
  }, [gl, invalidate, configuration, variants, compact]);
  return null;
}
export function StudioLighting() {
  const compact = useThree((state) => state.size.width < 640);
  return (
    <>
      <ambientLight intensity={1.6} />
      <directionalLight
        position={[2, 4, 3]}
        intensity={3}
        castShadow
        shadow-mapSize={compact ? [512, 512] : [1024, 1024]}
      />
      <directionalLight position={[-3, 1, -2]} intensity={2} />
    </>
  );
}
export function BikeAssembly({
  configuration,
  variants,
  onSelect = () => {},
  selectedSlot,
  assembly,
  inspection,
}: {
  configuration: Configuration;
  variants: VariantMap;
  onSelect?: (slot: Slot) => void;
  selectedSlot?: Slot;
  assembly?: ReturnType<typeof resolveAssembly>;
  inspection?: Inspection;
}) {
  const motionRoot = useRef<THREE.Group>(null);
  const resolved = useMemo(
    () => assembly ?? resolveAssembly(configuration, variants),
    [assembly, configuration.items, variants],
  );
  if (
    configuration.items.some((item) => {
      const asset = variants[item.variantId]?.visual_assets;
      return (
        !asset ||
        !asset.published ||
        (asset.kind === "procedural" &&
          !knownProceduralGenerator(asset.generator_key))
      );
    })
  )
    throw new Error("missing_visual");
  const frame =
    variants[
      configuration.items.find((i) => i.slot === "frame")?.variantId ?? ""
    ];
  const frameV2 = frame?.visual_assets?.generator_key === "atlas-bike-v2";
  useEffect(() => {
    const ids = configuration.items
      .map((i) => variants[i.variantId]?.visual_asset_id)
      .filter((id): id is string => !!id);
    ids.forEach((id) => activeAssets.set(id, (activeAssets.get(id) ?? 0) + 1));
    return () =>
      ids.forEach((id) => {
        const count = (activeAssets.get(id) ?? 1) - 1;
        if (count) activeAssets.set(id, count);
        else activeAssets.delete(id);
      });
  }, [configuration, variants]);
  return (
    <group
      ref={motionRoot}
      name="motion_bicycle"
      rotation={[
        0,
        0,
        "settleAngle" in resolved ? Number(resolved.settleAngle) : 0,
      ]}
    >
      {inspection && (
        <SuspensionMotion root={motionRoot} inspection={inspection} />
      )}
      <Suspense fallback={null}>
        {configuration.items.map((item) => {
          const variant = variants[item.variantId];
          if (!variant) return null;
          const finish = variant.allowed_finishes.options.find(
            (f) => f.id === item.finishId,
          );
          const color = item.customColor ?? finish?.material.color ?? "#57634e";
          const asset = variant.visual_assets;
          const Generator =
            frameV2 &&
            ![
              "atlas-bike-v3",
              "atlas-bike-v4",
              "atlas-bike-v5",
              "atlas-bike-v6",
              "atlas-bike-v7",
              "atlas-bike-v8",
            ].includes(asset?.generator_key ?? "")
              ? BikeV2
              : generators[
                  knownProceduralGenerator(asset?.generator_key)
                    ? asset.generator_key
                    : "atlas-bike-v1"
                ];
          const mount =
            asset?.kind === "glb"
              ? importedMount(item.slot, asset, resolved)
              : undefined;
          return (
            <group key={item.slot} userData={{ motionSlot: item.slot }}>
              <Selection
                key={item.slot}
                active={selectedSlot === item.slot}
                identity={`${item.variantId}:${color}:${frame?.id ?? ""}:${inspection ? "motion" : "rest"}`}
              >
                {asset?.kind === "glb" ? (
                  <Imported
                    key={item.slot}
                    asset={asset}
                    color={color}
                    slot={item.slot}
                    origin={mount!.position}
                    rotation={mount!.rotation}
                    localRotation={mount!.localRotation}
                    onSelect={onSelect}
                    inspection={inspection}
                  />
                ) : (
                  <Generator
                    key={item.slot}
                    slot={item.slot}
                    color={color}
                    configuration={configuration}
                    resolved={resolved}
                    variants={variants}
                    onSelect={onSelect}
                  />
                )}
              </Selection>
            </group>
          );
        })}
      </Suspense>
    </group>
  );
}

function ContextLoss({ onUnavailable }: { onUnavailable: () => void }) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const element = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      onUnavailable();
    };
    element?.addEventListener("webglcontextlost", lost);
    return () => element?.removeEventListener("webglcontextlost", lost);
  }, [gl, onUnavailable]);
  return null;
}

function BikeScene({
  configuration,
  variants,
  onSelect,
  view,
  onUnavailable,
  selectedSlot,
  inspection,
}: {
  inspection?: Inspection;
  configuration: Configuration;
  variants: VariantMap;
  onSelect: (slot: Slot) => void;
  view: string;
  onUnavailable: () => void;
  selectedSlot?: Slot;
}) {
  const resolved = useMemo(
    () => resolveAssembly(configuration, variants),
    [configuration.items, variants],
  );
  return (
    <Canvas
      shadows="percentage"
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [1.4, 0.8, 2.1], fov: 37 }}
    >
      <color attach="background" args={["#e8e9e1"]} />
      <ContextLoss onUnavailable={onUnavailable} />
      <StudioLighting />
      <StableShadows configuration={configuration} variants={variants} />
      <BikeAssembly
        configuration={configuration}
        variants={variants}
        onSelect={onSelect}
        selectedSlot={selectedSlot}
        assembly={resolved}
        inspection={inspection}
      />
      <mesh
        position={[0, resolved.ground, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[200, 200]} />
        <shadowMaterial transparent opacity={0.15} />
      </mesh>
      <SceneControls />
      <View view={view} />
    </Canvas>
  );
}

// Search, save status and panel state do not change the mounted scene.
export default memo(BikeScene);
