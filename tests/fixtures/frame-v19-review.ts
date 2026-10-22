import * as T from "three";
import { frameBores } from "../../models/catalog-v11/bores";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { frameV19 } from "../../models/catalog-v19/frames";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import uploads from "../../models/catalog-v19/uploads.json";
import sourceV19 from "../../supabase/catalog/frames-v19-reviewed.json";
import rows from "../../models/catalog-v19/predecessors.json";
const renderer = new T.WebGLRenderer({
  antialias: true,
  alpha: true,
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(1);
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = T.SRGBColorSpace;
document.body.appendChild(renderer.domElement);
const scene = new T.Scene();
scene.background = new T.Color("#eceee7");
scene.add(new T.AmbientLight(0xffffff, 1.8));
for (const [x, y, z, power] of [
  [2, 3, 4, 3],
  [-2, 1, -3, 2],
]) {
  const l = new T.DirectionalLight(0xffffff, power);
  l.position.set(x, y, z);
  scene.add(l);
}
const orthographic = new URLSearchParams(location.search).has("ortho");
const aspect = innerWidth / innerHeight;
const camera = orthographic
  ? new T.OrthographicCamera(
      -aspect * 0.65,
      aspect * 0.65,
      0.65,
      -0.65,
      0.001,
      100,
    )
  : new T.PerspectiveCamera(35, aspect, 0.001, 100);
let current: T.Group | undefined;
const version = document.getElementById("version") as HTMLSelectElement;
version.value =
  new URLSearchParams(location.search).get("version") === "v19"
    ? "v19"
    : "baseline";
const directions: Record<string, number[]> = {
  lateral: [0, 0, 1],
  opuesta: [0, 0, -1],
  frontal: [1, 0, 0],
  superior: [0, 1, 0.001],
  inferior: [0, -1, 0.001],
  diagonal: [1, 0.45, 1.8],
  "diagonal-opuesta": [1, 0.45, -1.8],
};
const select = document.getElementById("model") as HTMLSelectElement;
for (const row of rows) {
  const o = document.createElement("option");
  o.value = row.variant.id;
  o.textContent = row.component.name + " · " + row.variant.specs.size_label;
  select.appendChild(o);
}
const view = document.getElementById("view") as HTMLSelectElement;
view.value = new URLSearchParams(location.search).get("view") ?? "head-side";
async function show(id = select.value, direction = view.value) {
  const row = rows.find((row) => row.variant.id === id)!;
  const proposed = version.value === "v19";
  const capture = uploads.find((c) => c.predecessor_id === id);
  const resource = proposed
    ? capture
      ? await new GLTFLoader().loadAsync(
          "/models/catalog-v19/exports/" + capture.file,
        )
      : { scene: (await frameV19(row)).group }
    : await new GLTFLoader().loadAsync("/" + row.predecessor_file);
  if (current) {
    scene.remove(current);
    current.traverse((n) => {
      if (n instanceof T.Mesh) {
        n.geometry.dispose();
        for (const m of Array.isArray(n.material) ? n.material : [n.material])
          m.dispose();
      }
    });
  }
  current = resource.scene;
  const bounds = new T.Box3().setFromObject(current),
    size = bounds.getSize(new T.Vector3());
  current.position.sub(bounds.getCenter(new T.Vector3()));
  scene.add(current);
  const distance =
    (Math.hypot(size.x, size.y, size.z) / 2 / Math.sin((35 * Math.PI) / 360)) *
    1.12;
  const bore = frameBores(row).find((b) => b.name === direction);
  if (direction.startsWith("head-")) {
    const a = row.asset.manifest.anchors,
      target = new T.Vector3(...a.head_tube.position)
        .lerp(new T.Vector3(...a.head_tube_lower.position), 0.5)
        .sub(bounds.getCenter(new T.Vector3()));
    const offsets: Record<string, number[]> = {
      "head-side": [0, 0.02, 0.4],
      "head-front": [0.35, 0.02, 0.22],
      "head-rear": [-0.25, 0.04, 0.3],
      "head-low": [0.2, -0.2, 0.3],
    };
    camera.position.copy(target).add(new T.Vector3(...offsets[direction]));
    camera.lookAt(target);
  } else if (bore) {
    const axis = bore.end.clone().sub(bore.start).normalize(),
      center = bounds.getCenter(new T.Vector3());
    camera.position.copy(bore.end).addScaledVector(axis, 0.19).sub(center);
    camera.lookAt(bore.start.clone().sub(center));
  } else {
    camera.position
      .fromArray(directions[direction])
      .normalize()
      .multiplyScalar(distance);
    camera.lookAt(0, 0, 0);
  }
  if (camera instanceof T.OrthographicCamera) {
    const span = direction.startsWith("head-")
      ? 0.25
      : Math.max(size.y * 1.25, (size.x / aspect) * 1.25);
    camera.left = (-span * aspect) / 2;
    camera.right = (span * aspect) / 2;
    camera.top = span / 2;
    camera.bottom = -span / 2;
    camera.updateProjectionMatrix();
  }
  renderer.render(scene, camera);
  select.value = id;
  view.value = direction;
  return {
    id,
    slug: row.slug,
    size: size.toArray(),
    data: renderer.domElement.toDataURL("image/png"),
  };
}
(window as any).atlasReviewFrame = show;
select.onchange = () => void show();
view.onchange = () => void show();
version.onchange = () => void show();
void show().then(() => {
  (window as any).atlasFramesReady = true;
});

(window as any).atlasExportFrame = async (id: string) => {
  const row = rows.find((r) => r.variant.id === id)!;
  const result = await frameV19(row);
  const bytes = (await new GLTFExporter().parseAsync(result.group, {
    binary: true,
  })) as ArrayBuffer;
  return {
    data: await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1]);
      reader.readAsDataURL(new Blob([bytes]));
    }),
    anchors: result.anchors,
    paintable_nodes: result.paintable_nodes,
  };
};

