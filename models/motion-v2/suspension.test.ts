// @vitest-environment node
import { describe, it, expect } from "vitest";
import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { inventory } from "./inventory.mjs";
import { audit } from "./audit";
import { selectVariant } from "../../src/features/catalog/model";
import { resolveAssembly } from "../../src/features/configurator/model/assemblyV2";
import {
  createMotionDefinition,
  transform,
} from "../../src/features/configurator/model/suspension/kinematics";
const { rows, brands, captures, presetFrames } = inventory(),
  frames = rows.filter((r: any) => r.component.category === "frame"),
  shocks = rows.filter((r: any) => r.component.category === "shock");
const loader = new GLTFLoader().register(() => ({
  name: "test-without-textures",
  loadTexture: () => Promise.resolve(null),
}));
const dist = (a: number[], b: number[]) =>
  Math.hypot(...a.map((n, i) => n - b[i]));
const selected = (r: any) =>
  selectVariant(
    {
      ...r.component,
      brands: brands.find((b: any) => b.id === r.component.brand_id),
      component_variants: [],
    },
    { ...r, visual_assets: r.asset },
  );
describe("current suspension resources and complete motion envelope", () => {
  it("covers thirty frame sizes and all thirty-eight published shocks, excluding drafts", () => {
    expect(frames).toHaveLength(30);
    expect(presetFrames).toHaveLength(4);
    expect(shocks).toHaveLength(38);
    expect(new Set(frames.map((r: any) => r.component.slug)).size).toBe(15);
    expect(new Set(shocks.map((r: any) => r.component.slug)).size).toBe(4);
  });
  it.each([...frames, ...presetFrames])(
    "keeps pivots closed and compression monotonic for every selectable shock: $component.slug $specs.size_label",
    (frame: any) => {
      for (const shock of shocks) {
        const f = selected(frame),
          s = selected(shock),
          configuration = {
            schemaVersion: 1 as const,
            name: "motion",
            items: [
              {
                slot: "frame",
                variantId: f.id,
                finishId: f.allowed_finishes.default_finish_id,
                customColor: null,
              },
              {
                slot: "shock",
                variantId: s.id,
                finishId: s.allowed_finishes.default_finish_id,
                customColor: null,
              },
            ],
          },
          variants = { [f.id]: f, [s.id]: s },
          def = createMotionDefinition(
            configuration,
            variants,
            resolveAssembly(configuration, variants),
          )!;
        expect(def.version).toBe("atlas-motion-v2");
        expect(def.rearAvailable).toBe(true);
        const rest = def.pose(0, 0);
        let previous = 0,
          rise = 0;
        for (let i = 1; i <= 100; i++) {
          const p = def.pose(0, i / 100),
            c = def.restLength - dist(p.shockUpper, p.shockLower);
          expect(c).toBeGreaterThanOrEqual(previous - 1e-7);
          expect(p.rear[1] - rest.rear[1]).toBeGreaterThanOrEqual(rise - 1e-7);
          expect(c).toBeLessThanOrEqual(def.stroke * 0.98 + 1e-8);
          expect(
            dist(
              transform(def.joints.c, p.bodies.input),
              transform(def.joints.c, p.bodies.rear),
            ),
          ).toBeLessThan(1e-8);
          expect(
            dist(
              transform(def.joints.d, p.bodies.output),
              transform(def.joints.d, p.bodies.rear),
            ),
          ).toBeLessThan(1e-8);
          previous = c;
          rise = p.rear[1] - rest.rear[1];
        }
        expect(previous).toBeGreaterThan(0);
      }
    },
    15000,
  );
  it.each([...frames, ...shocks, ...presetFrames])(
    "articulates actual immutable GLB parts without rigid spring translation: $component.slug $specs.size_label",
    async (row: any) => {
      const file = captures.get(row.asset.id),
        bytes = readFileSync(file),
        sha = () =>
          createHash("sha256").update(readFileSync(file)).digest("hex"),
        before = sha();
      const scene = (
        await loader.parseAsync(
          bytes.buffer.slice(
            bytes.byteOffset,
            bytes.byteOffset + bytes.byteLength,
          ),
          "",
        )
      ).scene;
      const result = audit(row, rows, brands, scene);
      expect(result.issues).toEqual([]);
      expect(result.maxPivotGap).toBeLessThan(1e-8);
      expect(sha()).toBe(before);
      if (row.component.category === "shock") {
        const springs = result.parts.filter((p: any) => p.role === "spring");
        expect(springs).toHaveLength(row.specs.spring_type === "coil" ? 1 : 0);
        for (const p of springs) expect(p.triangles).toBeGreaterThan(2000);
      }
      scene.traverse((n) => {
        if (n instanceof T.Mesh) n.geometry.dispose();
      });
    },
    15000,
  );
});
