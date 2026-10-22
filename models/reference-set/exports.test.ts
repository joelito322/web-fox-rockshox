// @vitest-environment node
import { readFileSync, existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as T from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

async function part(name: string) {
  const data = readFileSync(new URL(`./exports/${name}.glb`, import.meta.url));
  return (
    await new GLTFLoader().parseAsync(
      data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
      "",
    )
  ).scene;
}
function mount(scene: T.Group, name: string) {
  const node = scene.getObjectByName("mount_" + name);
  expect(node, `missing exported mount ${name}`).toBeDefined();
  return node!.getWorldPosition(new T.Vector3());
}
describe.skipIf(
  !existsSync(new URL("./exports/supreme-v5.glb", import.meta.url)),
)("reference candidates exported for the real web GLTF loader", () => {
  it("preserves metres, component origins and mounting spans", async () => {
    const frame = await part("supreme-v5");
    expect(mount(frame, "bottom_bracket").length()).toBeCloseTo(0, 6);
    const head = mount(frame, "head_top"),
      lower = mount(frame, "head_bottom");
    expect(head.x).toBeCloseTo(0.456, 2);
    expect(head.y).toBeCloseTo(0.649, 1); // Drawing calibration has a documented 5 mm stack residual.
    expect(head.distanceTo(lower)).toBeCloseTo(0.112, 2);
    expect(
      mount(frame, "rear_axle").distanceTo(mount(frame, "bottom_bracket")),
    ).toBeCloseTo(0.454, 2);
    const fork = await part("fox-40-my27");
    expect(mount(fork, "lower_crown").length()).toBeCloseTo(0, 6);
    expect(mount(fork, "axle").y).toBeCloseTo(-0.602, 5);
    const shock = await part("bomber-cr-250");
    expect(
      mount(shock, "upper_eye").distanceTo(mount(shock, "lower_eye")),
    ).toBeCloseTo(0.25, 6);
  });
  it("has finite geometry with depth and a bounded rendering cost, without external dependencies", async () => {
    let totalTriangles = 0,
      totalBytes = 0,
      totalMeshes = 0;
    for (const name of ["supreme-v5", "fox-40-my27", "bomber-cr-250"]) {
      const scene = await part(name),
        bounds = new T.Box3().setFromObject(scene).getSize(new T.Vector3());
      expect(Math.min(...bounds.toArray())).toBeGreaterThan(0.04);
      scene.traverse((node) => {
        if (!(node instanceof T.Mesh)) return;
        totalMeshes++;
        const geometry = node.geometry;
        for (const key of ["position", "normal"]) {
          const attr = geometry.getAttribute(key);
          expect(attr).toBeDefined();
          expect(Array.from(attr.array).every(Number.isFinite)).toBe(true);
        }
        totalTriangles +=
          (geometry.index?.count ?? geometry.getAttribute("position").count) /
          3;
      });
      const bytes = readFileSync(
        new URL(`./exports/${name}.glb`, import.meta.url),
      );
      totalBytes += bytes.length;
      const chunkLength = bytes.readUInt32LE(12);
      const manifest = JSON.parse(
        bytes.subarray(20, 20 + chunkLength).toString(),
      );
      expect(manifest.images ?? []).toHaveLength(0);
      expect(manifest.buffers.every((b: { uri?: string }) => !b.uri)).toBe(
        true,
      );
    }
    expect(totalMeshes).toBeLessThanOrEqual(20);
    expect(totalTriangles).toBeLessThan(90000);
    expect(totalBytes).toBeLessThan(4_000_000);
  });
});
