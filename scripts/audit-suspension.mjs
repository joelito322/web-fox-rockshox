import { createServer } from "vite";
import { readFileSync, writeFileSync } from "node:fs";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { inventory } from "../models/motion-v2/inventory.mjs";
const { rows, brands, captures, presetFrames } = inventory();
const loader = new GLTFLoader().register(() => ({
  name: "no-offline-textures",
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
const vite = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
try {
  const { audit } = await vite.ssrLoadModule("/models/motion-v2/audit.ts");
  const results = [];
  for (const row of [
    ...rows.filter((r) => ["frame", "shock"].includes(r.component.category)),
    ...presetFrames,
  ]) {
    const scene = await load(captures.get(row.asset.id));
    results.push(audit(row, rows, brands, scene));
    scene.traverse((n) => {
      if (n.isMesh) n.geometry.dispose();
    });
  }
  const out =
    process.argv.find((a) => a.startsWith("--out="))?.slice(6) ??
    "models/motion-v2/audit-before.json";
  writeFileSync(
    out,
    JSON.stringify({ checked_at: new Date().toISOString(), results }, null, 2) +
      "\n",
  );
  console.log(
    JSON.stringify(
      results.map((r) => ({
        slug: r.slug,
        size: r.size,
        issues: r.issues,
        groups: r.groups,
        compression: r.compression_mm,
      })),
      null,
      2,
    ),
  );
  if (results.some((r) => r.issues.length)) process.exitCode = 1;
} finally {
  await vite.close();
}
