import { Component, useLayoutEffect, useRef, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useThree } from "@react-three/fiber";
import * as T from "three";
import {
  BikeAssembly,
  prepareVisual,
  StudioLighting,
} from "../configurator/scene/BikeScene";
import type { Configuration, VariantMap } from "../configurator/model";
import { previewWidth, previewHeight, previewLimit } from "./model";

let queue: Promise<unknown> = Promise.resolve();
class Boundary extends Component<
  { children: ReactNode; fail: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.fail();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
function Capture({
  configuration,
  variants,
  done,
  fail,
}: {
  configuration: Configuration;
  variants: VariantMap;
  done: (blob: Blob) => void;
  fail: () => void;
}) {
  const group = useRef<T.Group>(null);
  const { gl, camera, scene } = useThree();
  useLayoutEffect(() => {
    let active = true,
      frame = 0;
    // Wait for geometry/material effects and the R3F commit, then fit actual installed volume.
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        if (!active || !group.current) return;
        try {
          group.current.updateWorldMatrix(true, true);
          const box = new T.Box3().setFromObject(group.current, true);
          if (box.isEmpty()) return fail();
          const center = box.getCenter(new T.Vector3()),
            direction = new T.Vector3(1.3, 0.65, 2.6).normalize();
          const perspective = camera as T.PerspectiveCamera;
          perspective.position.copy(center.clone().add(direction));
          perspective.lookAt(center);
          perspective.updateMatrixWorld();
          const inverse = perspective.quaternion.clone().invert(),
            vertical = Math.tan(T.MathUtils.degToRad(perspective.fov / 2)),
            horizontal = (vertical * previewWidth) / previewHeight;
          let distance = 0.15;
          for (const x of [box.min.x, box.max.x])
            for (const y of [box.min.y, box.max.y])
              for (const z of [box.min.z, box.max.z]) {
                const p = new T.Vector3(x, y, z)
                  .sub(center)
                  .applyQuaternion(inverse);
                distance = Math.max(
                  distance,
                  p.z + Math.abs(p.x) / (horizontal * 0.83),
                  p.z + Math.abs(p.y) / (vertical * 0.83),
                );
              }
          perspective.position.copy(
            center.clone().addScaledVector(direction, distance),
          );
          perspective.near = 0.001;
          perspective.far = 30;
          perspective.updateProjectionMatrix();
          perspective.updateMatrixWorld();
          gl.render(scene, perspective);
          gl.domElement.toBlob(
            (blob) => {
              if (!active) return;
              if (
                !blob ||
                blob.type !== "image/webp" ||
                blob.size > previewLimit
              )
                fail();
              else done(blob);
            },
            "image/webp",
            0.85,
          );
        } catch {
          fail();
        }
      });
    });
    return () => {
      active = false;
      cancelAnimationFrame(frame);
    };
  }, [configuration, variants, camera, gl, scene, done, fail]);
  return (
    <group ref={group}>
      <BikeAssembly configuration={configuration} variants={variants} />
    </group>
  );
}
export function renderPreview(
  configuration: Configuration,
  variants: VariantMap,
  signal?: AbortSignal,
  transparentBackground = false,
): Promise<Blob | null> {
  if (!configuration.items.length) return Promise.resolve(null);
  const snapshot = structuredClone(configuration);
  const task = queue.then(async () => {
    signal?.throwIfAborted();
    await Promise.all(
      snapshot.items.map((item) => {
        const visual = variants[item.variantId]?.visual_assets;
        if (!visual) throw Error("preview_visual_missing");
        return prepareVisual(visual);
      }),
    );
    signal?.throwIfAborted();
    return new Promise<Blob>((resolve, reject) => {
      const host = document.createElement("div");
      host.setAttribute("aria-hidden", "true");
      host.dataset.bikePreviewRenderer = "";
      Object.assign(host.style, {
        position: "fixed",
        left: "-10000px",
        top: "0",
        width: `${previewWidth}px`,
        height: `${previewHeight}px`,
        pointerEvents: "none",
      });
      document.body.append(host);
      const root = createRoot(host);
      let settled = false;
      const finish = (blob?: Blob) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        signal?.removeEventListener("abort", abort);
        // Cleanup outside the R3F commit and release the temporary WebGL context.
        setTimeout(() => {
          root.unmount();
          host.remove();
          if (blob) resolve(blob);
          else reject(Error("preview_unavailable"));
        }, 0);
      };
      const abort = () => finish();
      const timer = setTimeout(abort, 20000);
      signal?.addEventListener("abort", abort, { once: true });
      root.render(
        <Boundary fail={abort}>
          <Canvas
            frameloop="demand"
            dpr={1}
            gl={{ preserveDrawingBuffer: true, antialias: true }}
            camera={{ fov: 35 }}
            onCreated={({ gl }) => {
              gl.domElement.addEventListener("webglcontextlost", abort, {
                once: true,
              });
            }}
          >
            {!transparentBackground && (
              <color attach="background" args={["#e8e9e1"]} />
            )}
            <StudioLighting />
            <Capture
              configuration={snapshot}
              variants={variants}
              done={(blob) => finish(blob)}
              fail={abort}
            />
          </Canvas>
        </Boundary>,
      );
    });
  });
  queue = task.catch(() => undefined);
  return task;
}
