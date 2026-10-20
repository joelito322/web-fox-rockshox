import { describe, expect, it } from "vitest";
import { parseCatalogImport } from "../../catalog/model/ingestion";
import { choose, warnings, type Configuration, type VariantMap } from "./index";
import initial from "../../../../supabase/catalog/initial-reviewed.json";
import suspension from "../../../../supabase/catalog/suspension-reviewed.json";
import downhill from "../../../../supabase/catalog/downhill-examples.json";
const batches = [parseCatalogImport(initial), parseCatalogImport(suspension)];
const variants: VariantMap = {};
for (const batch of batches) for (const variant of batch.variants) {
  const component = batch.components.find(c => c.id === variant.component_id)!;
  variants[variant.id] = { ...variant, component: { ...component, brands: batch.brands.find(b => b.id === component.brand_id)! }, visual_assets: batch.assets.find(a => a.id === variant.visual_asset_id)! };
}
describe("documented suspension inventory", () => {
  it("keeps current generation weights paired to their actual reference size", () => {
    const x2 = Object.values(variants).filter(v => v.component.slug === "fox-float-x2-factory-my26");
    expect(x2).toHaveLength(11);
    expect(x2.filter(v => v.specs.weight_g != null).map(v => v.manufacturer_code)).toEqual(["979-01-206"]);
    const zeb = Object.values(variants).find(v => v.component.slug === "rockshox-zeb-ultimate-b1")!;
    expect(zeb.generation).toBe("B1");
    expect(zeb.specs.damping_system).toContain("Charger 3.2");
    expect(zeb.specs.travel_mm).toBe(170);
  });
  it("does not turn an adjustment range into invented commercial variants", () => {
    const ttx = Object.values(variants).filter(v => v.component.slug === "ohlins-ttx22m2-coil");
    expect(ttx).toHaveLength(1);
    expect(ttx[0].specs.stroke_mm).toBe(65);
    expect(ttx[0].specs.coil).toBeUndefined();
    const z1 = Object.values(variants).filter(v => v.component.slug === "marzocchi-bomber-z1-rail");
    expect(z1.map(v => v.manufacturer_code)).toEqual(["912-01-259", "912-01-258", "912-01-257"]);
  });
  it("retains a frame's documented shock restriction when the selected nominal size agrees", () => {
    const configuration: Configuration = { schemaVersion: 1, name: "Documented restriction", items: structuredClone(downhill.presets[0].items) as Configuration["items"] };
    const x2 = Object.values(variants).find(v => v.manufacturer_code === "979-01-213")!;
    const next = choose(configuration, "shock", x2);
    const notes = warnings(next, variants);
    expect(notes.find(w => w.code === "shock_frame_restrictions")?.message).toMatch(/Float X2/i);
    expect(notes.some(w => w.code === "shock_length")).toBe(false);
    expect(next.items.find(i => i.slot === "shock")?.variantId).toBe(x2.id);
  });
});
