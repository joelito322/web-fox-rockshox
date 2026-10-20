import { describe, it, expect } from "vitest";
import { parseCatalogImport } from "./ingestion";
import { presetImportSchema } from "./presets";
import { slotCategories, slots } from "../../configurator/model";
import catalogue from "../../../../supabase/catalog/initial-reviewed.json";
import examples from "../../../../supabase/catalog/enduro-examples.json";
import downhill from "../../../../supabase/catalog/downhill-examples.json";
describe("reviewed commercial inventory and reference compositions", () => {
  it("rejects publishing a procedural generator that the client cannot render", () => {
    const altered = structuredClone(catalogue);
    const asset = altered.assets.find((a) => a.published)!;
    asset.generator_key = "not-installed";
    expect(() => parseCatalogImport(altered)).toThrow("unsupported generator");
    asset.published = false;
    for (const variant of altered.variants.filter(
      (v) => v.visual_asset_id === asset.id,
    ))
      variant.published = false;
    expect(() => parseCatalogImport(altered)).not.toThrow();
  });
  it("keeps every reference position tied to a real matching variant and versioned resource", () => {
    const data = parseCatalogImport(catalogue),
      presets = [
        ...presetImportSchema.parse(examples).presets,
        ...presetImportSchema.parse(downhill).presets,
      ];
    for (const preset of presets) {
      expect(preset.items).toHaveLength(slots.length);
      for (const item of preset.items) {
        const variant = data.variants.find((v) => v.id === item.variantId)!;
        expect(variant).toBeDefined();
        const component = data.components.find(
          (c) => c.id === variant.component_id,
        )!;
        expect(component.category).toBe(slotCategories[item.slot]);
        expect(
          variant.allowed_finishes.options.some((f) => f.id === item.finishId),
        ).toBe(true);
        const asset = data.assets.find(
          (a) => a.id === variant.visual_asset_id,
        )!;
        expect(asset).toBeDefined();
        if (preset.published) {
          expect(
            variant.published && component.published && asset.published,
          ).toBe(true);
        }
      }
    }
  });
  it("rejects publication of an incomplete reference and duplicated positions", () => {
    const preset = examples.presets[0];
    expect(
      presetImportSchema.safeParse({
        presets: [
          { ...preset, published: true, items: preset.items.slice(0, 1) },
        ],
      }).success,
    ).toBe(false);
    expect(
      presetImportSchema.safeParse({
        presets: [{ ...preset, items: [preset.items[0], preset.items[0]] }],
      }).success,
    ).toBe(false);
  });
});
