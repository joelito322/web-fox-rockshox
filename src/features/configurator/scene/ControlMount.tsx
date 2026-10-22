import { useLayoutEffect, useRef, type ReactNode } from "react";
import * as T from "three";
import type { SelectedVariant } from "../../catalog/model";
import type { Point } from "../model/assembly";
import { leverMount, mountLeverGeometry, shifterMount } from "./brake-lever-mount";

export function ControlMount({ children, bar, handlebar, front, identity, shifter = false }: {
  children: ReactNode; bar: Point; handlebar?: SelectedVariant; front: boolean; identity: string; shifter?: boolean;
}) {
  const root = useRef<T.Group>(null);
  useLayoutEffect(() => {
    if (!handlebar || !root.current) return;
    const mount = shifter ? shifterMount(bar, handlebar) : leverMount(bar, handlebar, front);
    const owned: { mesh: T.Mesh; source: T.BufferGeometry; mounted: T.BufferGeometry }[] = [];
    root.current.traverse(object => {
      if (!(object instanceof T.Mesh)) return;
      const source = object.geometry, mounted = mountLeverGeometry(source, mount, shifter);
      object.geometry = mounted;
      owned.push({ mesh: object, source, mounted });
    });
    return () => owned.forEach(({ mesh, source, mounted }) => {
      if (mesh.geometry === mounted) mesh.geometry = source;
      mounted.dispose();
    });
  }, [bar, handlebar, front, identity, shifter]);
  return <group ref={root}>{children}</group>;
}
