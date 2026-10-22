// Offline regression: real FrontSide rendering must see the nearest exterior wall.
import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { readFileSync, writeFileSync } from "node:fs";
const read = (p) => JSON.parse(readFileSync(p, "utf8")),
  rows = read("models/catalog-v29/predecessors.json"),
  uploads = read("models/catalog-v29/uploads.json");
const loader = new GLTFLoader().register(() => ({
  name: "offline-no-textures",
  loadTexture: () => Promise.resolve(null),
}));
const load = async (path) => {
  const b = readFileSync(path);
  const g = (
    await loader.parseAsync(
      b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength),
      "",
    )
  ).scene;
  g.updateMatrixWorld(true);
  return g;
};
const results = [];
for (const row of rows) {
  const old = await load(row.predecessor_file),
    capture = uploads.find((c) => c.predecessor_id === row.variant.id),
    fresh = await load("models/catalog-v29/exports/" + capture.file);
  const rear = new T.Vector3(...row.asset.manifest.anchors.rear_axle.position),
    source = new T.Vector2(443 - 850, 817 - 824),
    scale = rear.length() / source.length(),
    angle = Math.atan2(rear.y, rear.x) - Math.atan2(source.y, source.x),
    xy = (p) => {
      const x = p[0] - 850,
        y = 817 - p[1];
      return new T.Vector3(
        scale * (Math.cos(angle) * x - Math.sin(angle) * y),
        scale * (Math.sin(angle) * x + Math.cos(angle) * y),
        0,
      );
    };
  const hit = (g, origin, dir, side) => {
    g.traverse((n) => {
      if (n.isMesh)
        for (const m of Array.isArray(n.material) ? n.material : [n.material])
          m.side = side;
    });
    return new T.Raycaster(origin, dir, 0, 0.7).intersectObject(g, true)[0];
  };
  const probes = [];
  for (const pixel of [
    [1080, 397],
    [1100, 530],
    [850, 610],
    [700, 715],
    [700, 820],
    [944, 682],
  ])
    for (const z of [-1, 1])
      for (const offset of [
        [0, 0],
        [0.25, 0],
        [-0.25, 0],
        [0, 0.25],
      ]) {
        const outward = new T.Vector3(offset[0], offset[1], z).normalize(),
          origin = xy(pixel).addScaledVector(outward, 0.28),
          dir = outward.clone().negate(),
          oldBoth = hit(old, origin, dir, T.DoubleSide),
          newBoth = hit(fresh, origin, dir, T.DoubleSide),
          oldFront = hit(old, origin, dir, T.FrontSide),
          newFront = hit(fresh, origin, dir, T.FrontSide);
        probes.push({
          pixel,
          outward: outward.toArray(),
          oldCulledDistance:
            oldBoth && oldFront ? oldFront.distance - oldBoth.distance : null,
          newCulledDistance:
            newBoth && newFront ? newFront.distance - newBoth.distance : null,
          surfaceDelta:
            oldBoth && newBoth
              ? Math.abs(oldBoth.distance - newBoth.distance)
              : null,
        });
      }
  const oldBounds = new T.Box3().setFromObject(old),
    newBounds = new T.Box3().setFromObject(fresh);
  const materials = [];
  fresh.traverse((n) => {
    if (n.isMesh && !n.name.includes("lettering"))
      for (const m of Array.isArray(n.material) ? n.material : [n.material])
        materials.push({
          name: n.name,
          opaque: !m.transparent && m.opacity === 1,
          depthWrite: m.depthWrite,
        });
  });
  results.push({
    size: row.variant.specs.size_label,
    probes,
    boundsDelta:
      oldBounds.min.distanceTo(newBounds.min) +
      oldBounds.max.distanceTo(newBounds.max),
    materials,
  });
}
const all = results.flatMap((r) => r.probes),
  passed =
    results.length === 2 &&
    results.every(
      (r) =>
        r.boundsDelta < 1e-6 &&
        r.materials.every((m) => m.opaque && m.depthWrite),
    ) &&
    all.every(
      (p) =>
        p.newCulledDistance !== null &&
        Math.abs(p.newCulledDistance) < 1e-6 &&
        p.surfaceDelta !== null &&
        p.surfaceDelta < 1e-6,
    );
writeFileSync(
  "models/catalog-v29/sides-review.json",
  JSON.stringify(
    {
      checked_at: new Date().toISOString(),
      passed,
      summary: {
        rays: all.length,
        oldNearWallsMissed: all.filter(
          (p) => p.oldCulledDistance === null || p.oldCulledDistance > 1e-6,
        ).length,
        newNearWallsMissed: all.filter(
          (p) =>
            p.newCulledDistance === null ||
            Math.abs(p.newCulledDistance) > 1e-6,
        ).length,
        maxSurfaceDelta: Math.max(
          ...all.map((p) => p.surfaceDelta ?? Infinity),
        ),
      },
      results,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    passed,
    rays: all.length,
    oldMissed: all.filter(
      (p) => p.oldCulledDistance === null || p.oldCulledDistance > 1e-6,
    ).length,
    newMissed: all.filter(
      (p) =>
        p.newCulledDistance === null || Math.abs(p.newCulledDistance) > 1e-6,
    ).length,
    maxDelta: Math.max(...all.map((p) => p.surfaceDelta ?? Infinity)),
  }),
);
if (!passed) process.exitCode = 1;
