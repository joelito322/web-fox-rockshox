import { describe, expect, it, vi } from "vitest";
import * as T from "three";
import source from "../../../../../../supabase/catalog/cockpit-reviewed.json";
import existing from "../../../../../../supabase/catalog/visual-v7-reviewed.json";
import examples from "../../../../../../supabase/catalog/visual-v7-examples.json";
import { parseCatalogImport } from "../../../../catalog/model/ingestion";
import type { Configuration, Slot, VariantMap } from "../../../model";
import { slotCategories, choose } from "../../../model";
import { assemblyV2, resolveAssembly } from "../../../model/assemblyV2";
import { commercialCockpitMount } from "../../../model/assemblyV8";
import { buildCockpit, isCockpitProfile } from "./cockpit";
import { MeshBuilder } from "../v3/mesh";
const catalog = parseCatalogImport(source), old = parseCatalogImport(existing);
const variants: VariantMap = {};
for (const c of [old, catalog]) for (const variant of c.variants) {
  const component = c.components.find(row => row.id === variant.component_id)!;
  variants[variant.id] = { ...variant, component: { ...component, brands: c.brands.find(row => row.id === component.brand_id)! },
    visual_assets: c.assets.find(row => row.id === variant.visual_asset_id)! };
}
const base = { schemaVersion: 1, name: "Cockpit review", items: examples.presets[0].items } as Configuration;
function variantFor(profile: string) { return Object.values(variants).find(v => v.visual_assets?.manifest.parameters.profile_key === profile)!; }
function pair(direct: boolean) {
  const stem = variantFor(direct ? "renthal-integra-35" : "renthal-apex-35");
  const bar = variantFor(direct ? "deity-racepoint-35" : "renthal-fatbar-35");
  const preset = direct ? examples.presets.find(preset => preset.slug.includes("supreme"))! : examples.presets[0];
  const configuration = choose(choose({ ...base, items: preset.items as Configuration["items"] }, "stem", stem), "handlebar", bar);
  const assembly = { ...assemblyV2(configuration, variants), ...resolveAssembly(configuration, variants) };
  return { stem, bar, configuration, assembly };
}
function bounds(surfaces: ReturnType<typeof buildCockpit>) {
  const box = new T.Box3();
  for (const surface of surfaces) { surface.geometry.computeBoundingBox(); box.union(surface.geometry.boundingBox!); }
  return box;
}
function nearestVertexToTriangles(point: T.Vector3, surfaces: ReturnType<typeof buildCockpit>) {
  const nearest = new T.Vector3(), triangle = new T.Triangle();
  let distance = Infinity;
  for (const surface of surfaces) {
    const p = surface.geometry.getAttribute("position");
    for (let i = 0; i < p.count; i += 3) {
      triangle.setFromAttributeAndIndices(p, i, i + 1, i + 2);
      triangle.closestPointToPoint(point, nearest); distance = Math.min(distance, nearest.distanceTo(point));
    }
  }
  return distance;
}
function insideTriangles(geometry: T.BufferGeometry, point: T.Vector3) {
  const positions = geometry.getAttribute("position");
  const ray = new T.Ray(point, new T.Vector3(0.321, 0.812, 0.492).normalize());
  const triangle = new T.Triangle(), hit = new T.Vector3(), distances: number[] = [];
  const index = geometry.index;
  for (let i = 0; i < (index ? index.count : positions.count); i += 3) {
    triangle.setFromAttributeAndIndices(positions,
      index ? index.getX(i) : i,
      index ? index.getX(i + 1) : i + 1,
      index ? index.getX(i + 2) : i + 2);
    if (ray.intersectTriangle(triangle.a, triangle.b, triangle.c, false, hit)) {
      const distance = point.distanceTo(hit);
      if (!distances.some(value => Math.abs(value - distance) < 1e-8)) distances.push(distance);
    }
  }
  return distances.length % 2 === 1;
}
describe("new immutable commercial cockpit v8", () => {
  it("rejects new profiles on old renderers and requires a stem mount", () => {
    const wrong = structuredClone(source); wrong.assets[0].generator_key = "atlas-bike-v7";
    expect(() => parseCatalogImport(wrong)).toThrow(/v8/i);
    const incomplete = structuredClone(source);
    const stem = incomplete.assets.find(asset => asset.manifest.parameters.profile_key === "renthal-apex-35")!;
    stem.manifest.anchors = {};
    expect(() => parseCatalogImport(incomplete)).toThrow(/anchor/i);
  });
  it("keeps legacy assembly objects unchanged", () => {
    const original = assemblyV2(base, variants);
    expect(commercialCockpitMount(original, base, variants)).toBe(original);
  });
  for (const variant of catalog.variants) it(`builds bounded volumetric ${variant.label}`, () => {
    const v = variants[variant.id], slot = Object.entries(slotCategories).find(([, category]) => category === v.component.category)![0] as Slot;
    const configuration = choose(base, slot, v), a = { ...assemblyV2(configuration, variants), ...resolveAssembly(configuration, variants) };
    const key = v.visual_assets!.manifest.parameters.profile_key!;
    expect(isCockpitProfile(key)).toBe(true);
    if (!isCockpitProfile(key)) throw new Error("bad profile");
    const meshes = buildCockpit(key, v, a, "#b7a46e");
    expect(meshes.length).toBeGreaterThan(0); expect(meshes.length).toBeLessThan(8);
    for (const surface of meshes) expect([...surface.geometry.getAttribute("position").array].every(Number.isFinite)).toBe(true);
    const size = bounds(meshes).getSize(new T.Vector3());
    expect(Math.min(size.x, size.y, size.z)).toBeGreaterThan(0.005);
    expect(Math.max(size.x, size.y, size.z)).toBeLessThan(0.9);
    if (slot === "handlebar") expect(size.z).toBeCloseTo(Number(v.specs.width_mm) / 1000, 1);
    if (slot === "saddle") { expect(size.x).toBeCloseTo(0.265, 3); expect(size.z).toBeGreaterThan(0.138); }
    meshes.forEach(surface => surface.geometry.dispose());
  });
  it("joins both Apex steerer lugs and fasteners through overlapping triangle volumes", () => {
    const { stem, assembly } = pair(false), raw: T.BufferGeometry[] = [];
    const original = MeshBuilder.prototype.add;
    // Observe existing component surfaces without changing their dimensions or construction.
    const observe = vi.spyOn(MeshBuilder.prototype, "add").mockImplementation(function(this: MeshBuilder, geometry, ...args) {
      raw.push(geometry.clone());
      return original.call(this, geometry, ...args);
    });
    try {
      const surfaces = buildCockpit("renthal-apex-35", stem, assembly, "#42634f");
      surfaces.forEach(surface => surface.geometry.dispose());
      for (const y of [0.008, 0.03]) {
        const lugRoot = new T.Vector3(assembly.head[0] - 0.014, assembly.head[1] + y, 0.013);
        const boltRoot = new T.Vector3(assembly.head[0] - 0.016, assembly.head[1] + y, 0.018);
        expect(raw.filter(geometry => insideTriangles(geometry, lugRoot)).length).toBeGreaterThanOrEqual(2);
        expect(raw.filter(geometry => insideTriangles(geometry, boltRoot)).length).toBeGreaterThanOrEqual(2);
        const detached = boltRoot.clone().add(new T.Vector3(0, 0, 0.008));
        expect(raw.some(geometry => insideTriangles(geometry, detached))).toBe(false);
      }
    } finally {
      observe.mockRestore(); raw.forEach(geometry => geometry.dispose());
    }
  });
  for (const direct of [false, true]) it(`joins both clamp halves to the 35 mm bar (${direct ? "direct" : "steerer"})`, () => {
    const { stem, bar, assembly } = pair(direct);
    const anchor = stem.visual_assets!.manifest.anchors.bar_clamp.position;
    const origin = direct ? assembly.upperCrown : assembly.head;
    expect(assembly.bar.map((value, i) => value - origin[i])).toEqual(anchor.map(value => expect.closeTo(value, 8)));
    const key = stem.visual_assets!.manifest.parameters.profile_key!;
    if (!isCockpitProfile(key)) throw new Error("bad profile");
    const stemMeshes = buildCockpit(key, stem, assembly, "#242626");
    const barKey = bar.visual_assets!.manifest.parameters.profile_key!;
    if (!isCockpitProfile(barKey)) throw new Error("bad profile");
    const bars = buildCockpit(barKey, bar, assembly, "#b7a46e");
    const at = assembly.bar;
    for (const sign of [-1, 1]) {
      // A point on each side of the 35 mm cylindrical contact surface.
      const sample = new T.Vector3(at[0], at[1] + 0.0175, sign * 0.02);
      expect(nearestVertexToTriangles(sample, stemMeshes)).toBeLessThan(0.0015);
      expect(nearestVertexToTriangles(sample, bars)).toBeLessThan(0.0015);
    }
    for (const surface of [...stemMeshes, ...bars]) surface.geometry.dispose();
  });
});
