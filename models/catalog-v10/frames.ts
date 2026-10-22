import * as T from "three";
import {
  mergeVertices,
  mergeGeometries,
} from "three/addons/utils/BufferGeometryUtils.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { newFrameGroup } from "./new-frames";
import profiles from "./frame-profiles.json";
import { inside, roundedContour, type ContourSection } from "./contour-volume";
const traces = import.meta.glob("../catalog-v5/traces/*.json", {
  eager: true,
  import: "default",
}) as Record<string, any>;
function filterGeometry(
  source: T.BufferGeometry,
  keep: (p: number[]) => boolean,
) {
  const g = source.index ? source.toNonIndexed() : source.clone(),
    position = g.getAttribute("position"),
    normal = g.getAttribute("normal"),
    points: number[] = [],
    normals: number[] = [];
  for (let i = 0; i < position.count; i += 3) {
    const p = [0, 0, 0];
    for (let j = 0; j < 3; j++) {
      p[0] += position.getX(i + j) / 3;
      p[1] += position.getY(i + j) / 3;
      p[2] += position.getZ(i + j) / 3;
    }
    if (!keep(p)) continue;
    for (let j = 0; j < 3; j++) {
      points.push(
        position.getX(i + j),
        position.getY(i + j),
        position.getZ(i + j),
      );
      normals.push(normal.getX(i + j), normal.getY(i + j), normal.getZ(i + j));
    }
  }
  g.dispose();
  const result = new T.BufferGeometry();
  result.setAttribute("position", new T.Float32BufferAttribute(points, 3));
  result.setAttribute("normal", new T.Float32BufferAttribute(normals, 3));
  return result;
}
export async function frameV10(row: any) {
  const old = (await new GLTFLoader().loadAsync("/" + row.predecessor_file))
    .scene;
  const anchors = row.asset.manifest.anchors;
  let group: T.Group;
  if (row.slug in profiles) {
    group = newFrameGroup(row.slug as keyof typeof profiles, row.variant);
    // Every assembly and motion anchor retains the published predecessor's exact coordinate.
    // The new exterior does not redefine headsets, wheel centres or shock fit.
  } else {
    group = old;
    const trace = traces[`../catalog-v5/traces/${row.slug}.json`],
      p = trace.image_landmarks;
    const bb = p.bottom_bracket,
      h = p.head_top,
      r = p.rear_axle,
      head = anchors.head_tube.position,
      rear = anchors.rear_axle.position;
    const u = [h[0] - bb[0], bb[1] - h[1]],
      v = [r[0] - bb[0], bb[1] - r[1]],
      det = u[0] * v[1] - v[0] * u[1];
    const xy = (pixel: number[]) => {
      const x = pixel[0] - bb[0],
        y = bb[1] - pixel[1],
        a = (x * v[1] - v[0] * y) / det,
        b = (u[0] * y - x * u[1]) / det;
      return [a * head[0] + b * rear[0], a * head[1] + b * rear[1]];
    };
    const sections: ContourSection[] = trace.sections
      .filter(
        (s: any) =>
          ["top", "down", "seat"].includes(s.name) ||
          /^(stay|chain)[-0-9]/.test(s.name),
      )
      .map((s: any) => ({
        name: s.name,
        polygon: s.points.map(xy),
        depth: s.depth_mm / 1000,
        z: (s.z_mm ?? 0) / 1000,
        ...(Math.abs(s.z_mm ?? 0) > 20
          ? {
              rearX: rear[0],
              rearZ:
                (row.slug === "commencal-supreme-dh-v5" ? 0.157 : 0.148) / 2 +
                0.006,
            }
          : {}),
      }));
    const names = new Set(row.asset.manifest.paintable_nodes);
    old.updateMatrixWorld(true);
    let material: T.MeshStandardMaterial | undefined;
    old.traverse((n) => {
      if (!(n instanceof T.Mesh) || !names.has(n.name)) return;
      material = (n.material as T.MeshStandardMaterial).clone();
      const world = n.geometry.clone().applyMatrix4(n.matrixWorld);
      n.geometry.dispose();
      n.geometry = filterGeometry(
        world,
        (pt) =>
          !sections.some(
            (s) =>
              Math.abs(
                pt[2] -
                  (s.rearX
                    ? Math.sign(s.z) *
                      (Math.abs(s.z) +
                        (s.rearZ! - Math.abs(s.z)) *
                          Math.min(1, Math.max(0, pt[0] / s.rearX)))
                    : s.z),
              ) <=
                s.depth / 2 + 0.003 && inside(pt, s.polygon),
          ),
      );
      world.dispose();
      n.matrixAutoUpdate = true;
      n.position.set(0, 0, 0);
      n.rotation.set(0, 0, 0);
      n.scale.set(1, 1, 1);
    });
    if (!material) throw Error("Missing predecessor painted surface");
    const carbon =
      !row.slug.startsWith("commencal") &&
      !row.slug.startsWith("da-bomb") &&
      !row.slug.startsWith("trek");
    for (const section of sections) {
      const volume = roundedContour(section, "#a2a596", carbon);
      // Keep the pedalier bore open; its machined sleeve remains part of the original detail.
      const geometry = filterGeometry(
        volume,
        (p) => Math.hypot(p[0], p[1]) > 0.0208,
      );
      volume.dispose();
      const mesh = new T.Mesh(geometry, material.clone());
      mesh.name = row.slug + "__v10_" + section.name;
      group.add(mesh);
    }
  }
  for (const [name, value] of Object.entries(anchors) as [string, any][]) {
    const existing = group.getObjectByName("mount_" + name);
    if (existing) existing.position.fromArray(value.position);
    else {
      const marker = new T.Object3D();
      marker.name = "mount_" + name;
      marker.position.fromArray(value.position);
      group.add(marker);
    }
  }
  if (group !== old)
    old.traverse((n) => {
      if (n instanceof T.Mesh) {
        n.geometry.dispose();
        for (const m of Array.isArray(n.material) ? n.material : [n.material])
          m.dispose();
      }
    });
  // Indexed export shares only vertices whose position AND normal/UV match. Sharp edges survive.
  group.traverse((n) => {
    if (n instanceof T.Mesh) {
      const source = n.geometry;
      n.geometry = mergeVertices(source, 1e-6);
      source.dispose();
    }
  });
  const priorPaint = new Set(row.asset.manifest.paintable_nodes);
  const painted = group.children.filter(
    (n) =>
      n instanceof T.Mesh &&
      (n.name.includes("__paint_") ||
        n.name.includes("__v10_") ||
        priorPaint.has(n.name)),
  ) as T.Mesh[];
  if (painted.length > 1) {
    const geometry = mergeGeometries(
      painted.map((n) => n.geometry),
      false,
    );
    if (!geometry) throw Error("Paint mesh attributes do not match");
    const mesh = new T.Mesh(
      geometry,
      (painted[0].material as T.Material).clone(),
    );
    mesh.name = row.slug + "__paint_v10";
    for (const n of painted) {
      group.remove(n);
      n.geometry.dispose();
      for (const m of Array.isArray(n.material) ? n.material : [n.material])
        m.dispose();
    }
    group.add(mesh);
  }
  return {
    group,
    anchors,
    paintable_nodes: group.children
      .filter(
        (n) =>
          n instanceof T.Mesh &&
          (n.name.includes("__paint_") ||
            n.name.includes("__v10_") ||
            priorPaint.has(n.name)),
      )
      .map((n) => n.name),
  };
}
