import { describe, it, expect } from "vitest";
import existing from "../../../../../supabase/catalog/visual-v7-reviewed.json";
import gravity from "../../../../../supabase/catalog/gravity-reviewed.json";
import { parseCatalogImport } from "../../../catalog/model/ingestion";
import { selectVariant, type SelectedVariant } from "../../../catalog/model";
import { resolveAssembly } from "../assemblyV2";
import { createMotionDefinition, linkagePose, transform } from "./kinematics";
import type { Configuration, VariantMap } from "../index";
const sources = [existing, gravity].map(parseCatalogImport);
const models = sources.flatMap((x) => x.components),
  assets = sources.flatMap((x) => x.assets);
const rows = sources
  .flatMap((x) => x.variants)
  .filter((v) => v.published && v.selectable)
  .map((v) =>
    selectVariant(
      {
        ...models.find((m) => m.id === v.component_id)!,
        brands: {
          id: models.find((m) => m.id === v.component_id)!.brand_id,
          name: "Test",
          slug: "test",
        },
        component_variants: [],
      },
      { ...v, visual_assets: assets.find((a) => a.id === v.visual_asset_id)! },
    ),
  );
export const motionCases = rows
  .filter((v) => v.component.category === "frame")
  .map((frame) => {
    const fork = rows.find((v) => v.component.category === "fork")!,
      shock = rows.find((v) => v.component.category === "shock")!;
    const items = [
      ["frame", frame],
      ["fork", fork],
      ["shock", shock],
    ].map(([slot, v]) => ({
      slot,
      variantId: (v as SelectedVariant).id,
      finishId: (v as SelectedVariant).allowed_finishes.options[0].id,
      customColor: null,
    }));
    const configuration = {
        schemaVersion: 1,
        name: "Motion",
        items,
      } as Configuration,
      variants = Object.fromEntries(
        [frame, fork, shock].map((v) => [v.id, v]),
      ) as VariantMap;
    const assembly = resolveAssembly(configuration, variants);
    return {
      frame,
      configuration,
      variants,
      assembly,
      definition: createMotionDefinition(configuration, variants, assembly)!,
    };
  });
describe("model-specific exterior suspension geometry", () => {
  it("has registered profiles for all fifteen current frame models and both primary sizes", () => {
    expect(new Set(motionCases.map((c) => c.frame.component.slug)).size).toBe(
      15,
    );
    expect(
      motionCases
        .filter((c) => !c.definition?.rearAvailable)
        .map((c) => c.frame.component.slug),
    ).toEqual([]);
    for (const c of motionCases) {
      expect(c.definition, c.frame.component.slug).not.toBeNull();
    }
  });
  it("preserves rigid link lengths and all shared pivots throughout each available motion envelope", () => {
    const dist = (a: number[], b: number[]) =>
      Math.hypot(a[0] - b[0], a[1] - b[1]);
    for (const c of motionCases) {
      const def = c.definition,
        j = def.joints;
      for (let i = 0; i <= 20; i++) {
        const p = def.pose(i / 20, i / 20),
          b = p.bodies;
        const C = transform(j.c, b.input),
          D = transform(j.d, b.output);
        expect(
          dist(C, transform(j.c, b.rear)),
          c.frame.component.slug,
        ).toBeLessThan(1e-8);
        expect(
          dist(D, transform(j.d, b.rear)),
          c.frame.component.slug,
        ).toBeLessThan(1e-8);
        expect(dist(C, D)).toBeCloseTo(dist(j.c, j.d), 8);
        expect(dist(j.a, C)).toBeCloseTo(dist(j.a, j.c), 8);
        expect(dist(j.b, D)).toBeCloseTo(dist(j.b, j.d), 8);
        expect(p.front.every(Number.isFinite)).toBe(true);
      }
    }
  });
  it("clamps invalid inputs and preserves the exact reference posture", () => {
    for (const c of motionCases) {
      const d = c.definition,
        p = d.pose(0, 0);
      expect(p.rear).toEqual(c.assembly.rear);
      expect(p.front).toEqual(c.assembly.front);
      expect(d.pose(NaN, -10)).toEqual(p);
      expect(d.pose(9, 9)).toEqual(d.pose(1, 1));
    }
  });
  it("keeps the axle trajectory continuous without jumping to another linkage branch", () => {
    for (const c of motionCases) {
      let previous = c.definition.pose(0, 0).rear;
      for (let i = 1; i <= 100; i++) {
        const next = c.definition.pose(0, i / 100).rear;
        expect(
          Math.hypot(...next.map((n, k) => n - previous[k])),
          c.frame.component.slug,
        ).toBeLessThan(0.03);
        previous = next;
      }
    }
  });
  it("rejects impossible closed linkages instead of stretching rigid bodies", () => {
    expect(
      linkagePose(
        { a: [0, 0, 0], b: [10, 0, 0], c: [1, 0, 0], d: [2, 0, 0] },
        Math.PI,
      ),
    ).toBeNull();
  });
});
