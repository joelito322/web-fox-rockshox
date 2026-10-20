import { describe, expect, it } from "vitest";
import { assembly } from "./assembly";
import {
  emptyConfiguration,
  type Configuration,
  type VariantMap,
} from "./index";
import { componentSchema, selectVariant } from "../../catalog/model";
import catalogue from "../../../../supabase/catalog/initial-reviewed.json";

function frameFixture() {
  const raw = catalogue.components.find((c) => c.category === "frame")!;
  const brand = catalogue.brands.find((b) => b.id === raw.brand_id)!;
  const component = componentSchema.parse({
    ...raw,
    brands: brand,
    component_variants: catalogue.variants
      .filter((v) => v.component_id === raw.id)
      .map((v) => ({
        ...v,
        visual_assets: catalogue.assets.find((a) => a.id === v.visual_asset_id),
      })),
  });
  const frame = selectVariant(component, component.component_variants[0]);
  const configuration: Configuration = {
    ...emptyConfiguration(),
    items: [
      {
        slot: "frame",
        variantId: frame.id,
        finishId: "factory",
        customColor: null,
      },
    ],
  };
  return { frame, configuration };
}

describe("geometry preserves documented dimensions and explicit frame anchors", () => {
  it("uses frame-specific rear axle and wheelbase rather than a shared bicycle silhouette", () => {
    const { frame, configuration } = frameFixture();
    const result = assembly(configuration, { [frame.id]: frame });
    expect(result.front[0] - result.rear[0]).toBeCloseTo(
      (frame.specs.geometry as { wheelbase_mm: number }).wheelbase_mm / 1000,
      5,
    );
    expect(result.origin("rear_hub")).toEqual(result.rear);
    expect(result.origin("front_rotor")).toEqual(result.front);
  });
  it("keeps the ground below both wheels when front and rear diameters differ", () => {
    const { frame, configuration } = frameFixture();
    const front = {
      ...frame,
      id: crypto.randomUUID(),
      specs: { outer_diameter_mm: 750 },
    };
    const rear = {
      ...frame,
      id: crypto.randomUUID(),
      specs: { wheel_bsd_mm: 584, tire_width_mm: 60 },
    };
    const variants: VariantMap = {
      [frame.id]: frame,
      [front.id]: front,
      [rear.id]: rear,
    };
    configuration.items.push(
      {
        slot: "front_tire",
        variantId: front.id,
        finishId: "black",
        customColor: null,
      },
      {
        slot: "rear_tire",
        variantId: rear.id,
        finishId: "black",
        customColor: null,
      },
    );
    const result = assembly(configuration, variants);
    expect(result.radius("front")).toBe(0.375);
    expect(result.radius("rear")).toBe(0.352);
    expect(result.ground).toBeLessThan(
      result.front[1] - result.radius("front"),
    );
    expect(result.ground).toBeLessThan(result.rear[1] - result.radius("rear"));
  });
});
