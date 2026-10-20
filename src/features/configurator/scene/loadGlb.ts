import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export function disposeVisual(object: THREE.Group) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  object.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    geometries.add(node.geometry);
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      materials.add(material);
      for (const value of Object.values(material))
        if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  textures.forEach((texture) => texture.dispose());
}

export async function loadGlb(url: string, timeoutMs = 20000): Promise<THREE.Group> {
  const controller = new AbortController();
  let expired = false;
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      expired = true;
      controller.abort();
      reject(new Error("visual_timeout"));
    }, timeoutMs);
  });
  const loading = (async () => {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error("visual_unavailable");
    const buffer = await response.arrayBuffer();
    const gltf = await new GLTFLoader().parseAsync(buffer, new URL(".", url).href);
    // Parsing may finish after a timeout while resolving associated textures.
    if (expired) {
      disposeVisual(gltf.scene);
      throw new Error("visual_timeout");
    }
    return gltf.scene;
  })();
  try {
    return await Promise.race([loading, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}
