// Offline source/binary comparison, no remote reads or writes.
import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const rows = read("models/catalog-v14/predecessors.json"),
  uploads = read("models/catalog-v14/uploads.json"),
  protectedList = read("models/catalog-v14/protected-captures.json");
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
const newSlugs = rows.map((r) => r.slug);
const legacyShells = {};
const pointKey = (v) =>
  v
    .toArray()
    .map((x) => Math.round(x * 1e5))
    .join(",");
const faceKey = (points) => points.map(pointKey).sort().join("|");
const results = [];
for (const row of rows) {
  const old = await load(row.predecessor_file),
    capture = uploads.find((c) => c.predecessor_id === row.variant.id),
    fresh = await load("models/catalog-v14/exports/" + capture.file),
    lo = new T.Vector3(...row.asset.manifest.anchors.head_tube_lower.position),
    hi = new T.Vector3(...row.asset.manifest.anchors.head_tube.position),
    axis = hi.clone().sub(lo).normalize(),
    length = hi.distanceTo(lo);
  old.updateMatrixWorld(true);
  fresh.updateMatrixWorld(true);
  const legacy = legacyShells[row.variant.id],
    legacyFaces = new Set();
  if (legacy) {
    const reference = await load(legacy.file);
    reference.updateMatrixWorld(true);
    reference.traverse((n) => {
      if (!n.isMesh || !legacy.paintable_nodes.includes(n.name)) return;
      const p = n.geometry.attributes.position,
        ids = n.geometry.index;
      for (let at = 0; at < (ids?.count ?? p.count); at += 3)
        legacyFaces.add(
          faceKey(
            [0, 1, 2].map((j) =>
              new T.Vector3()
                .fromBufferAttribute(p, ids ? ids.getX(at + j) : at + j)
                .applyMatrix4(n.matrixWorld),
            ),
          ),
        );
    });
  }
  let legacyRemnantVertices = 0;
  let preserved = 0,
    missing = 0,
    clearance = 0,
    finite = true;
  const meshes = [];
  old.traverse((n) => {
    if (!n.isMesh) return;
    const other = fresh.getObjectByName(n.name);
    if (!other?.isMesh) throw Error("Missing original node");
    const p = other.geometry.attributes.position,
      grid = new Map(),
      scale = 1e5;
    const key = (x, y, z) => x + "," + y + "," + z;
    for (let i = 0; i < p.count; i++) {
      const v = new T.Vector3()
          .fromBufferAttribute(p, i)
          .applyMatrix4(other.matrixWorld),
        k = key(
          Math.floor(v.x * scale),
          Math.floor(v.y * scale),
          Math.floor(v.z * scale),
        );
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push(v);
      finite &&= v.toArray().every(Number.isFinite);
    }
    const before = n.geometry.attributes.position;
    const headVertices = new Set();
    if (newSlugs.includes(row.slug)) {
      const ids = n.geometry.index,
        total = ids?.count ?? before.count;
      for (let at = 0; at < total; at += 3) {
        const tri = [0, 1, 2].map((j) => (ids ? ids.getX(at + j) : at + j));
        if (
          tri.every((i) => {
            const d = new T.Vector3()
                .fromBufferAttribute(before, i)
                .applyMatrix4(n.matrixWorld)
                .sub(lo),
              s = d.dot(axis);
            return (
              s >= -0.000001 &&
              s <= length + 0.000001 &&
              d.addScaledVector(axis, -s).length() <= 0.0341
            );
          })
        ) {
          if (!legacy) tri.forEach((i) => headVertices.add(i));
        }
      }
    }

    const legacyVertices = new Set();
    if (
      legacyFaces.size &&
      row.asset.manifest.paintable_nodes.includes(n.name)
    ) {
      const ids = n.geometry.index;
      for (let at = 0; at < (ids?.count ?? before.count); at += 3) {
        const tri = [0, 1, 2].map((j) => (ids ? ids.getX(at + j) : at + j));
        const points = tri.map((i) =>
          new T.Vector3()
            .fromBufferAttribute(before, i)
            .applyMatrix4(n.matrixWorld),
        );
        const near = points.some((point) => {
          const d = point.clone().sub(lo),
            a = d.dot(axis);
          return (
            a > -0.1 &&
            a < length + 0.1 &&
            d.addScaledVector(axis, -a).length() < 0.2
          );
        });
        if (near && legacyFaces.has(faceKey(points)))
          tri.forEach((i) => legacyVertices.add(i));
      }
    }
    let lost = 0,
      kept = 0;
    for (let i = 0; i < before.count; i++) {
      const v = new T.Vector3()
          .fromBufferAttribute(before, i)
          .applyMatrix4(n.matrixWorld),
        local = v.clone().sub(lo),
        a = local.dot(axis),
        r = local.addScaledVector(axis, -a).length();
      if (!headVertices.has(i) && legacyVertices.has(i)) {
        legacyRemnantVertices++;
        continue;
      }
      if (
        newSlugs.includes(row.slug) &&
        !headVertices.has(i) &&
        r <= 0.1609 &&
        a > -0.0701 &&
        a < length + 0.0701
      ) {
        clearance++;
        continue;
      }
      if (
        r <= 0.0274 &&
        ((a > length && a < length + 0.061) || (a < 0 && a > -0.061))
      ) {
        clearance++;
        continue;
      }
      const x = Math.floor(v.x * scale),
        y = Math.floor(v.y * scale),
        z = Math.floor(v.z * scale);
      let found = false;
      for (let dx = -1; dx <= 1 && !found; dx++)
        for (let dy = -1; dy <= 1 && !found; dy++)
          for (let dz = -1; dz <= 1 && !found; dz++)
            found = (grid.get(key(x + dx, y + dy, z + dz)) ?? []).some(
              (p) => p.distanceToSquared(v) < 1e-12,
            );
      if (found) {
        preserved++;
        kept++;
      } else {
        missing++;
        lost++;
        console.log(
          JSON.stringify({
            missingVertex: v.toArray(),
            r,
            axial: a,
            length,
            slug: row.slug,
          }),
        );
      }
    }
    meshes.push({ name: n.name, preserved: kept, missing: lost });
  });
  const b1 = new T.Box3().setFromObject(old),
    b2 = new T.Box3().setFromObject(fresh),
    boundsDelta = b1.min.distanceTo(b2.min) + b1.max.distanceTo(b2.max);
  results.push({
    slug: row.slug,
    size: row.variant.specs.size_label,
    preserved,
    missing,
    clearance,
    legacyRemnantVertices,
    finite,
    boundsDelta,
    meshes,
  });
}
const protectedCaptures = protectedList.map((c) => ({
  file: c.file,
  unchanged:
    createHash("sha256").update(readFileSync(c.file)).digest("hex") ===
    c.sha256,
}));
const passed =
  results.every((r) => r.missing === 0 && r.finite && r.boundsDelta < 0.012) &&
  protectedCaptures.length === 28 &&
  protectedCaptures.every((c) => c.unchanged);
writeFileSync(
  "models/catalog-v14/preservation.json",
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
    models: 1,
    captures: results.length,
    protected: protectedCaptures.length,
    missing: results.reduce((s, r) => s + r.missing, 0),
    maxBoundsDelta: Math.max(...results.map((r) => r.boundsDelta)),
  }),
);
if (!passed) process.exitCode = 1;
