// @vitest-environment node
import { readFileSync } from "node:fs";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { it, expect } from "vitest";
import * as T from "three";
import { createMotionRig } from "../../src/features/configurator/scene/motion-rig";
import type {
  MotionDefinition,
  MotionPose,
} from "../../src/features/configurator/model/suspension/kinematics";

it.each([
  "marzocchi-bomber-cr--7a8b6311.glb",
  "rockshox-vivid-coil-ultimate-d1--f1f8f316.glb",
  "ohlins-ttx22m2-coil--e0f10784.glb",
])("compresses %s without scaling its diameter or housing", async (file) => {
  const bytes = readFileSync(`models/catalog-v6/exports/${file}`);
  const gltf = await new GLTFLoader().parseAsync(
    Uint8Array.from(bytes).buffer,
    "",
  );
  const restLength = gltf.scene
    .getObjectByName("mount_upper_eye")!
    .position.distanceTo(gltf.scene.getObjectByName("mount_lower_eye")!.position);
  const rig = createMotionRig(gltf.scene, "shock", {
    shockSpring: "coil",
    restLength,
  } as NonNullable<MotionDefinition>);
  const spring = rig.groups.get("spring");
  expect(spring).toBeDefined();
  const bounds = () => new T.Box3().setFromObject(spring!);
  const before = bounds().getSize(new T.Vector3());
  const pose = {
    shockUpper: [0, 0, 0],
    shockLower: [0, -restLength + 0.025, 0],
  } as MotionPose;
  rig.apply(pose);
  const after = bounds().getSize(new T.Vector3());
  expect(after.y).toBeCloseTo(before.y - 0.025, 6);
  expect(after.x).toBeCloseTo(before.x, 6);
  expect(after.z).toBeCloseTo(before.z, 6);
  const top = bounds().max.y;
  rig.apply({ ...pose, shockLower: [0, -restLength, 0] });
  expect(bounds().max.y).toBeCloseTo(top, 6);
  expect(spring!.scale.y).toBe(1);
  expect(rig.groups.get("fixed")!.scale.toArray()).toEqual([1, 1, 1]);
  rig.dispose();
});
