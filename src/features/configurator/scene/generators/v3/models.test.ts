import { describe, it, expect } from "vitest";
import source from "../../../../../../supabase/catalog/visual-v3-reviewed.json";
import examples from "../../../../../../supabase/catalog/visual-v3-examples.json";
import braking from "../../../../../../supabase/catalog/braking-reviewed.json";
import suspension from "../../../../../../supabase/catalog/suspension-reviewed.json";
import frames from "../../../../../../supabase/catalog/frames-reviewed.json";
import tyres from "../../../../../../supabase/catalog/tyres-reviewed.json";
import successors from "../../../../../../supabase/catalog/visual-v3-successors.json";
import original from "../../../../../../supabase/catalog/initial-reviewed.json";
import { parseCatalogImport } from "../../../../catalog/model/ingestion";
import { legacyModelProfiles as modelProfiles } from "../../../../catalog/model/visual-profiles";
import type { Configuration, Slot, VariantMap } from "../../../model";
import type { SelectedVariant } from "../../../../catalog/model";
import { slotCategories } from "../../../model";
import { assemblyV2 } from "../../../model/assemblyV2";
import { buildModel } from "../BikeV3";
const catalog = parseCatalogImport(source);
const variants: VariantMap = Object.fromEntries(
  catalog.variants.map((v) => [
    v.id,
    {
      ...v,
      component: {
        ...catalog.components.find((c) => c.id === v.component_id)!,
        brands: catalog.brands.find(
          (b) =>
            b.id ===
            catalog.components.find((c) => c.id === v.component_id)!.brand_id,
        )!,
      },
      visual_assets: catalog.assets.find((a) => a.id === v.visual_asset_id)!,
    },
  ]),
);
const base: Configuration = {
  schemaVersion: 1,
  name: "Geometry review",
  items: examples.presets[0].items as Configuration["items"],
};
describe("immutable model profiles", () => {
  it("covers every model and all original business variants without using old identities", () => {
    expect(new Set(catalog.components.map((c) => c.slug))).toEqual(
      new Set(Object.keys(modelProfiles)),
    );
    expect(catalog.variants).toHaveLength(128);
    for (const v of catalog.variants)
      expect(original.variants.some((old) => old.id === v.id)).toBe(false);
  });
  it("changes only visual identities, keeping business specifications and publication flags", () => {
    const old = [...original.variants, ...braking.variants, ...suspension.variants, ...frames.variants, ...tyres.variants];
    for (const previous of old) {
      const id = successors[previous.id as keyof typeof successors];
      const next = source.variants.find((v) => v.id === id)!;
      expect(next, previous.label).toBeDefined();
      expect({
        ...next,
        id: previous.id,
        visual_asset_id: previous.visual_asset_id,
      }).toEqual(previous);
    }
  });
  it("rejects a profile from another component category before publication", () => {
    const wrong = structuredClone(source);
    wrong.assets[0].manifest.parameters.profile_key = "fox-40-factory-my27";
    expect(() => parseCatalogImport(wrong)).toThrow(/profile/i);
  });
  it("builds finite, bounded exterior meshes for all 128 captures and every category", () => {
    for (const v of Object.values(variants)) {
      const slot = Object.entries(slotCategories).find(
        ([, category]) => category === v.component.category,
      )![0] as Slot;
      const config: Configuration = {
        ...base,
        items: base.items.map((i) =>
          i.slot === slot ? { ...i, variantId: v.id } : i,
        ),
      };
      const get = (s: Slot): SelectedVariant | undefined =>
        variants[config.items.find((i) => i.slot === s)?.variantId ?? ""];
      const surfaces = buildModel(
        slot,
        v,
        assemblyV2(config, variants),
        get,
        "#cc4411",
      );
      expect(surfaces.length, v.component.slug).toBeGreaterThan(0);
      expect(surfaces.length, v.component.slug).toBeLessThan(16);
      for (const s of surfaces) {
        const positions = s.geometry.getAttribute("position");
        expect(positions.count % 3).toBe(0);
        expect(
          Array.from(positions.array).every(Number.isFinite),
          v.label,
        ).toBe(true);
        s.geometry.computeBoundingBox();
        const box = s.geometry.boundingBox!;
        expect(Math.max(box.max.x, box.max.y, box.max.z)).toBeLessThan(3);
        expect(Math.min(box.min.x, box.min.y, box.min.z)).toBeGreaterThan(-3);
        s.geometry.dispose();
      }
    }
  });
  it("places tyre tread on the radius used by assembly, without visibly floating wheels", () => {
    for (const v of Object.values(variants).filter(
      (v) => v.component.category === "tire",
    )) {
      const config = {
        ...base,
        items: base.items.map((i) =>
          i.slot === "front_tire" ? { ...i, variantId: v.id } : i,
        ),
      };
      const get = (s: Slot) =>
        variants[config.items.find((i) => i.slot === s)?.variantId ?? ""];
      const a = assemblyV2(config, variants),
        surfaces = buildModel("front_tire", v, a, get, "#222222");
      const top = Math.max(
        ...surfaces.map((s) => {
          s.geometry.computeBoundingBox();
          return s.geometry.boundingBox!.max.y;
        }),
      );
      expect(
        Math.abs(top - a.front[1] - a.radius("front")),
        v.label,
      ).toBeLessThan(0.005);
      surfaces.forEach((s) => s.geometry.dispose());
    }
  });
  it("keeps measured tyre bead and width differences in the actual mesh bounds", () => {
    const tyres = Object.values(variants).filter(
      (v) => v.component.slug === "cst-bft-c1752",
    );
    const radii = tyres.map((v) => {
      const config = {
        ...base,
        items: base.items.map((i) =>
          i.slot === "front_tire" ? { ...i, variantId: v.id } : i,
        ),
      };
      const get = (s: Slot) =>
        variants[config.items.find((i) => i.slot === s)?.variantId ?? ""];
      const surfaces = buildModel(
        "front_tire",
        v,
        assemblyV2(config, variants),
        get,
        "#222222",
      );
      let size = 0;
      for (const s of surfaces) {
        s.geometry.computeBoundingBox();
        size = Math.max(
          size,
          s.geometry.boundingBox!.max.y - s.geometry.boundingBox!.min.y,
        );
        s.geometry.dispose();
      }
      return size;
    });
    expect(Math.max(...radii) - Math.min(...radii)).toBeGreaterThan(0.01);
  });
});