(window as any).atlasInspectFrameExports = async () => {
  const results = [];
  for (const capture of uploads) {
    const resource = await new GLTFLoader().loadAsync(
        "/models/catalog-v19/exports/" + capture.file,
      ),
      asset = sourceV19.assets.find((a) => a.id === capture.asset_id)!;
    resource.scene.updateMatrixWorld(true);
    const bounds = new T.Box3().setFromObject(resource.scene);
    const registration = Object.entries(asset.manifest.anchors)
      .filter(([name]) =>
        [
          "rear_axle",
          "head_tube",
          "seat_tube",
          "shock_upper",
          "shock_lower",
        ].includes(name),
      )
      .map(([name, a]) => ({
        name,
        point: new T.Vector3(...(a.position as [number, number, number])),
        distance: Infinity,
      }));
    const triangle = new T.Triangle(),
      closest = new T.Vector3();
    let vertices = 0,
      triangles = 0,
      finite = true,
      meshes = 0;
    resource.scene.traverse((n) => {
      if (n instanceof T.Mesh) {
        meshes++;
        const p = n.geometry.getAttribute("position");
        vertices += p.count;
        triangles += (n.geometry.index?.count ?? p.count) / 3;
        finite &&=
          Array.from(p.array).every(Number.isFinite) &&
          Array.from(n.geometry.getAttribute("normal").array).every(
            Number.isFinite,
          );
        const index = n.geometry.index,
          count = index?.count ?? p.count;
        for (let i = 0; i < count; i += 3) {
          triangle.a
            .fromBufferAttribute(p, index ? index.getX(i) : i)
            .applyMatrix4(n.matrixWorld);
          triangle.b
            .fromBufferAttribute(p, index ? index.getX(i + 1) : i + 1)
            .applyMatrix4(n.matrixWorld);
          triangle.c
            .fromBufferAttribute(p, index ? index.getX(i + 2) : i + 2)
            .applyMatrix4(n.matrixWorld);
          if (triangle.getArea() < 1e-14) continue;
          for (const sample of registration) {
            triangle.closestPointToPoint(sample.point, closest);
            const distance = sample.point.distanceTo(closest);
            if (Number.isFinite(distance))
              sample.distance = Math.min(sample.distance, distance);
          }
        }
      }
    });
    const paint = asset.manifest.paintable_nodes.every(
      (name) => resource.scene.getObjectByName(name) instanceof T.Mesh,
    );
    const anchors = Object.entries(asset.manifest.anchors).every(
      ([name, a]) => {
        const marker = resource.scene.getObjectByName("mount_" + name);
        return (
          marker &&
          marker.position.distanceTo(
            new T.Vector3(...(a.position as [number, number, number])),
          ) < 1e-6
        );
      },
    );
    results.push({
      id: capture.variant_id,
      meshes,
      vertices,
      triangles,
      finite,
      paint,
      anchors,
      registration: registration.map(({ name, distance }) => ({
        name,
        distance_mm: distance * 1000,
      })),
      bounds: bounds.getSize(new T.Vector3()).toArray(),
    });
    resource.scene.traverse((n) => {
      if (n instanceof T.Mesh) {
        n.geometry.dispose();
        for (const m of Array.isArray(n.material) ? n.material : [n.material])
          m.dispose();
      }
    });
  }
  return results;
};
(window as any).atlasInspectBores = async () => {
  const results = [];
  const { frameBores } = await import("../../models/catalog-v11/bores");
  for (const row of rows) {
    const capture = uploads.find((c) => c.predecessor_id === row.variant.id)!;
    const before = (
        await new GLTFLoader().loadAsync("/" + row.predecessor_file)
      ).scene,
      after = (
        await new GLTFLoader().loadAsync(
          "/models/catalog-v19/exports/" + capture.file,
        )
      ).scene;
    before.updateMatrixWorld(true);
    after.updateMatrixWorld(true);
    const bores = frameBores(row),
      probes = [];
    const intersections = (
      group: T.Group,
      start: T.Vector3,
      dir: T.Vector3,
      length: number,
    ) => {
      let count = 0;
      group.traverse((n) => {
        if (n instanceof T.Mesh) {
          const material = Array.isArray(n.material)
            ? n.material
            : [n.material];
          for (const m of material) m.side = T.DoubleSide;
          count += new T.Raycaster(
            start,
            dir,
            0.00001,
            length - 0.00001,
          ).intersectObject(n, false).length;
        }
      });
      return count;
    };
    for (const bore of bores) {
      const dir = bore.end.clone().sub(bore.start).normalize(),
        normal = new T.Vector3(1, 0, 0).cross(dir);
      if (normal.lengthSq() < 0.01) normal.set(0, 1, 0).cross(dir);
      normal.normalize();
      const extended = bore.name === "headset";
      const length = bore.start.distanceTo(bore.end) + (extended ? 0.1 : 0);
      for (const offset of extended
        ? [0, -0.3, 0.3, -0.7, 0.7]
        : [0, -0.3, 0.3]) {
        const from = bore.start
          .clone()
          .addScaledVector(normal, bore.radius * offset)
          .addScaledVector(dir, extended ? -0.05 : 0);
        probes.push({
          bore: bore.name,
          offset,
          before: intersections(before, from, dir, length),
          after: intersections(after, from, dir, length),
        });
      }
    }
    const box1 = new T.Box3().setFromObject(before),
      box2 = new T.Box3().setFromObject(after);
    results.push({
      id: capture.variant_id,
      slug: row.slug,
      size: row.variant.specs.size_label,
      probes,
      boundsDelta:
        box1.min.distanceTo(box2.min) + box1.max.distanceTo(box2.max),
    });
    for (const group of [before, after])
      group.traverse((n) => {
        if (n instanceof T.Mesh) {
          n.geometry.dispose();
          for (const m of Array.isArray(n.material) ? n.material : [n.material])
            m.dispose();
        }
      });
  }
  return results;
};

