import { describe, it, expect } from "vitest";
import data from "../../../../supabase/catalog/visual-v7-reviewed.json";
import { parseCatalogImport } from "../../catalog/model/ingestion";
import { selectVariant } from "../../catalog/model";
import { slots, emptyConfiguration, type Slot } from "./index";
import {
  assemblyGroups,
  pairedSlot,
  wheelFilters,
  counterpart,
  chooseTogether,
} from "./guided";
const source = parseCatalogImport(data);
const variants = source.variants
  .filter((v) => v.published && v.selectable)
  .map((v) => {
    const component = source.components.find((c) => c.id === v.component_id)!;
    return selectVariant(
      {
        ...component,
        brands: source.brands.find((b) => b.id === component.brand_id)!,
        component_variants: [],
      },
      {
        ...v,
        visual_assets: source.assets.find((a) => a.id === v.visual_asset_id)!,
      },
    );
  });
describe("guided assembly", () => {
  it("indexes every saved position exactly once, including independent hubs", () => {
    const indexed = assemblyGroups.flatMap((g) =>
      g.entries.flatMap((e) => e.slots),
    ) as Slot[];
    expect([...indexed].sort()).toEqual([...slots].sort());
    expect(new Set(indexed).size).toBe(slots.length);
    expect(pairedSlot("front_hub")).toBeUndefined();
    expect(pairedSlot("rear_brake")).toBe("front_brake");
    expect(pairedSlot("front_tire")).toBe("rear_tire");
  });
  it("filters wheel dimensions by position without constraining unrelated categories", () => {
    expect(wheelFilters("mixed", "frame")).toEqual({
      wheel_front: "29",
      wheel_rear: "27.5",
    });
    expect(wheelFilters("mixed", "fork")).toEqual({ wheel_bsd_mm: "622" });
    expect(wheelFilters("mixed", "rear_rim")).toEqual({ wheel_bsd_mm: "584" });
    expect(wheelFilters("29", "rear_tire")).toEqual({ wheel_bsd_mm: "622" });
    expect(wheelFilters("27.5", "front_tire")).toEqual({ wheel_bsd_mm: "584" });
    expect(wheelFilters("29", "front_rotor")).toEqual({});
    expect(wheelFilters("all", "frame")).toEqual({});
  });
  it("resolves a mixed wheel counterpart only from the same product and specification", () => {
    const rim = variants.find(
      (v) => v.component.category === "rim" && v.specs.wheel_bsd_mm === 622,
    )!;
    const other = counterpart(rim, 584, variants)!;
    expect(other).toBeDefined();
    expect(other.component.id).toBe(rim.component.id);
    expect(other.specs.wheel_bsd_mm).toBe(584);
    expect(
      counterpart(rim, 584, [
        { ...other, specs: { ...other.specs, inner_width_mm: 999 } },
      ]),
    ).toBeUndefined();
    expect(
      counterpart(rim, 584, [other, { ...other, id: crypto.randomUUID() }]),
    ).toBeUndefined();
    expect(
      counterpart(rim, 584, [{ ...other, selectable: false }]),
    ).toBeUndefined();
  });
  it("commits both positions as one operation and leaves the original intact on failure", () => {
    const rim = variants.find((v) => v.component.category === "rim")!;
    const original = emptyConfiguration();
    const next = chooseTogether(original, [
      { slot: "front_rim", variant: rim },
      { slot: "rear_rim", variant: rim },
    ]);
    expect(next.items).toHaveLength(2);
    expect(original.items).toEqual([]);
    expect(() =>
      chooseTogether(original, [
        { slot: "front_rim", variant: rim },
        { slot: "rear_rim", variant: { ...rim, selectable: false } },
      ]),
    ).toThrow();
    expect(original.items).toEqual([]);
  });
});
