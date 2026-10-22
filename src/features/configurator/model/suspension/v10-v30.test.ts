import { describe, expect, it } from "vitest";
import freshSource from "../../../../../supabase/catalog/frames-v30-reviewed.json";
import oldSource from "../../../../../supabase/catalog/frames-v13-reviewed.json";
import { parseCatalogImport } from "../../../catalog/model/ingestion";
import { selectVariant } from "../../../catalog/model";
import { resolveAssembly } from "../assemblyV2";
import { createMotionDefinition } from "./kinematics";
import type { Configuration } from "../index";
import profile from "./v10-v30.json";

function scenario(source: typeof freshSource, size: string) {
  const data = parseCatalogImport(source);
  const component = data.components.find(
    (c) => c.slug === "santa-cruz-v10-8-my27",
  )!;
  const variant = data.variants.find(
    (v) => v.component_id === component.id && v.specs.size_label === size,
  )!;
  const frame = selectVariant(
    {
      ...component,
      brands: data.brands.find((b) => b.id === component.brand_id)!,
      component_variants: [],
    },
    {
      ...variant,
      visual_assets: data.assets.find((a) => a.id === variant.visual_asset_id)!,
    },
  );
  const configuration: Configuration = {
    schemaVersion: 1,
    name: "V10.8 resource motion",
    items: [
      {
        slot: "frame",
        variantId: frame.id,
        finishId: frame.allowed_finishes.options[0].id,
        customColor: null,
      },
    ],
  };
  const variants = { [frame.id]: frame };
  return {
    frame,
    configuration,
    variants,
    definition: createMotionDefinition(
      configuration,
      variants,
      resolveAssembly(configuration, variants),
    )!,
  };
}
describe("V10.8 MK4 motion is versioned by resource", () => {
  it.each(["M", "L"])(
    "uses the new registered four-link only for its v30 resource (%s)",
    (size) => {
      const { definition } = scenario(freshSource, size);
      expect(definition.version).toBe("atlas-motion-v2");
      expect(definition.rearBody).toBe("rear");
      expect(definition.upperBody).toBe("fixed");
      expect(definition.lowerBody).toBe("input");
      expect(definition.rearAvailable).toBe(true);
      const rest = definition.pose(0, 0),
        compressed = definition.pose(0, 1);
      expect(rest.shockUpper).toEqual(compressed.shockUpper);
      expect(compressed.rear[1]).toBeGreaterThan(rest.rear[1]);
      expect(compressed.rear.every(Number.isFinite)).toBe(true);
      expect(
        Math.hypot(
          ...compressed.shockUpper.map((v, i) => v - compressed.shockLower[i]),
        ),
      ).toBeLessThan(
        Math.hypot(...rest.shockUpper.map((v, i) => v - rest.shockLower[i])),
      );
    },
  );
  it.each(["M", "L"])(
    "keeps the legacy articulation and anchors for saved v13 resources (%s)",
    (size) => {
      const legacy = scenario(oldSource as typeof freshSource, size);
      expect(legacy.definition.version).toBe("atlas-motion-v1");
      expect(legacy.definition.rearBody).toBe("rear");
      expect(profile.asset_ids).not.toContain(legacy.frame.visual_assets!.id);
      expect(legacy.definition.pose(0, 0).shockUpper).toEqual(
        legacy.definition.base.shockUpper,
      );
    },
  );
});
