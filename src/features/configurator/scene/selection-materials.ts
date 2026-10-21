import * as THREE from "three";

// Give selected meshes distinct material identities so renderer uniform caching
// cannot carry their highlight into an unselected mesh sharing the source material.
export function highlightMeshes(group: THREE.Group) {
  const release: (() => void)[] = [];
  const highlighted: THREE.MeshStandardMaterial[] = [];
  let released = false;
  group.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    const original = node.material;
    const sources = Array.isArray(original) ? original : [original];
    const copies = sources.map((source) => {
      const copy = source.clone();
      if (copy instanceof THREE.MeshStandardMaterial) {
        copy.emissive.set("#9bb566");
        copy.emissiveIntensity = 0.23;
        highlighted.push(copy);
      }
      return copy;
    });
    node.material = Array.isArray(original) ? copies : copies[0];
    const before = node.onBeforeRender;
    node.onBeforeRender = function (...args) {
      before.apply(this, args);
      // React keeps updating the source material when the rider paints a piece.
      sources.forEach((source, index) => {
        const copy = copies[index];
        if (
          source instanceof THREE.MeshStandardMaterial &&
          copy instanceof THREE.MeshStandardMaterial
        )
          copy.color.copy(source.color);
      });
    };
    release.push(() => {
      node.onBeforeRender = before;
      node.material = original;
      copies.forEach((copy) => copy.dispose());
    });
  });
  const restore = () => {
    if (released) return;
    released = true;
    release.forEach((callback) => callback());
  };
  restore.setIntensity = (intensity: number) => {
    if (released) return;
    highlighted.forEach((material) => {
      material.emissiveIntensity = intensity;
    });
  };
  return restore;
}

/** Slow, low-amplitude pulse: no flashing or changes to the underlying paint. */
export const selectionIntensity = (seconds: number) =>
  0.36 + 0.24 * Math.cos((seconds * Math.PI * 2) / 2.4);
