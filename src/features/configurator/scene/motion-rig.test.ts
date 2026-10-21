import { describe, it, expect, vi } from "vitest";
import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import source from "../../../../supabase/catalog/visual-v7-reviewed.json";
import { parseCatalogImport } from "../../catalog/model/ingestion";
import { selectVariant } from "../../catalog/model";
import { resolveAssembly } from "../model/assemblyV2";
import { createMotionDefinition } from "../model/suspension/kinematics";
import type { Configuration } from "../model";
import { createMotionRig } from "./motion-rig";
const catalog = parseCatalogImport(source),
  component = catalog.components.find(
    (c) => c.slug === "commencal-supreme-dh-v5",
  )!,
  variant = catalog.variants.find(
    (v) => v.component_id === component.id && v.selectable,
  )!;
const selected = selectVariant(
  {
    ...component,
    brands: catalog.brands.find((b) => b.id === component.brand_id)!,
    component_variants: [],
  },
  {
    ...variant,
    visual_assets: catalog.assets.find(
      (a) => a.id === variant.visual_asset_id,
    )!,
  },
);
const configuration: Configuration = {
  schemaVersion: 1,
  name: "Rig",
  items: [
    {
      slot: "frame",
      variantId: variant.id,
      finishId: variant.allowed_finishes.default_finish_id,
      customColor: null,
    },
  ],
};
const variants = { [variant.id]: selected },
  definition = createMotionDefinition(
    configuration,
    variants,
    resolveAssembly(configuration, variants),
  )!;
describe("owned motion instances", () => {
  it("keeps source buffers/materials immutable and restores the same rest bounds after movement", () => {
    const a = new T.BoxGeometry(0.02, 0.02, 0.02),
      b = new T.BoxGeometry(0.02, 0.02, 0.02);
    a.translate(0.45, 0.55, 0);
    b.translate(...definition.base.rear);
    const geometry = mergeGeometries([a, b]),
      material = new T.MeshStandardMaterial(),
      mesh = new T.Mesh(geometry, material),
      source = new T.Group();
    source.add(mesh);
    const original = Array.from(geometry.getAttribute("position").array),
      disposed = vi.spyOn(geometry, "dispose"),
      releaseMaterial = vi.spyOn(material, "dispose");
    const rig = createMotionRig(source, "frame", definition),
      before = new T.Box3().setFromObject(rig.object);
    expect(rig.groups.size).toBeGreaterThan(1);
    rig.apply(definition.pose(0, 1));
    rig.object.updateMatrixWorld(true);
    expect(Array.from(geometry.getAttribute("position").array)).toEqual(
      original,
    );
    rig.apply(definition.pose(0, 0));
    rig.object.updateMatrixWorld(true);
    const after = new T.Box3().setFromObject(rig.object);
    expect(after.min.distanceTo(before.min)).toBeLessThan(1e-8);
    expect(after.max.distanceTo(before.max)).toBeLessThan(1e-8);
    rig.dispose();
    expect(disposed).not.toHaveBeenCalled();
    expect(releaseMaterial).not.toHaveBeenCalled();
    geometry.dispose();
    material.dispose();
    a.dispose();
    b.dispose();
  });
  it("moves fork lowers while keeping crown and stanchions rigid", () => {
    const crown = new T.BoxGeometry(0.04, 0.025, 0.1);
    crown.translate(0, 0.05, 0);
    const lower = new T.BoxGeometry(0.04, 0.2, 0.1);
    lower.translate(0, -0.4, 0);
    const source = new T.Group();
    source.add(
      new T.Mesh(mergeGeometries([crown, lower]), new T.MeshStandardMaterial()),
    );
    const rig = createMotionRig(source, "fork", definition);
    expect([...rig.groups.keys()].sort()).toEqual(["fixed", "sliding"]);
    const pose = { ...definition.pose(0, 0), forkCompression: 0.1 };
    rig.apply(pose);
    expect(rig.groups.get("fixed")!.position.y).toBe(0);
    expect(rig.groups.get("sliding")!.position.y).toBe(0.1);
    rig.dispose();
  });
  it("does not modify the persistent configuration during inspection", () => {
    const snapshot = structuredClone(configuration);
    for (let i = 0; i <= 100; i++) definition.pose(i / 100, i / 100);
    expect(configuration).toEqual(snapshot);
  });
});
