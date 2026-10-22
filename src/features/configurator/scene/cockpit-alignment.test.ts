// @vitest-environment node
import { describe, expect, it } from "vitest";
import * as T from "three";
import { parseCatalogImport } from "../../catalog/model/ingestion";
import type { SelectedVariant } from "../../catalog/model";
import type { AssemblyV2 } from "../model/assemblyV2";
import { resolveAssembly } from "../model/assemblyV2";
import type { Configuration, VariantMap } from "../model";
import { SpatialMeshBuilder } from "./generators/v4/mesh";
import { buildControls } from "./generators/v3/controls";
import { buildCockpit, type CockpitProfile } from "./generators/v8/cockpit";
import { buildDerailleur } from "./generators/v3/drivetrain";
import { leverMount, shifterMount, mountLeverGeometry } from "./brake-lever-mount";
const sourceData = import.meta.glob([
  "../../../../supabase/catalog/visual-v7-reviewed.json",
  "../../../../supabase/catalog/cockpit-reviewed.json",
  "../../../../supabase/catalog/frames-v*-reviewed.json",
], { eager: true, import: "default" });
const files = Object.keys(sourceData).filter(n => !n.endsWith("frames-v12-reviewed.json"))
  .sort((a, b) => Number(a.match(/frames-v(\d+)/)?.[1] ?? 0) - Number(b.match(/frames-v(\d+)/)?.[1] ?? 0));
const variants: VariantMap = {};
const latestFrames = new Map<string, SelectedVariant>();
for (const name of files) {
  const data = parseCatalogImport(sourceData[name]);
  for (const v of data.variants) {
    const component = data.components.find(c => c.id === v.component_id)!;
    const selected = { ...v, visual_assets: data.assets.find(a => a.id === v.visual_asset_id)!,
      component: { ...component, brands: data.brands.find(b => b.id === component.brand_id)! } };
    variants[v.id] = selected;
    if (component.category === "frame") latestFrames.set(component.slug, selected);
  }
}
const all = Object.values(variants), bars = all.filter(v => v.component.category === "handlebar");
const stems = all.filter(v => v.component.category === "stem");
const gears = all.filter(v => v.component.category === "rear_derailleur");
function config(frame: SelectedVariant, bar: SelectedVariant, stem: SelectedVariant): Configuration {
  const fork = all.find(v => v.component.category === "fork" && v.component.slug.includes(stem.specs.mount_type === "direct_mount" ? "fox-40" : "fox-38"))!;
  return { schemaVersion: 1, name: "Cockpit audit", items: [frame, bar, stem, fork].map((v, i) => ({
    slot: ["frame", "handlebar", "stem", "fork"][i], variantId: v.id,
    finishId: v.allowed_finishes.options[0].id,
  })) } as Configuration;
}
function meshRay(surfaces: ReturnType<SpatialMeshBuilder["finish"]>, at: T.Vector3, direction: T.Vector3) {
  const meshes = surfaces.map(s => new T.Mesh(s.geometry, new T.MeshBasicMaterial({ side: T.DoubleSide })));
  meshes.forEach(m => m.updateMatrixWorld());
  const hits = new T.Raycaster(at, direction).intersectObjects(meshes);
  meshes.forEach(m => (m.material as T.Material).dispose());
  return hits;
}
describe("cockpit alignment across catalog choices", () => {
  it("keeps all stem bar clamps centered on the selected handlebar across all frame families", () => {
    expect(latestFrames.size).toBe(15); expect(stems.length).toBeGreaterThanOrEqual(4);
    for (const frame of latestFrames.values()) for (const stem of stems) for (const bar of bars) {
      const configuration = config(frame, bar, stem);
      const base = resolveAssembly(configuration, variants) as AssemblyV2;
      const builder = new SpatialMeshBuilder();
      const surfaces = stem.visual_assets!.generator_key === "atlas-bike-v8"
        ? buildCockpit(stem.visual_assets!.manifest.parameters.profile_key as CockpitProfile, stem, base, "#777777")
        : (buildControls(builder, "stem", stem, base, "#777777"), builder.finish());
      const center = new T.Vector3(...base.bar);
      const hit = meshRay(surfaces, center, new T.Vector3(-1, 0, 0))[0];
      expect(hit, stem.component.slug).toBeDefined();
      expect(hit.distance).toBeLessThan(0.026);
      expect(base.origin("handlebar")).toEqual(base.bar);
      const direct = stem.specs.mount_type === "direct_mount";
      const support = new T.Vector3(...(direct ? base.upperCrown : base.head));
      if (direct) support.set(support.x + 0.005, support.y + 0.003, 0.024);
      else support.y += 0.02;
      const supportHit = meshRay(surfaces, support, new T.Vector3(0, 0, 1))[0];
      expect(supportHit, `${stem.component.slug} support`).toBeDefined();
      expect(supportHit.distance).toBeLessThan(0.04);
      // A commercial stem's source anchor must resolve from the correct attachment.
      if (stem.visual_assets!.generator_key === "atlas-bike-v8") {
        const anchor = stem.visual_assets!.manifest.anchors.bar_clamp.position;
        const start = stem.specs.mount_type === "direct_mount" ? base.upperCrown : base.head;
        expect(base.bar).toEqual(start.map((v, i) => v + anchor[i]));
      }
      surfaces.forEach(s => s.geometry.dispose());
    }
  });
  it("mounts every shifter on the right-hand tube, independent of width and rise, without moving the derailleur", () => {
    expect(gears.length).toBeGreaterThan(0);
    const frame = [...latestFrames.values()][0];
    for (const gear of gears) for (const bar of bars) for (const stem of stems) {
      const base = resolveAssembly(config(frame, bar, stem), variants) as AssemblyV2;
      const mount = shifterMount(base.bar, bar), brake = leverMount(base.bar, bar, false);
      expect(mount.center.z).toBeLessThan(brake.center.z);
      expect(mount.center.y).toBeGreaterThan(base.bar[1]);
      const builder = new SpatialMeshBuilder();
      buildDerailleur(builder, gear.visual_assets!.manifest.parameters.profile_key!, gear, base, "#777777");
      const surfaces = builder.finish();
      for (const s of surfaces) {
        const mounted = mountLeverGeometry(s.geometry, mount, true);
        const a = s.geometry.getAttribute("position"), b = mounted.getAttribute("position");
        for (let i = 0; i < a.count; i++) {
          if (a.getX(i) < base.rear[0] + 0.2) {
            expect(b.getX(i)).toBe(a.getX(i)); expect(b.getY(i)).toBe(a.getY(i)); expect(b.getZ(i)).toBe(a.getZ(i));
          } else {
            const expected = new T.Vector3().fromBufferAttribute(a, i).sub(mount.original).applyQuaternion(mount.rotation).add(mount.center);
            expect(new T.Vector3().fromBufferAttribute(b, i).distanceTo(expected)).toBeLessThan(2e-7);
          }
        }
        mounted.dispose(); s.geometry.dispose();
      }
    }
  });
});
