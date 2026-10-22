import { describe, expect, it } from "vitest";
import freshSource from "../../../../../supabase/catalog/frames-v24-reviewed.json";
import oldSource from "../../../../../supabase/catalog/frames-v13-reviewed.json";
import { parseCatalogImport } from "../../../catalog/model/ingestion";
import { selectVariant } from "../../../catalog/model";
import { resolveAssembly } from "../assemblyV2";
import { createMotionDefinition } from "./kinematics";
import type { Configuration } from "../index";
import profile from "./sender-v24.json";

function scenario(source: typeof freshSource, size: string) {
  const data = parseCatalogImport(source);
  const component = data.components.find(
    (c) => c.slug === "canyon-sender-cfr-high-pivot",
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
    name: "Sender resource motion",
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
describe("Sender MY25 motion is versioned by resource", () => {
  it.each(["M", "L"])(
    "uses the new high pivot only for its v24 resource (%s)",
    (size) => {
      const { frame, definition } = scenario(freshSource, size);
      expect(definition.version).toBe("atlas-motion-v2");
      expect(definition.rearBody).toBe("input");
      expect(definition.upperBody).toBe("fixed");
      expect(definition.lowerBody).toBe("output");
      expect(definition.rearAvailable).toBe(true);
      expect(definition.joints.a).toEqual(
        frame.visual_assets!.manifest.anchors.suspension_pivot.position,
      );
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
