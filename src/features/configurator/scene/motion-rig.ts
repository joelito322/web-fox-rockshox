import * as T from "three";
import type {
  Body,
  MotionDefinition,
  MotionPose,
  Transform,
} from "../model/suspension/kinematics";
import type { Point } from "../model/assembly";
type Region = { role: Body; points: Point[]; closed?: boolean };
function distanceToRegions(p: Point, region: Region) {
  let best = Infinity;
  for (let i = 1; i < region.points.length + (region.closed ? 1 : 0); i++) {
    const a = region.points[i - 1],
      b = region.points[i % region.points.length],
      dx = b[0] - a[0],
      dy = b[1] - a[1];
    const t = Math.max(
      0,
      Math.min(
        1,
        ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1),
      ),
    );
    best = Math.min(
      best,
      Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy),
    );
  }
  return best;
}
/** Split disconnected manufactured surfaces, never individual vertices of rigid members. */
function connectedSurfaces(g: T.BufferGeometry) {
  const pos = g.getAttribute("position"),
    index = g.index,
    count = (index?.count ?? pos.count) / 3,
    parent = Int32Array.from({ length: count }, (_, i) => i),
    points = new Map<string, number>();
  const root = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const at = (i: number) => (index ? index.getX(i) : i);
  for (let tri = 0; tri < count; tri++)
    for (let corner = 0; corner < 3; corner++) {
      const v = at(tri * 3 + corner),
        key = [pos.getX(v), pos.getY(v), pos.getZ(v)]
          .map((n) => Math.round(n * 1e6))
          .join(",");
      const previous = points.get(key);
      if (previous !== undefined) parent[root(tri)] = root(previous);
      else points.set(key, tri);
    }
  const result = new Map<number, number[]>();
  for (let tri = 0; tri < count; tri++) {
    const key = root(tri);
    const list = result.get(key) ?? [];
    list.push(tri);
    result.set(key, list);
  }
  return { groups: [...result.values()], at };
}
function setRigid(group: T.Object3D, t: Transform) {
  group.matrixAutoUpdate = false;
  group.matrix
    .makeTranslation(...t.target)
    .multiply(new T.Matrix4().makeRotationZ(t.angle))
    .multiply(
      new T.Matrix4().makeTranslation(-t.origin[0], -t.origin[1], -t.origin[2]),
    );
  group.matrixWorldNeedsUpdate = true;
}
export function createMotionRig(
  source: T.Group,
  slot: string,
  definition: NonNullable<MotionDefinition>,
) {
  const object = new T.Group(),
    groups = new Map<string, T.Group>(),
    geometries: T.BufferGeometry[] = [];
  source.updateWorldMatrix(true, true);
  const inverse = source.matrixWorld.clone().invert();
  function body(name: string) {
    if (!groups.has(name)) {
      const g = new T.Group();
      g.name = `motion_${name}`;
      object.add(g);
      groups.set(name, g);
    }
    return groups.get(name)!;
  }
  source.traverse((node) => {
    if (!(node instanceof T.Mesh)) return;
    const g = node.geometry.clone();
    g.applyMatrix4(inverse.clone().multiply(node.matrixWorld));
    const position = g.getAttribute("position"),
      connected = connectedSurfaces(g),
      byBody = new Map<string, number[]>();
    for (const triangles of connected.groups) {
      const box = new T.Box3();
      for (const tri of triangles)
        for (let k = 0; k < 3; k++)
          box.expandByPoint(
            new T.Vector3().fromBufferAttribute(
              position,
              connected.at(tri * 3 + k),
            ),
          );
      const center = box.getCenter(new T.Vector3()),
        size = box.getSize(new T.Vector3());
      let role = "fixed";
      if (slot === "frame") {
        const samples: Point[] = [];
        const stride = Math.max(1, Math.floor(triangles.length / 16));
        for (let k = 0; k < triangles.length; k += stride) {
          const at = connected.at(triangles[k] * 3);
          samples.push([
            position.getX(at),
            position.getY(at),
            position.getZ(at),
          ]);
        }
        const score = (r: Region) =>
          samples.reduce((sum, p) => sum + distanceToRegions(p, r), 0) /
          samples.length;
        role = definition.regions.reduce(
          (best, region) => (score(region) < score(best) ? region : best),
          definition.regions[0],
        ).role;
        if (size.length() < 0.14) {
          const joints = definition.joints;
          const links: Region[] = [
            { role: "input", points: [joints.a, joints.c] },
            { role: "output", points: [joints.b, joints.d] },
          ];
          const nearest = links.reduce((best, r) =>
            distanceToRegions(center.toArray() as Point, r) <
            distanceToRegions(center.toArray() as Point, best)
              ? r
              : best,
          );
          if (distanceToRegions(center.toArray() as Point, nearest) < 0.018)
            role = nearest.role;
        }
        // Through-axle fittings and rear brake bosses follow the rigid rear carrier.
        if (center.distanceTo(new T.Vector3(...definition.base.rear)) < 0.085)
          role = definition.rearBody;
        if (
          size.length() < 0.12 &&
          center.distanceTo(new T.Vector3(...definition.base.shockUpper)) < 0.04
        )
          role = definition.upperBody;
        if (
          size.length() < 0.12 &&
          center.distanceTo(new T.Vector3(...definition.base.shockLower)) < 0.04
        )
          role = definition.lowerBody;
      } else if (slot === "fork") {
        // A complete stanchion crosses the seal: keep it rigid with the crown.
        role = box.max.y < -0.1 && box.min.y < -0.2 ? "sliding" : "fixed";
      } else if (slot === "shock") {
        const eye = definition.restLength;
        if (
          definition.shockSpring === "coil" &&
          size.y > eye * 0.45 &&
          size.x > 0.035 &&
          size.z > 0.035
        )
          role = "spring";
        else if (center.y < -eye * 0.53) role = "sliding";
      }
      const list = byBody.get(role) ?? [];
      list.push(...triangles);
      byBody.set(role, list);
    }
    for (const [role, triangles] of byBody) {
      const out = new T.BufferGeometry();
      for (const [name, attribute] of Object.entries(g.attributes)) {
        if (!(attribute instanceof T.BufferAttribute)) continue;
        const values = new Float32Array(
          triangles.length * 3 * attribute.itemSize,
        );
        let offset = 0;
        for (const tri of triangles)
          for (let k = 0; k < 3; k++) {
            const v = connected.at(tri * 3 + k);
            for (let n = 0; n < attribute.itemSize; n++)
              values[offset++] = attribute.array[v * attribute.itemSize + n];
          }
        out.setAttribute(
          name,
          new T.BufferAttribute(values, attribute.itemSize),
        );
      }
      out.computeBoundingSphere();
      const mesh = new T.Mesh(out, node.material);
      mesh.name = node.name + "__" + role;
      mesh.castShadow = node.castShadow;
      mesh.receiveShadow = node.receiveShadow;
      body(role).add(mesh);
      geometries.push(out);
    }
    g.dispose();
  });
  const springGroup = groups.get("spring");
  const springBounds = springGroup ? new T.Box3().setFromObject(springGroup) : null;
  return {
    object,
    groups,
    apply(pose: MotionPose) {
      if (slot === "frame")
        for (const [name, g] of groups) setRigid(g, pose.bodies[name as Body]);
      if (slot === "fork")
        groups.get("sliding")?.position.set(0, pose.forkCompression, 0);
      if (slot === "shock") {
        const next = Math.hypot(
          pose.shockLower[0] - pose.shockUpper[0],
          pose.shockLower[1] - pose.shockUpper[1],
        );
        const delta = definition.restLength - next;
        groups.get("sliding")?.position.set(0, delta, 0);
        const spring = groups.get("spring");
        if (spring && springBounds) {
          // Use this resource’s actual coil span; eye length is not spring length.
          const top = springBounds.max.y,
            length = Math.max(0.02, springBounds.max.y - springBounds.min.y),
            factor = Math.max(0.2, (length - delta) / length);
          spring.scale.y = factor;
          spring.position.y = top * (1 - factor);
        }
      }
    },
    dispose() {
      geometries.forEach((g) => g.dispose());
    },
  };
}
