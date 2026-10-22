import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  mergeGeometries,
  mergeVertices,
} from "three/addons/utils/BufferGeometryUtils.js";
import { buildNewFrame, newFrameGroup } from "./capra-builder";
import { frameBores } from "../catalog-v11/bores";
import { openBore } from "../catalog-v13/trim";
export async function frameV15(row: any) {
  if (row.slug !== "yt-capra-mk3-carbon-mx")
    throw Error("CAPRA-only full path reconstruction");
  const group = (await new GLTFLoader().loadAsync("/" + row.predecessor_file))
    .scene;
  group.updateMatrixWorld(true);
  const resource = buildNewFrame("yt-capra-mk3-carbon-mx", row.variant);
  const painted = resource.surfaces.filter((s) => s.color === resource.color);
  let geometry = mergeGeometries(
    painted.map((s) => s.geometry),
    false,
  )!;
  resource.surfaces.forEach((s) => s.geometry.dispose());
  for (const bore of frameBores(row)) {
    const next = openBore(geometry, bore);
    geometry.dispose();
    geometry = next;
  }
  const a = row.asset.manifest.anchors,
    lo = new T.Vector3(...a.head_tube_lower.position),
    hi = new T.Vector3(...a.head_tube.position),
    axis = hi.clone().sub(lo);
  const lining = new T.CylinderGeometry(
      0.02715,
      0.02715,
      axis.length(),
      32,
      1,
      true,
    ),
    idx = lining.index!,
    normals = lining.getAttribute("normal");
  for (let i = 0; i < idx.count; i += 3) {
    const k = idx.getX(i + 1);
    idx.setX(i + 1, idx.getX(i + 2));
    idx.setX(i + 2, k);
  }
  for (let i = 0; i < normals.count; i++)
    normals.setXYZ(i, -normals.getX(i), -normals.getY(i), -normals.getZ(i));
  lining.applyQuaternion(
    new T.Quaternion().setFromUnitVectors(
      new T.Vector3(0, 1, 0),
      axis.normalize(),
    ),
  );
  lining.translate(...lo.clone().add(hi).multiplyScalar(0.5).toArray());
  for (const name of Object.keys(lining.attributes))
    if (!geometry.hasAttribute(name)) lining.deleteAttribute(name);
  const merged = mergeGeometries([geometry, lining], false)!;
  geometry.dispose();
  lining.dispose();
  const paint = group.getObjectByName(
    row.asset.manifest.paintable_nodes[0],
  ) as T.Mesh;
  paint.geometry.dispose();
  paint.geometry = mergeVertices(merged, 1e-6);
  merged.dispose();
  // Relocate lettering onto the new straight diagonal; keep mechanical detail meshes from v14.
  const fresh = newFrameGroup("yt-capra-mk3-carbon-mx", row.variant);
  for (const label of [...fresh.children].filter((n) =>
    n.name.includes("__lettering_"),
  )) {
    const old = group.getObjectByName(label.name);
    if (old) old.removeFromParent();
    group.add(label);
  }
  fresh.traverse((n) => {
    if (n instanceof T.Mesh) {
      n.geometry.dispose();
      for (const m of Array.isArray(n.material) ? n.material : [n.material])
        m.dispose();
    }
  });
  return {
    group,
    anchors: row.asset.manifest.anchors,
    paintable_nodes: row.asset.manifest.paintable_nodes,
  };
}