(window as any).atlasOverlayFrame = async (id: string) => {
  const result = await show(id, "lateral"),
    row = rows.find((r) => r.variant.id === id)!;
  const photo = new Image();
  photo.src = "/models/catalog-v9/references/furious.webp";
  await photo.decode();
  const canvas = document.createElement("canvas");
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const src = [
    [810, 767],
    [1255, 198],
    [390, 756],
  ].map((p) => p.map((x) => (x * photo.width) / 2000));
  const a = row.asset.manifest.anchors;
  const dst = [
    new T.Vector3(),
    new T.Vector3(...a.head_tube.position),
    new T.Vector3(...a.rear_axle.position),
  ].map((p) => {
    const q = p.add(current!.position).project(camera);
    return [((q.x + 1) * innerWidth) / 2, ((1 - q.y) * innerHeight) / 2];
  });
  const [s0, s1, s2] = src,
    [d0, d1, d2] = dst,
    ux = s1[0] - s0[0],
    uy = s1[1] - s0[1],
    vx = s2[0] - s0[0],
    vy = s2[1] - s0[1],
    det = ux * vy - uy * vx;
  const coeff = (axis: number) => {
    const u = d1[axis] - d0[axis],
      v = d2[axis] - d0[axis],
      x = (u * vy - v * uy) / det,
      y = (v * ux - u * vx) / det;
    return [x, y, d0[axis] - x * s0[0] - y * s0[1]];
  };
  const x = coeff(0),
    y = coeff(1);
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.setTransform(x[0], y[0], x[1], y[1], x[2], y[2]);
  ctx.drawImage(photo, 0, 0);
  ctx.restore();
  const bg = scene.background;
  scene.background = null;
  renderer.render(scene, camera);
  ctx.globalAlpha = 0.65;
  ctx.drawImage(renderer.domElement, 0, 0);
  ctx.globalAlpha = 1;
  scene.background = bg;
  renderer.render(scene, camera);
  ctx.fillStyle = "#111";
  ctx.font = "14px sans-serif";
  ctx.fillText(
    "COMMENCAL FURIOUS 2021 · foto registrada por pedalier/dirección/eje trasero · " +
      row.variant.specs.size_label,
    16,
    24,
  );
  return {
    ...result,
    data: canvas.toDataURL(),
    registration: {
      source: src,
      destination: dst,
      method: "three-landmark affine; not dimensional validation",
    },
  };
};
