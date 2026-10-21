// @vitest-environment node
import { describe, it, expect } from "vitest";
import source from "../../../../../../supabase/catalog/visual-v6-reviewed.json";
import examples from "../../../../../../supabase/catalog/visual-v6-examples.json";
import { parseCatalogImport } from "../../../../catalog/model/ingestion";
import type { VariantMap, Configuration } from "../../../model";
import { resolveAssembly, assemblyV2 } from "../../../model/assemblyV2";
import { brake } from "./brake";
import { brake as frozenBrake } from "../v5/components";
const catalog = parseCatalogImport(source);
const variants: VariantMap = Object.fromEntries(
  catalog.variants.map((v) => [
    v.id,
    {
      ...v,
      visual_assets: catalog.assets.find((a) => a.id === v.visual_asset_id)!,
      component: {
        ...catalog.components.find((c) => c.id === v.component_id)!,
        brands: catalog.brands[0],
      },
    },
  ]),
);
const configuration = {
  schemaVersion: 1,
  name: "Mount test",
  items: examples.presets[0].items,
} as Configuration;
const assembly = {
  ...assemblyV2(configuration, variants),
  ...resolveAssembly(configuration, variants),
};
describe("brake mounting continuity", () => {
  it("preserves the front lever and hose while restoring the replacement caliper body", () => {
    for (const v of Object.values(variants).filter(
      (v) => v.component.category === "brake",
    )) {
      const profile = v.visual_assets!.manifest.parameters.profile_key!;
      const before = frozenBrake(profile, v, assembly, true, "#444444", 0.78),
        after = brake(profile, v, assembly, true, "#444444", 0.78, true);
      const upper = (surfaces: typeof before) =>
        surfaces.flatMap((s) => {
          const p = s.geometry.getAttribute("position"),
            values: number[] = [];
          for (let i = 0; i < p.count; i++)
            if (p.getY(i) > 0.4) values.push(p.getX(i), p.getY(i), p.getZ(i));
          return values;
        });
      expect(upper(after)).toEqual(upper(before));
      for (const s of [...before, ...after]) s.geometry.dispose();
    }
  });
  it("places all nine rear caliper bodies ahead of the axle and removes the old floating body", () => {
    const brakes = Object.values(variants).filter(
      (v) => v.component.category === "brake",
    );
    expect(brakes).toHaveLength(9);
    for (const v of brakes) {
      const surfaces = brake(
        v.visual_assets!.manifest.parameters.profile_key!,
        v,
        assembly,
        false,
        "#444444",
        0.78,
        true,
      );
      let correct = 0,
        old = 0;
      for (const surface of surfaces) {
        const p = surface.geometry.getAttribute("position");
        for (let i = 0; i < p.count; i++)
          if (
            p.getZ(i) < -0.045 &&
            p.getY(i) > assembly.rear[1] + 0.035 &&
            p.getY(i) < assembly.rear[1] + 0.08
          ) {
            if (Math.abs(p.getX(i) - assembly.rear[0] - 0.058) < 0.025)
              correct++;
            if (Math.abs(p.getX(i) - assembly.rear[0] + 0.058) < 0.025) old++;
          }
        surface.geometry.dispose();
      }
      expect(correct, v.component.slug).toBeGreaterThan(20);
      expect(old, v.component.slug).toBe(0);
    }
  });
});
