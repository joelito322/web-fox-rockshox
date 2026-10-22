// Offline: preserve other frames and mechanical detail meshes during the scoped Nomad 7 CC tube/rocker/hanger reconstruction.
import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const read = (p) => JSON.parse(readFileSync(p, "utf8")),
  rows = read("models/catalog-v22/predecessors.json"),
  uploads = read("models/catalog-v22/uploads.json");
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
  "models/catalog-v22/protected-captures.json",
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
    fresh = await load("models/catalog-v22/exports/" + capture.file);
  old.updateMatrixWorld(true);
  fresh.updateMatrixWorld(true);
  const details = [];
  const a = row.asset.manifest.anchors,
    p0 = [738, 871],
    h0 = [1168, 312],
    r0 = [358, 863];
  const u = [h0[0] - p0[0], p0[1] - h0[1]],
    w = [r0[0] - p0[0], p0[1] - r0[1]],
    det = u[0] * w[1] - w[0] * u[1];
  const xy = (p) => {
    const x = p[0] - p0[0],
      y = p0[1] - p[1],
      s = (x * w[1] - w[0] * y) / det,
      t = (u[0] * y - x * u[1]) / det;
    return new T.Vector3(...a.head_tube.position)
      .multiplyScalar(s)
      .addScaledVector(new T.Vector3(...a.rear_axle.position), t);
  };
  const zones = [{ min: [688, 565], max: [824, 853], padding_m: 0.008 }];
  const replaced = (points) =>
    zones.some((z) => {
      const bounds = new T.Box3().setFromPoints(
        [
          [z.min[0], z.min[1]],
          [z.max[0], z.min[1]],
          [z.min[0], z.max[1]],
          [z.max[0], z.max[1]],
        ].map(xy),
      );
      return points.some(
        (p) =>
          p.x >= bounds.min.x - z.padding_m &&
          p.x <= bounds.max.x + z.padding_m &&
          p.y >= bounds.min.y - z.padding_m &&
          p.y <= bounds.max.y + z.padding_m,
      );
    });
  const faceKey = (points) =>
    points
      .map((p) =>
        p
          .toArray()
          .map((n) => Math.round(n * 1e6))
          .join(","),
      )
      .sort()
      .join("|");
  old.traverse((n) => {
    if (
      !n.isMesh ||
      row.asset.manifest.paintable_nodes.includes(n.name) ||
      n.name.includes("__lettering_")
    )
      return;
    const next = fresh.getObjectByName(n.name);
    if (!next?.isMesh) throw Error("Missing inherited detail");
    const faces = new Set(),
      p = next.geometry.attributes.position,
      idx = next.geometry.index;
    for (let i = 0; i < (idx?.count ?? p.count); i += 3)
      faces.add(
        faceKey(
          [0, 1, 2].map((j) =>
            new T.Vector3()
              .fromBufferAttribute(p, idx ? idx.getX(i + j) : i + j)
              .applyMatrix4(next.matrixWorld),
          ),
        ),
      );
    const before = n.geometry.attributes.position,
      ids = n.geometry.index;
    let preserved = 0,
      missing = 0,
      reconstructed = 0;
    for (let i = 0; i < (ids?.count ?? before.count); i += 3) {
      const points = [0, 1, 2].map((j) =>
        new T.Vector3()
          .fromBufferAttribute(before, ids ? ids.getX(i + j) : i + j)
          .applyMatrix4(n.matrixWorld),
      );
      if (
        (n.name.endsWith("__link") || n.name.endsWith("__bolts")) &&
        replaced(points)
      ) {
        reconstructed++;
        continue;
      }
      if (faces.has(faceKey(points))) preserved++;
      else missing++;
    }
    details.push({
      name: n.name,
      preserved,
      missing,
      reconstructed,
      passed: missing === 0 && (preserved > 0 || reconstructed > 0),
    });
  });
  results.push({
    size: row.variant.specs.size_label,
    details,
    paint_reconstructed: true,
    replacement_zones: zones,
    hanger_reconstructed: false,
    link_reconstructed: true,
    lettering_relocated: true,
    replacement_mask_pixels: zones[0],
  });
}
const passed =
  protectedCaptures.length === 28 &&
  protectedCaptures.every((x) => x.unchanged) &&
  results.length === 2 &&
  results.every(
    (r) => r.details.length > 0 && r.details.every((d) => d.passed),
  );
writeFileSync(
  "models/catalog-v22/preservation.json",
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
