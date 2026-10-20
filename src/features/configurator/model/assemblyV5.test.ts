import { describe, it, expect } from "vitest";
import source from "../../../../supabase/catalog/visual-v5-reviewed.json";
import presets from "../../../../supabase/catalog/visual-v5-examples.json";
import { parseCatalogImport } from "../../catalog/model/ingestion";
import { resolveAssembly } from "./assemblyV2";
import { importedMount, rotatePoint } from "./assemblyV5";
import type { Configuration, VariantMap } from "./index";
const catalog = parseCatalogImport(source);
function setup(index = 0) {
  const preset = presets.presets[index];
  const configuration = {
    schemaVersion: 1,
    name: preset.name,
    items: structuredClone(preset.items),
  } as Configuration;
  const variants: VariantMap = {};
  for (const v of catalog.variants) {
    const component = catalog.components.find((c) => c.id === v.component_id)!;
    variants[v.id] = {
      ...v,
      visual_assets: catalog.assets.find((a) => a.id === v.visual_asset_id)!,
      component: {
        ...component,
        brands: catalog.brands.find((b) => b.id === component.brand_id)!,
      },
    };
  }
  return { configuration, variants };
}
describe("versioned GLB assembly", () => {
  for (const index of [0, 1, 2, 3])
    it(`fits fork mounts and grounds both tyres without scaling on preset ${index}`, () => {
      const { configuration, variants } = setup(index),
        a = resolveAssembly(configuration, variants);
      const fork =
        variants[configuration.items.find((i) => i.slot === "fork")!.variantId]
          .visual_assets!;
      const mount = importedMount("fork", fork, a),
        local = rotatePoint(
          fork.manifest.anchors.axle.position,
          mount.rotation[2],
        );
      expect(
        a.front
          .map((v, i) => v - mount.position[i] - local[i])
          .every((v) => Math.abs(v) < 1e-8),
      ).toBe(true);
      expect("settleAngle" in a).toBe(true);
      const angle = Number((a as any).settleAngle);
      const rear = rotatePoint(a.rear, angle),
        front = rotatePoint(a.front, angle);
      expect(rear[1] - a.radius("rear")).toBeCloseTo(
        front[1] - a.radius("front"),
        7,
      );
      const shock =
        variants[
          configuration.items.find((i) => i.slot === "shock")!.variantId
        ];
      expect(
        Math.hypot(...a.shockLower.map((v, i) => v - a.shockUpper[i])),
      ).toBeCloseTo(Number(shock.specs.eye_to_eye_mm) / 1000, 6);
    });
  it("orients the Nomad reservoir above the shaft while retaining shock length", () => {
    const { configuration, variants } = setup();
    const frame = Object.values(variants).find(
      (v) => v.component.slug === "santa-cruz-nomad-7-my27",
    )!;
    configuration.items.find((i) => i.slot === "frame")!.variantId = frame.id;
    const assembly = resolveAssembly(configuration, variants);
    const shock =
      variants[configuration.items.find((i) => i.slot === "shock")!.variantId];
    const pose = importedMount("shock", shock.visual_assets!, assembly);
    const reservoirSide = rotatePoint(
      [Math.cos(pose.localRotation[1]), 0, -Math.sin(pose.localRotation[1])],
      pose.rotation[2],
    );
    expect(reservoirSide[1]).toBeGreaterThan(0);
    expect(
      Math.hypot(
        ...assembly.shockLower.map((v, i) => v - assembly.shockUpper[i]),
      ),
    ).toBeCloseTo(Number(shock.specs.eye_to_eye_mm) / 1000, 6);
  });
  it("keeps unsupported/mismatched mounting spaces out of old resources", () => {
    const { configuration, variants } = setup();
    const a = resolveAssembly(configuration, variants);
    const asset = structuredClone(
      catalog.assets.find((v) => v.kind === "glb")!,
    );
    delete asset.manifest.parameters.mount_space;
    delete asset.manifest.parameters.assembly_version;
    expect(importedMount("fork", asset, a)).toEqual({
      position: a.origin("fork"),
      rotation: [0, 0, 0],
      localRotation: [0, 0, 0],
    });
  });
});
