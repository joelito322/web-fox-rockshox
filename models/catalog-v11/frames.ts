import * as T from "three";
import {
  mergeGeometries,
  mergeVertices,
} from "three/addons/utils/BufferGeometryUtils.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { frameBores, openBore } from "./bores";
export async function frameV11(row: any) {
  const group = (await new GLTFLoader().loadAsync("/" + row.predecessor_file))
      .scene,
    bores = frameBores(row);
  group.updateMatrixWorld(true);
  group.traverse((node) => {
    if (!(node instanceof T.Mesh)) return;
    let geometry = node.geometry.clone().applyMatrix4(node.matrixWorld);
    for (const bore of bores) {
      const next = openBore(geometry, bore);
      geometry.dispose();
      geometry = next;
    }
    node.geometry.dispose();
    node.geometry = geometry;
    node.position.set(0, 0, 0);
    node.rotation.set(0, 0, 0);
    node.scale.set(1, 1, 1);
  });
  // A continuous inner face covers the cut tube intersections; no extra draw call.
  const paint = group.getObjectByName(
    row.asset.manifest.paintable_nodes[0],
  ) as T.Mesh;
  const a = row.asset.manifest.anchors,
    start = new T.Vector3(...a.head_tube_lower.position),
    end = new T.Vector3(...a.head_tube.position),
    axis = end.clone().sub(start),
    length = axis.length();
  const lining = new T.CylinderGeometry(0.02715, 0.02715, length, 32, 1, true);
  const index = lining.getIndex()!,
    normals = lining.getAttribute("normal");
  for (let i = 0; i < index.count; i += 3) {
    const second = index.getX(i + 1);
    index.setX(i + 1, index.getX(i + 2));
    index.setX(i + 2, second);
  }
  for (let i = 0; i < normals.count; i++)
    normals.setXYZ(i, -normals.getX(i), -normals.getY(i), -normals.getZ(i));
  lining.applyQuaternion(
    new T.Quaternion().setFromUnitVectors(
      new T.Vector3(0, 1, 0),
      axis.normalize(),
    ),
  );
  lining.translate(
    ...(start.clone().add(end).multiplyScalar(0.5).toArray() as [
      number,
      number,
      number,
    ]),
  );
  const base = paint.geometry;
  for (const name of Object.keys(lining.attributes))
    if (!base.hasAttribute(name)) lining.deleteAttribute(name);
  const merged = mergeGeometries([base, lining], false);
  if (!merged) throw Error("Headset lining attributes mismatch");
  paint.geometry = mergeVertices(merged, 1e-6);
  base.dispose();
  lining.dispose();
  merged.dispose();
  return {
    group,
    anchors: row.asset.manifest.anchors,
    paintable_nodes: row.asset.manifest.paintable_nodes,
  };
}
