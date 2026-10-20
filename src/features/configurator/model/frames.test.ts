import { describe, expect, it } from "vitest";
import { parseCatalogImport } from "../../catalog/model/ingestion";
import { resolveAssembly } from "./assemblyV2";
import { emptyConfiguration, type VariantMap } from "./index";
import source from "../../../../supabase/catalog/frames-reviewed.json";
const batch = parseCatalogImport(source);
const variants: VariantMap = {};
for (const v of batch.variants) {
  const component = batch.components.find(c => c.id === v.component_id)!;
  variants[v.id] = { ...v, component: { ...component, brands: batch.brands.find(b => b.id === component.brand_id)! }, visual_assets: batch.assets.find(a => a.id === v.visual_asset_id)! };
}
describe("documented frame size resources", () => {
  it("retains each size's wheelbase, reach and stack through the actual assembly", () => {
    for (const v of Object.values(variants)) {
      const geometry = v.specs.geometry as Record<string, number>;
      const result = resolveAssembly({ ...emptyConfiguration(), items: [{slot: "frame", variantId: v.id, finishId: "factory", customColor: null}] }, variants);
      expect(result.front[0] - result.rear[0]).toBeCloseTo(geometry.wheelbase_mm / 1000, 5);
      expect(result.head[0]).toBeCloseTo(geometry.reach_mm / 1000, 5);
      expect(result.head[1]).toBeCloseTo(geometry.stack_mm / 1000, 5);
      expect(result.front[1] - result.radius("front")).toBeCloseTo(result.rear[1] - result.radius("rear"), 5);
    }
    for (const c of batch.components) {
      const sizes = batch.variants.filter(v => v.component_id === c.id && v.selectable);
      expect(sizes).toHaveLength(2);
      expect(sizes[0].visual_asset_id).not.toBe(sizes[1].visual_asset_id);
      expect(sizes[0].specs.geometry).not.toEqual(sizes[1].specs.geometry);
    }
  });
  it("keeps original sizing and unknown measurements without invented equivalents or weights", () => {
    const sizes = (slug: string) => Object.values(variants).filter(v => v.component.slug === slug && v.selectable).map(v => v.specs.size_label);
    expect(sizes("specialized-s-works-enduro-udh")).toEqual(["S3", "S4"]);
    expect(sizes("da-bomb-cherry-bomb-29")).toEqual(["17″", "19″"]);
    for (const v of Object.values(variants)) expect(v.specs.weight_g).toBeUndefined();
    const sender = Object.values(variants).find(v => v.component.slug === "canyon-sender-cfr-high-pivot")!;
    expect((sender.specs.geometry as Record<string, unknown>).bb_height_mm).toBeUndefined();
    expect(sender.specs.rear_axle_standard).toBe("12x148");
  });
  it("identifies all visual estimates and keeps high-pivot routing distinct from conventional frames", () => {
    for (const v of Object.values(variants)) {
      const asset = v.visual_assets!;
      expect(asset.generator_key).toBe("atlas-bike-v2");
      expect(Object.values(asset.manifest.anchors).every(a => a.estimated)).toBe(true);
      const highPivot = ["canyon-sender-cfr-high-pivot", "trek-slash-al-gen-6"].includes(v.component.slug);
      expect(Boolean(asset.manifest.anchors.chain_idler)).toBe(highPivot);
    }
  });
  it("adds verified measurements as new captures while retaining published references", () => {
    const previous = Object.values(variants).filter(v => !v.selectable);
    expect(previous).toHaveLength(2);
    for (const old of previous) {
      const next = Object.values(variants).find(v => v.selectable && v.component_id === old.component_id && v.specs.size_label === old.specs.size_label)!;
      expect(next.id).not.toBe(old.id);
      expect(next.visual_asset_id).toBe(old.visual_asset_id);
      expect(next.specs.geometry).toEqual(old.specs.geometry);
      expect((old.specs.bb_shell as Record<string, unknown>).width_mm).toBeUndefined();
      expect((next.specs.bb_shell as Record<string, unknown>).width_mm).toBe(73);
    }
  });

});
