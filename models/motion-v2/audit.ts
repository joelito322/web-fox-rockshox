import * as T from "three";
import { selectVariant } from "../../src/features/catalog/model";
import { resolveAssembly } from "../../src/features/configurator/model/assemblyV2";
import {
  createMotionDefinition,
  transform,
} from "../../src/features/configurator/model/suspension/kinematics";
import { createMotionRig } from "../../src/features/configurator/scene/motion-rig";
export function audit(row: any, rows: any[], brands: any[], scene: T.Group) {
  const chosen = (r: any) =>
    selectVariant(
      {
        ...r.component,
        brands: brands.find((b) => b.id === r.component.brand_id),
        component_variants: [],
      },
      { ...r, visual_assets: r.asset },
    );
  const frame =
    row.component.category === "frame"
      ? row
      : rows.find(
          (r) =>
            r.component.category === "frame" &&
            r.component.slug === "santa-cruz-v10-8-my27",
        );
  const shock =
    row.component.category === "shock"
      ? row
      : rows.find(
          (r) =>
            r.component.category === "shock" &&
            r.specs.eye_to_eye_mm ===
              Number(frame.specs.shock_fit?.eye_to_eye_mm) &&
            r.specs.stroke_mm === Number(frame.specs.shock_fit?.stroke_mm),
        );
  const pair = [
      frame,
      shock ?? rows.find((r) => r.component.category === "shock"),
    ].map(chosen),
    configuration = {
      schemaVersion: 1 as const,
      name: "audit",
      items: pair.map((v) => ({
        slot: v.component.category === "frame" ? "frame" : "shock",
        variantId: v.id,
        finishId: v.allowed_finishes.default_finish_id,
        customColor: null,
      })),
    },
    variants = Object.fromEntries(pair.map((v) => [v.id, v]));
  const def = createMotionDefinition(
    configuration,
    variants,
    resolveAssembly(configuration, variants),
  )!;
  const parts: any[] = [];
  const rig = createMotionRig(scene, row.component.category, def, (p) =>
      parts.push(p),
    ),
    issues: string[] = [],
    dist = (a: number[], b: number[]) =>
      Math.hypot(...a.map((v, i) => v - b[i]));
  const rest = def.pose(0, 0),
    end = def.pose(0, 1),
    compression =
      dist(rest.shockUpper, rest.shockLower) -
      dist(end.shockUpper, end.shockLower);
  const groups = Object.fromEntries(
    [...rig.groups].map(([name, g]) => [
      name,
      {
        meshes: g.children.length,
        vertices: g.children.reduce(
          (s, n) => s + (n as T.Mesh).geometry.attributes.position.count,
          0,
        ),
        bounds: new T.Box3()
          .setFromObject(g)
          .getSize(new T.Vector3())
          .toArray(),
      },
    ]),
  );
  if (!def.rearAvailable) issues.push("no-rear-motion");
  if (compression <= 0) issues.push("no-shock-compression");
  if (row.component.category === "shock") {
    if (!rig.groups.has("sliding")) issues.push("no-sliding-parts");
    if (row.specs.spring_type === "coil" && !rig.groups.has("spring"))
      issues.push("no-coil-compression");
  } else {
    if (!rig.groups.has(def.rearBody)) issues.push("rear-body-missing");
  }
  let previousCompression = -Infinity,
    previousRise = -Infinity,
    maxPivotGap = 0,
    minCompression = Infinity;
  for (let i = 0; i <= 40; i++) {
    const pose = def.pose(0, i / 40),
      c =
        dist(rest.shockUpper, rest.shockLower) -
        dist(pose.shockUpper, pose.shockLower),
      rise = pose.rear[1] - rest.rear[1];
    if (c < previousCompression - 1e-7 || rise < previousRise - 1e-7)
      issues.push("non-monotonic-path");
    previousCompression = c;
    previousRise = rise;
    minCompression = Math.min(minCompression, c);
    maxPivotGap = Math.max(
      maxPivotGap,
      dist(
        transform(def.joints.c, pose.bodies.input),
        transform(def.joints.c, pose.bodies.rear),
      ),
      dist(
        transform(def.joints.d, pose.bodies.output),
        transform(def.joints.d, pose.bodies.rear),
      ),
    );
  }
  const spring = rig.groups.get("spring"),
    springBefore = spring ? new T.Box3().setFromObject(spring) : null;
  rig.apply(end);
  rig.object.updateMatrixWorld(true);
  const springAfter = spring ? new T.Box3().setFromObject(spring) : null;
  if (springBefore && springAfter) {
    if (
      springAfter.max.y - springAfter.min.y >=
      springBefore.max.y - springBefore.min.y
    )
      issues.push("coil-not-shorter");
    if (Math.abs(springAfter.max.y - springBefore.max.y) > 1e-6)
      issues.push("coil-upper-seat-drift");
    if (
      Math.abs(springAfter.max.x - springBefore.max.x) > 1e-6 ||
      Math.abs(springAfter.min.x - springBefore.min.x) > 1e-6 ||
      Math.abs(springAfter.max.z - springBefore.max.z) > 1e-6
    )
      issues.push("coil-diameter-deformed");
  }
  const movingBounds = Object.fromEntries(
    [...rig.groups].map(([n, g]) => [
      n,
      new T.Box3().setFromObject(g).getSize(new T.Vector3()).toArray(),
    ]),
  );
  rig.apply(rest);
  rig.dispose();
  const candidates = [];
  for (const upper of ["fixed", "input", "output", "rear"] as const)
    for (const lower of ["fixed", "input", "output", "rear"] as const) {
      const compression =
        dist(rest.shockUpper, rest.shockLower) -
        dist(
          transform(rest.shockUpper, end.bodies[upper]),
          transform(rest.shockLower, end.bodies[lower]),
        );
      if (compression > 0)
        candidates.push({ upper, lower, compression: compression * 1000 });
    }
  return {
    slug: row.component.slug,
    size: row.specs.size_label,
    id: row.id,
    asset: row.asset.id,
    parts,
    issues: [...new Set(issues)],
    maxPivotGap,
    minCompression,
    springBefore: springBefore?.min.toArray(),
    springAfter: springAfter?.min.toArray(),
    candidates,
    profile: def.version,
    groups,
    movingBounds,
    compression_mm: compression * 1000,
    angle: def.maxAngle,
    joints: def.joints,
    upperBody: def.upperBody,
    lowerBody: def.lowerBody,
  };
}
