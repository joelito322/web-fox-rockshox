// Offline: preserve other frames and mechanical detail meshes during full CHERRY BOMB tube reconstruction.
import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const read = (p) => JSON.parse(readFileSync(p, "utf8")),
  rows = read("models/catalog-v16/predecessors.json"),
  uploads = read("models/catalog-v16/uploads.json");
const loader = new GLTFLoader().register(() => ({
  name: "offline-no-textures",
  loadTexture: () => Promise.resolve(null),
}));
const load = async (p) => {
  const b = readFileSync(p);
  return (
    await loader.parseAsync(
      b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength),
      "",
    )
  ).scene;
};
const protectedCaptures = read(
  "models/catalog-v16/protected-captures.json",
).map((c) => ({
  file: c.file,
  unchanged:
    createHash("sha256").update(readFileSync(c.file)).digest("hex") ===
    c.sha256,
}));
const results = [];
for (const row of rows) {
  const old = await load(row.predecessor_file),
    capture = uploads.find((x) => x.predecessor_id === row.variant.id),
    fresh = await load("models/catalog-v16/exports/" + capture.file);
  old.updateMatrixWorld(true);
  fresh.updateMatrixWorld(true);
  const details = [];
  old.traverse((n) => {
    if (
      !n.isMesh ||
      row.asset.manifest.paintable_nodes.includes(n.name) ||
      n.name.includes("__lettering_") ||
      n.name.endsWith("__link")
    )
      return;
    const next = fresh.getObjectByName(n.name);
    if (!next?.isMesh) throw Error("Missing mechanical mesh");
    let preserved =
      n.geometry.attributes.position.count ===
      next.geometry.attributes.position.count;
    for (
      let i = 0;
      i < n.geometry.attributes.position.count && preserved;
      i++
    ) {
      const a = new T.Vector3()
          .fromBufferAttribute(n.geometry.attributes.position, i)
          .applyMatrix4(n.matrixWorld),
        b = new T.Vector3()
          .fromBufferAttribute(next.geometry.attributes.position, i)
          .applyMatrix4(next.matrixWorld);
      preserved &&= a.distanceTo(b) < 1e-7;
    }
    details.push({ name: n.name, preserved });
  });
  results.push({
    size: row.variant.specs.size_label,
    details,
    paint_reconstructed: true,
    link_reconstructed: true,
  });
}
const passed =
  protectedCaptures.length === 28 &&
  protectedCaptures.every((x) => x.unchanged) &&
  results.length === 2 &&
  results.every(
    (r) => r.details.length > 0 && r.details.every((d) => d.preserved),
  );
writeFileSync(
  "models/catalog-v16/preservation.json",
  JSON.stringify(
    {
      checked_at: new Date().toISOString(),
      passed,
      protectedCaptures,
      results,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    passed,
    protected: protectedCaptures.length,
    variants: results.length,
    mechanicalMeshes: results.map((x) => x.details.length),
  }),
);
if (!passed) process.exitCode = 1;
