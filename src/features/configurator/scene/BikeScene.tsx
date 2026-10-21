import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useEffect, useMemo } from "react";
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
import { importedMount } from "../model/assemblyV5";
import Selection from "./Selection";
import type { Configuration, Slot, VariantMap } from "../model";
import type { VisualAsset } from "../../catalog/model";
import {
  knownProceduralGenerator,
  type ProceduralGeneratorKey,
} from "../../catalog/model/visual";
import { supabase } from "../../../lib/supabase";

type Point = [number, number, number];
const activeAssets = new Set<string>();
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
}: {
  asset: VisualAsset;
  color: string;
  slot: Slot;
  origin: Point;
  rotation: Point;
  localRotation: Point;
  onSelect: (slot: Slot) => void;
}) {
  const object = useMemo(() => {
    const source = loaded.get(asset.id);
    if (!source) throw new Error("visual_not_prepared");
    const clone = source.clone(true);
    clone.traverse((node) => {
      if (node instanceof THREE.Mesh) node.castShadow = true;
      if (
        node instanceof THREE.Mesh &&
        asset.manifest.paintable_nodes.includes(node.name)
      ) {
        node.material = Array.isArray(node.material)
          ? node.material.map((m) => m.clone())
          : node.material.clone();
        const materials = Array.isArray(node.material)
          ? node.material
          : [node.material];
        materials.forEach((m) => {
          if ("color" in m) (m as THREE.MeshStandardMaterial).color.set(color);
        });
      }
    });
    return clone;
  }, [asset, color]);
  useEffect(
    () => () => {
      object.traverse((node) => {
        if (
          node instanceof THREE.Mesh &&
          asset.manifest.paintable_nodes.includes(node.name)
        ) {
          const materials = Array.isArray(node.material)
            ? node.material
            : [node.material];
          materials.forEach((m) => m.dispose());
        }
      });
    },
    [object, asset],
  );
  return (
    <group
      position={origin}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(slot);
      }}
    >
      <group rotation={localRotation}>
        <primitive object={object} dispose={null} />
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
function StudioLighting() {
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
export default function BikeScene({
  configuration,
  variants,
  onSelect,
  view,
  onUnavailable,
  selectedSlot,
}: {
  configuration: Configuration;
  variants: VariantMap;
  onSelect: (slot: Slot) => void;
  view: string;
  onUnavailable: () => void;
  selectedSlot?: Slot;
}) {
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
  const resolved = resolveAssembly(configuration, variants);
  const frame =
    variants[
      configuration.items.find((i) => i.slot === "frame")?.variantId ?? ""
    ];
  const frameV2 = frame?.visual_assets?.generator_key === "atlas-bike-v2";
  useEffect(() => {
    activeAssets.clear();
    configuration.items.forEach((i) => {
      const id = variants[i.variantId]?.visual_asset_id;
      if (id) activeAssets.add(id);
    });
    return () => activeAssets.clear();
  }, [configuration, variants]);
  return (
    <Canvas
      shadows="percentage"
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [1.4, 0.8, 2.1], fov: 37 }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
          onUnavailable();
        });
      }}
    >
      <color attach="background" args={["#e8e9e1"]} />
      <StudioLighting />
      <StableShadows configuration={configuration} variants={variants} />
      <group
        rotation={[
          0,
          0,
          "settleAngle" in resolved ? Number(resolved.settleAngle) : 0,
        ]}
      >
        <Suspense fallback={null}>
          {configuration.items.map((item) => {
            const variant = variants[item.variantId];
            if (!variant) return null;
            const finish = variant.allowed_finishes.options.find(
              (f) => f.id === item.finishId,
            );
            const color =
              item.customColor ?? finish?.material.color ?? "#57634e";
            const asset = variant.visual_assets;
            const Generator =
              frameV2 &&
              ![
                "atlas-bike-v3",
                "atlas-bike-v4",
                "atlas-bike-v5",
                "atlas-bike-v6",
                "atlas-bike-v7",
              ].includes(asset?.generator_key ?? "")
                ? BikeV2
                : generators[
                    knownProceduralGenerator(asset?.generator_key)
                      ? asset.generator_key
                      : "atlas-bike-v1"
                  ];
            return (
              <Selection
                key={item.slot}
                active={selectedSlot === item.slot}
                identity={`${item.variantId}:${color}:${frame?.id ?? ""}`}
              >
                {asset?.kind === "glb" ? (
                  <Imported
                    key={item.slot}
                    asset={asset}
                    color={color}
                    slot={item.slot}
                    origin={importedMount(item.slot, asset, resolved).position}
                    rotation={
                      importedMount(item.slot, asset, resolved).rotation
                    }
                    localRotation={
                      importedMount(item.slot, asset, resolved).localRotation
                    }
                    onSelect={onSelect}
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
            );
          })}
        </Suspense>
      </group>
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
