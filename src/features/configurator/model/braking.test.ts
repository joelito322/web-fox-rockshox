import { describe, expect, it } from "vitest";
import { parseCatalogImport } from "../../catalog/model/ingestion";
import {
  warnings,
  choose,
  type Configuration,
  type Slot,
  type VariantMap,
} from "./index";
import source from "../../../../supabase/catalog/braking-reviewed.json";
import original from "../../../../supabase/catalog/initial-reviewed.json";
import presets from "../../../../supabase/catalog/enduro-examples.json";
const batch = parseCatalogImport(source);
function fixture() {
  const variants: VariantMap = {};
  for (const catalogue of [parseCatalogImport(original), batch]) {
    for (const v of catalogue.variants) {
      const component = catalogue.components.find(
        (c) => c.id === v.component_id,
      )!;
      variants[v.id] = {
        ...v,
        published: true,
        component: {
          ...component,
          brands: catalogue.brands.find((b) => b.id === component.brand_id)!,
        },
        visual_assets: {
          ...catalogue.assets.find((a) => a.id === v.visual_asset_id)!,
          published: true,
        },
      };
    }
  }
  const configuration: Configuration = {
    schemaVersion: 1,
    name: "Brake review",
    items: structuredClone(presets.presets[0].items) as Configuration["items"],
  };
  const find = (slug: string, label?: string) =>
    Object.values(variants).find(
      (v) => v.component.slug === slug && (!label || v.label.includes(label)),
    )!;
  return { configuration, variants, find };
}
describe("reviewed brake assemblies", () => {
  it("preserves manufacturer-specific fluid, piston count and generation without copying A1 data", () => {
    const { find } = fixture();
    expect(find("shimano-slx-m7100-brake").specs.piston_count).toBe(2);
    expect(find("magura-mt5").specs.fluid).toContain("Royal Blood");
    expect(find("magura-mt5").specs.rotor_thickness_mm).toBe(2);
    const maven = find("sram-maven-brz-b1");
    expect(maven.generation).toBe("B1");
    expect(maven.specs.piston_count).toBe(4);
    expect(maven.specs.fluid).toBe("Maxima Mineral Brake Oil");
    expect(maven.specs.weight_g).toBeUndefined();
    expect(maven.specs.hose).toBeUndefined();
  });
  it.each(["front_brake", "rear_brake"] as Slot[])(
    "selects one caliper/lever assembly and retains the other brake (%s)",
    (slot) => {
      const { configuration, variants, find } = fixture();
      const other = slot === "front_brake" ? "rear_brake" : "front_brake";
      const result = choose(configuration, slot, find("magura-mt5"));
      expect(result.items).toHaveLength(23);
      expect(result.items.find((i) => i.slot === other)).toEqual(
        configuration.items.find((i) => i.slot === other),
      );
      expect(result.items.find((i) => i.slot === slot)?.variantId).toBe(
        find("magura-mt5").id,
      );
      expect(
        variants[result.items.find((i) => i.slot === slot)!.variantId].specs
          .lever_model,
      ).toContain("MT5");
    },
  );
  it("distinguishes unknown thickness from a conflict and permits either visual combination", () => {
    const { configuration, variants, find } = fixture();
    let result = choose(configuration, "front_brake", find("magura-mt5"));
    expect(
      warnings(result, variants).find(
        (w) => w.code === "front_rotor_thickness_unknown",
      )?.level,
    ).toBe("unknown");
    result = choose(result, "front_rotor", find("magura-mdr-p", "203"));
    expect(
      warnings(result, variants).filter((w) =>
        w.code.includes("rotor_thickness"),
      ),
    ).toEqual([]);
    const rotor = find("magura-mdr-p", "203");
    variants[rotor.id] = {
      ...rotor,
      specs: { ...rotor.specs, rotor_thickness_mm: 2.5 },
    };
    expect(
      warnings(result, variants).find((w) => w.code === "front_rotor_thickness")
        ?.level,
    ).toBe("conflict");
    expect(result.items).toHaveLength(23);
  });
});
