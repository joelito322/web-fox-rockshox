import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  mergeGeometries,
  mergeVertices,
} from "three/addons/utils/BufferGeometryUtils.js";
import { openBore } from "./bores";

// Exterior estimates from inherited multiview references, not bearing standards.
export const headProfiles: Record<string, [number, number]> = {
  "commencal-meta-sx-v5": [0.036, 0.038],
  "commencal-supreme-dh-v5": [0.036, 0.039],
  "santa-cruz-nomad-7-my27": [0.036, 0.04],
  "canyon-sender-cfr-high-pivot": [0.036, 0.04],
  "specialized-s-works-enduro-udh": [0.036, 0.04],
  "da-bomb-cherry-bomb-29": [0.034, 0.036],
  "scott-ransom-rc-427727": [0.037, 0.041],
  "trek-slash-al-gen-6": [0.036, 0.039],
  "santa-cruz-v10-8-my27": [0.036, 0.039],
  "yt-tues-mk4-carbon": [0.036, 0.04],
  "yt-capra-mk3-carbon-mx": [0.036, 0.04],
  "gt-fury-carbon-high-pivot": [0.036, 0.04],
  "gt-force-carbon-high-pivot": [0.036, 0.04],
  "commencal-frs-v3": [0.035, 0.038],
  "commencal-furious-v3-2021": [0.035, 0.038],
};
export async function frameV12(row: any) {
  const group = (await new GLTFLoader().loadAsync("/" + row.predecessor_file))
    .scene;
  group.updateMatrixWorld(true);
  const anchors = row.asset.manifest.anchors,
    lower = new T.Vector3(...anchors.head_tube_lower.position),
    upper = new T.Vector3(...anchors.head_tube.position),
    axis = upper.clone().sub(lower).normalize(),
    length = upper.distanceTo(lower),
    profile = headProfiles[row.slug];
  if (!profile) throw Error("Missing explicit head profile: " + row.slug);
  const [topRadius, bottomRadius] = profile,
    slope = (topRadius - bottomRadius) / length,
    extension = 0.075;
  // Remove the previous sleeve AND the penetrating tube ends, including projections
  // beyond its rims. The new exterior follows the same cone as the cut, so tube
  // junctions meet its surface rather than stopping short or floating outside it.
  group.traverse((node) => {
    if (!(node instanceof T.Mesh)) return;
    const world = node.geometry.clone().applyMatrix4(node.matrixWorld);
    const positions = world.getAttribute("position"),
      originalNormals = world.getAttribute("normal").clone(),
      moved = new Set<number>();
    const local = new T.Vector3();
    for (let i = 0; i < positions.count; i++) {
      local.fromBufferAttribute(positions, i).sub(lower);
      const axial = local.dot(axis),
        radial = local.clone().addScaledVector(axis, -axial).length();
      if (radial > 0.13 || axial < -0.08 || axial > length + 0.08) continue;
      const weight = 1 - T.MathUtils.smoothstep(radial, 0.038, 0.13);
      const desired = length * 0.25 + axial * 0.5;
      const delta = (desired - axial) * weight;
      if (Math.abs(delta) < 1e-8) continue;
      local.fromBufferAttribute(positions, i).addScaledVector(axis, delta);
      positions.setXYZ(i, local.x, local.y, local.z);
      moved.add(i);
    }
    if (moved.size) {
      world.computeVertexNormals();
      const normals = world.getAttribute("normal");
      for (let i = 0; i < normals.count; i++)
        if (!moved.has(i))
          normals.setXYZ(
            i,
            originalNormals.getX(i),
            originalNormals.getY(i),
            originalNormals.getZ(i),
          );
    }
    const cut = openBore(
      world,
      {
        name: "head exterior replacement",
        start: lower.clone().addScaledVector(axis, -extension),
        end: upper.clone().addScaledVector(axis, extension),
        radius: bottomRadius - slope * extension,
      },
      topRadius + slope * extension,
    );
    world.dispose();
    node.geometry.dispose();
    node.geometry = cut;
    node.position.set(0, 0, 0);
    node.rotation.set(0, 0, 0);
    node.scale.set(1, 1, 1);
  });
  const paint = group.getObjectByName(
    row.asset.manifest.paintable_nodes[0],
  ) as T.Mesh;
  // The annular end faces and inner wall form one continuous head section. The
  // slight exterior overlap hides roundoff at the cut without increasing draw calls.
  const inner = 0.0273,
    overlap = 0.00004;
  const shell = new T.LatheGeometry(
    [
      new T.Vector2(inner, 0),
      new T.Vector2(bottomRadius + overlap, 0),
      new T.Vector2(topRadius + overlap, length),
      new T.Vector2(inner, length),
      new T.Vector2(inner, 0),
    ],
    64,
  );
  shell.applyQuaternion(
    new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), axis),
  );
  shell.translate(lower.x, lower.y, lower.z);
  for (const name of Object.keys(shell.attributes))
    if (!paint.geometry.hasAttribute(name)) shell.deleteAttribute(name);
  const merged = mergeGeometries([paint.geometry, shell], false);
  if (!merged) throw Error("Head geometry attributes mismatch");
  const before = paint.geometry;
  paint.geometry = mergeVertices(merged, 1e-6);
  before.dispose();
  merged.dispose();
  shell.dispose();
  return {
    group,
    anchors,
    paintable_nodes: row.asset.manifest.paintable_nodes,
  };
}
