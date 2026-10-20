import { describe, it, expect } from "vitest";
import { assembly } from "./assembly";
import { assemblyV2, resolveAssembly } from "./assemblyV2";
import { warnings, type Configuration, type VariantMap } from "./index";
import { parseCatalogImport } from "../../catalog/model/ingestion";
import { presetImportSchema } from "../../catalog/model/presets";
import source from "../../../../supabase/catalog/initial-reviewed.json";
import enduro from "../../../../supabase/catalog/enduro-examples.json";
import downhill from "../../../../supabase/catalog/downhill-examples.json";
const data = parseCatalogImport(source);
function fixture(document: unknown, index = 0) {
  const preset = presetImportSchema.parse(document).presets[index];
  const configuration: Configuration = {
    schemaVersion: 1,
    name: preset.name,
    items: structuredClone(preset.items),
  };
  const variants: VariantMap = {};
  for (const v of data.variants) {
    const component = data.components.find((c) => c.id === v.component_id)!;
    const brand = data.brands.find((b) => b.id === component.brand_id)!;
    variants[v.id] = {
      ...v,
      visual_assets:
        data.assets.find((a) => a.id === v.visual_asset_id) ?? null,
      component: { ...component, brands: brand },
    };
  }
  return { configuration, variants };
}
describe("versioned downhill assembly", () => {
  it("leaves every v1 frame coordinate and mounting origin intact", () => {
    const { configuration, variants } = fixture(enduro);
    const old = assembly(configuration, variants),
      current = resolveAssembly(configuration, variants);
    for (const key of [
      "front",
      "rear",
      "seat",
      "head",
      "lower",
      "saddle",
      "bar",
      "shockUpper",
      "shockLower",
      "ground",
    ] as const)
      expect(current[key]).toEqual(old[key]);
    for (const item of configuration.items)
      expect(current.origin(item.slot)).toEqual(old.origin(item.slot));
  });
  it.each([0, 1])(
    "uses each DH size's own geometry and seats both wheel diameters on the floor (%i)",
    (index) => {
      const { configuration, variants } = fixture(downhill, index);
      const result = assemblyV2(configuration, variants);
      const frame =
        variants[
          configuration.items.find((i) => i.slot === "frame")!.variantId
        ];
      expect(result.front[0] - result.rear[0]).toBeCloseTo(
        (frame.specs.geometry as { wheelbase_mm: number }).wheelbase_mm / 1000,
        6,
      );
      expect(result.idler).not.toBeNull();
      expect(result.upperCrown[1]).toBeGreaterThan(result.head[1]);
      expect(result.origin("front_hub")).toEqual(result.front);
      expect(result.origin("handlebar")).toEqual(result.bar);
      expect(result.front[1] - result.radius("front")).toBeCloseTo(
        result.rear[1] - result.radius("rear"),
        8,
      );
      expect(
        Math.hypot(
          ...result.shockUpper.map((v, i) => v - result.shockLower[i]),
        ),
      ).toBeCloseTo(0.25, 8);
      expect(
        warnings(configuration, variants).filter((w) => w.level === "conflict"),
      ).toEqual([]);
    },
  );
  it("keeps an incompatible shock at its declared length and produces a warning", () => {
    const { configuration, variants } = fixture(downhill);
    const short = data.variants.find(
      (v) => v.specs.eye_to_eye_mm === 230 && v.specs.stroke_mm === 65,
    )!;
    configuration.items.find((i) => i.slot === "shock")!.variantId = short.id;
    const result = assemblyV2(configuration, variants);
    expect(
      Math.hypot(...result.shockUpper.map((v, i) => v - result.shockLower[i])),
    ).toBeCloseTo(0.23, 8);
    expect(warnings(configuration, variants).map((w) => w.code)).toContain(
      "shock_length",
    );
  });
});
