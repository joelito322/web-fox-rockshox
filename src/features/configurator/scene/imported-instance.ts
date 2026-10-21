import * as THREE from "three";

// Geometry and unpainted surfaces remain shared with the immutable cached GLB.
// A color change updates owned materials instead of cloning the entire model again.
export function instantiateVisual(source: THREE.Group, paintableNodes: string[]) {
  const object = source.clone(true);
  const paintable = new Set(paintableNodes);
  const materials = new Map<THREE.Material, THREE.Material>();
  object.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    node.castShadow = true;
    if (!paintable.has(node.name)) return;
    const copies = (Array.isArray(node.material) ? node.material : [node.material])
      .map((material) => {
        const copy = materials.get(material) ?? material.clone();
        materials.set(material, copy);
        return copy;
      });
    node.material = Array.isArray(node.material) ? copies : copies[0];
  });
  return {
    object,
    paint(color: string) {
      for (const material of materials.values())
        if ("color" in material)
          (material as THREE.MeshStandardMaterial).color.set(color);
    },
    dispose() {
      materials.forEach((material) => material.dispose());
    },
  };
}
