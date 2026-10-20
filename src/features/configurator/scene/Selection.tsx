import { useLayoutEffect, useRef, type ReactNode } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { highlightMeshes } from "./selection-materials";

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
    const release = highlightMeshes(group.current);
    invalidate();
    return () => {
      release();
      invalidate();
    };
  }, [active, identity, invalidate]);
  return <group ref={group}>{children}</group>;
}
