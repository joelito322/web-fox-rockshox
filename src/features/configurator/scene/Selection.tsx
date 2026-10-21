import { useLayoutEffect, useRef, type ReactNode } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { highlightMeshes, selectionIntensity } from "./selection-materials";

export default function Selection({
  active,
  identity,
  children,
}: {
  active: boolean;
  identity: string;
  children: ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  const invalidate = useThree((state) => state.invalidate);
  useLayoutEffect(() => {
    if (!active || !group.current) return;
    const highlight = highlightMeshes(group.current);
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const start = performance.now();
    let timer: number | undefined;
    const draw = () => {
      highlight.setIntensity(
        preference.matches
          ? 0.23
          : selectionIntensity((performance.now() - start) / 1000),
      );
      invalidate();
    };
    const update = () => {
      window.clearInterval(timer);
      timer = undefined;
      if (document.hidden) return;
      draw();
      // Emission only: do not rebuild meshes or shadows for the pulse.
      if (!preference.matches) timer = window.setInterval(draw, 50);
    };
    document.addEventListener("visibilitychange", update);
    preference.addEventListener("change", update);
    update();
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
      preference.removeEventListener("change", update);
      highlight();
      invalidate();
    };
  }, [active, identity, invalidate]);
  return <group ref={group}>{children}</group>;
}
