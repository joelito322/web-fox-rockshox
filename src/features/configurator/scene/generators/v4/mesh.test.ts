import { describe, expect, it } from "vitest";
import * as T from "three";
import { SpatialMeshBuilder } from "./mesh";
import { MeshBuilder } from "../v3/mesh";
import source from "../../../../../../supabase/catalog/visual-v4-reviewed.json";
import examples from "../../../../../../supabase/catalog/visual-v4-examples.json";
import { parseCatalogImport } from "../../../../catalog/model/ingestion";
import {
  slotCategories,
  type Slot,
  type Configuration,
  type VariantMap,
} from "../../../model";
import { assemblyV2 } from "../../../model/assemblyV2";
import { buildModel } from "../BikeV3";

describe("spatial sections and complete visual inventory", () => {
  it("keeps transverse bridge volume and preserves the original v3 sweep", () => {
    for (const [Builder, spatial] of [
      [MeshBuilder, false],
      [SpatialMeshBuilder, true],
    ] as const) {
      const b = new Builder();
      b.loft(
        [
          [0, 0, -0.07],
          [0, 0, 0.07],
        ],
        [
          [0.02, 0.03],
          [0.02, 0.03],
        ],
        "#cccccc",
      );
      const surfaces = b.finish();
      surfaces[0].geometry.computeBoundingBox();
      const size = surfaces[0].geometry.boundingBox!.getSize(new T.Vector3());
      expect(size.z).toBeGreaterThan(0.13);
      if (spatial) {
        expect(size.x).toBeCloseTo(0.04, 4);
        expect(size.y).toBeCloseTo(0.06, 4);
      } else expect(size.x).toBe(0);
      surfaces.forEach((s) => s.geometry.dispose());
    }
  });
  it("builds bounded, finite meshes and normals for all 128 v4 captures", () => {
    const catalog = parseCatalogImport(source);
    const variants: VariantMap = Object.fromEntries(
      catalog.variants.map((v) => {
        const component = catalog.components.find(
          (c) => c.id === v.component_id,
        )!;
        return [
          v.id,
          {
            ...v,
            component: {
              ...component,
              brands: catalog.brands.find((b) => b.id === component.brand_id)!,
            },
            visual_assets: catalog.assets.find(
              (a) => a.id === v.visual_asset_id,
            )!,
          },
        ];
      }),
    );
    const base: Configuration = {
      schemaVersion: 1,
      name: "Spatial review",
      items: examples.presets[0].items as Configuration["items"],
    };
    for (const v of Object.values(variants)) {
      const slot = Object.entries(slotCategories).find(
        ([, cat]) => cat === v.component.category,
      )![0] as Slot;
      const config = {
        ...base,
        items: base.items.map((i) =>
          i.slot === slot ? { ...i, variantId: v.id } : i,
        ),
      };
      const get = (s: Slot) =>
        variants[config.items.find((i) => i.slot === s)?.variantId ?? ""];
      const surfaces = buildModel(
        slot,
        v,
        assemblyV2(config, variants),
        get,
        "#cc4411",
        new SpatialMeshBuilder(),
      );
      expect(surfaces.length, v.label).toBeGreaterThan(0);
      for (const s of surfaces) {
        for (const attribute of ["position", "normal"])
          expect(
            Array.from(s.geometry.getAttribute(attribute).array).every(
              Number.isFinite,
            ),
            v.label,
          ).toBe(true);
        s.geometry.computeBoundingSphere();
        expect(s.geometry.boundingSphere!.radius, v.label).toBeLessThan(3);
        s.geometry.dispose();
      }
    }
  });
});
