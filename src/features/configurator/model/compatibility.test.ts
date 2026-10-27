import { describe, expect, it } from "vitest";
import { parseCatalogImport } from "../../catalog/model/ingestion";
import { frameForkWarnings } from "./compatibility";
import { choose, warnings, emptyConfiguration, type VariantMap } from "./index";
import meta from "../../../../supabase/catalog/frames-v21-reviewed.json";
import nomad from "../../../../supabase/catalog/frames-v22-reviewed.json";
import initial from "../../../../supabase/catalog/initial-reviewed.json";
const variants: VariantMap = {};
for (const source of [meta, nomad, initial]) {
  const batch = parseCatalogImport(source);
  for (const variant of batch.variants) {
    const component = batch.components.find((c) => c.id === variant.component_id)!;
    variants[variant.id] = { ...variant, selectable: true, published: true, component: { ...component, brands: batch.brands.find((b) => b.id === component.brand_id)! }, visual_assets: { ...batch.assets.find((a) => a.id === variant.visual_asset_id)!, published: true } };
  }
}
const find = (slug: string) => structuredClone(Object.values(variants).find((v) => v.component.slug === slug)!);
const frame = () => find("santa-cruz-nomad-7-my27");
const fork = () => find("fox-38-factory-my27");
describe("documented non-blocking compatibility limits", () => {
  it.each([169, 181])("flags Nomad fork travel outside its documented interval (%s)", (travel) => {
    const selected = fork(); selected.specs.travel_mm = travel;
    expect(frameForkWarnings(frame(), selected)).toEqual(expect.arrayContaining([expect.objectContaining({ code: "fork_frame_travel_mm", level: "conflict", slots: ["frame", "fork"] })]));
  });
  it.each([170, 180])("includes the exact documented endpoints (%s)", (travel) => {
    const selected = fork(); selected.specs.travel_mm = travel;
    expect(frameForkWarnings(frame(), selected).some((w) => w.level === "conflict")).toBe(false);
  });
  it("does not treat reference height or missing dimensions as a technical conflict", () => {
    const selected = fork(); selected.specs.travel_mm = 170; selected.specs.axle_to_crown_mm = 620;
    expect(frameForkWarnings(frame(), selected).some((w) => w.level === "conflict")).toBe(false);
    delete selected.specs.travel_mm;
    expect(frameForkWarnings(frame(), selected)).toEqual(expect.arrayContaining([expect.objectContaining({ level: "unknown", code: "fork_frame_travel_mm_unknown" })]));
  });
  it("uses only META maximum height, without inventing a minimum or a travel maximum", () => {
    const selected = fork(); selected.specs.axle_to_crown_mm = 598; selected.specs.travel_mm = 200;
    const current = find("commencal-meta-sx-v5");
    expect(frameForkWarnings(current, selected).some((w) => w.level === "conflict")).toBe(false);
    selected.specs.axle_to_crown_mm = 599;
    expect(frameForkWarnings(current, selected)).toEqual(expect.arrayContaining([expect.objectContaining({ code: "fork_frame_axle_to_crown_mm", level: "conflict" })]));
    selected.specs.axle_to_crown_mm = 570;
    expect(frameForkWarnings(current, selected).some((w) => w.level === "conflict")).toBe(false);
  });
  it("does not apply limits to another generation, year or unreviewed size", () => {
    for (const change of [{ generation: "8" }, { model_year: 2028 }, { specs: { ...frame().specs, size_label: "XL" } }]) {
      const changed = { ...frame(), ...change };
      const selected = fork(); selected.specs.travel_mm = 203;
      expect(frameForkWarnings(changed, selected).some((w) => w.level === "conflict")).toBe(false);
      expect(frameForkWarnings(changed, selected).some((w) => w.level === "unknown")).toBe(true);
    }
  });
  it("keeps the inconsistent assembly selectable and compares frame to rim, not the wrong tyre", () => {
    const current = find("commencal-meta-sx-v5"), selectedFork = fork();
    const rim = find("dt-swiss-e-593"), tire = find("maxxis-assegai");
    expect(rim).toBeDefined(); expect(tire).toBeDefined();
    rim.specs.wheel_bsd_mm = 584; tire.specs.wheel_bsd_mm = 622;
    const map = { [current.id]: current, [selectedFork.id]: selectedFork, [rim.id]: rim, [tire.id]: tire };
    let assembly = emptyConfiguration();
    for (const [slot, variant] of [["frame", current], ["fork", selectedFork], ["rear_rim", rim], ["rear_tire", tire]] as const) assembly = choose(assembly, slot, variant);
    expect(assembly.items).toHaveLength(4);
    const notes = warnings(assembly, map);
    expect(notes.find((w) => w.code === "rear_wheel_mismatch")?.details).toEqual([{ label: "Aro trasero", value: '27,5″' }, { label: "Neumático trasero", value: '29″' }]);
    expect(notes.some((w) => w.code === "rear_frame_wheel")).toBe(false);
    delete tire.specs.wheel_bsd_mm;
    expect(warnings(assembly, map).find((w) => w.code === "rear_wheel_unknown")?.level).toBe("unknown");
  });
});
