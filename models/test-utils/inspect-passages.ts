import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { readFileSync } from "node:fs";
import { frameBores } from "../catalog-v11/bores";
/** Recompute geometry checks from immutable final binaries; never trust a stored test result. */
export async function inspectPassages(
  row: any,
  file: string,
  extendedHead = false,
) {
  const loader = new GLTFLoader().register(() => ({
    name: "test-no-textures",
    loadTexture: () => Promise.resolve(null),
  }));
  const load = async (path: string) => {
    const b = readFileSync(path);
    const g = (
      await loader.parseAsync(
        b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength),
        "",
      )
    ).scene;
    g.updateMatrixWorld(true);
    g.traverse((n) => {
      if (n instanceof T.Mesh)
        for (const m of Array.isArray(n.material) ? n.material : [n.material])
          m.side = T.DoubleSide;
    });
    return g;
  };
  const before = await load(row.predecessor_file),
    after = await load(file),
    probes = [];
  for (const bore of frameBores(row)) {
    const dir = bore.end.clone().sub(bore.start).normalize(),
      normal = new T.Vector3(1, 0, 0).cross(dir);
    if (normal.lengthSq() < 0.01) normal.set(0, 1, 0).cross(dir);
    normal.normalize();
    const extend = extendedHead && bore.name === "headset",
      length = bore.start.distanceTo(bore.end) + (extend ? 0.1 : 0);
    for (const offset of extend ? [0, -0.3, 0.3, -0.7, 0.7] : [0, -0.3, 0.3]) {
      const from = bore.start
        .clone()
        .addScaledVector(normal, bore.radius * offset)
        .addScaledVector(dir, extend ? -0.05 : 0);
      const ray = new T.Raycaster(from, dir, 0.00001, length - 0.00001);
      probes.push({
        before: ray.intersectObject(before, true).length,
        after: ray.intersectObject(after, true).length,
      });
    }
  }
  const a = new T.Box3().setFromObject(before),
    b = new T.Box3().setFromObject(after),
    boundsDelta = a.min.distanceTo(b.min) + a.max.distanceTo(b.max);
  for (const g of [before, after])
    g.traverse((n) => {
      if (n instanceof T.Mesh) n.geometry.dispose();
    });
  return { probes, boundsDelta };
}
