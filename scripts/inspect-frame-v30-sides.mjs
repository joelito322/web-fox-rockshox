// Offline regression: real FrontSide rendering must see the nearest exterior wall.
import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { readFileSync, writeFileSync } from "node:fs";
const read = (p) => JSON.parse(readFileSync(p, "utf8")),
  rows = read("models/catalog-v30/predecessors.json"),
  uploads = read("models/catalog-v30/uploads.json");
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
    fresh = await load("models/catalog-v30/exports/" + capture.file);
  const bb = [645, 754],
    h = [1018, 278],
    r = [303, 755],
    anchors = row.asset.manifest.anchors,
    u = [h[0] - bb[0], bb[1] - h[1]],
    v = [r[0] - bb[0], bb[1] - r[1]],
    det = u[0] * v[1] - v[0] * u[1],
    xy = (p) => {
      const x = p[0] - bb[0],
        y = bb[1] - p[1],
        c = (x * v[1] - v[0] * y) / det,
        d = (u[0] * y - x * u[1]) / det;
      return new T.Vector3(...anchors.head_tube.position)
        .multiplyScalar(c)
        .addScaledVector(new T.Vector3(...anchors.rear_axle.position), d)
        .setZ(0);
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
    [900, 380],
    [850, 545],
    [633, 487],
    [580, 627],
    [500, 765],
    [780, 645],
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
    results.every((r) => r.materials.every((m) => m.opaque && m.depthWrite)) &&
    all.every(
      (p) =>
        p.newCulledDistance !== null && Math.abs(p.newCulledDistance) < 1e-6,
    );
writeFileSync(
  "models/catalog-v30/sides-review.json",
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
