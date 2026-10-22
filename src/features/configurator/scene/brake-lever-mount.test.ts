// @vitest-environment node
import { describe, expect, it } from "vitest";
import * as T from "three";
import type { SelectedVariant } from "../../catalog/model";
import { leverMount, mountLeverGeometry } from "./brake-lever-mount";
import { buildCockpit } from "./generators/v8/cockpit";
import { buildControls } from "./generators/v3/controls";
import { SpatialMeshBuilder } from "./generators/v4/mesh";
import type { AssemblyV2 } from "../model/assemblyV2";
const bar: [number, number, number] = [0.6, 0.75, 0];
function handlebar(commercial: boolean, width: number, rise: number) {
  return { specs: { width_mm: width, rise_mm: rise, backsweep_deg: 9, upsweep_deg: 5, clamp_diameter_mm: 35 },
    visual_assets: { generator_key: commercial ? "atlas-bike-v8" : "atlas-bike-v5" } } as unknown as SelectedVariant;
}
describe("brake lever mounting", () => {
  for (const commercial of [false, true]) for (const front of [false, true]) for (const rise of [20, 40, 80]) {
    it(`follows the actual ${commercial ? 'commercial' : 'generic'} bar tube (${front ? 'left' : 'right'}, ${rise} mm rise)`, () => {
      const h = handlebar(commercial, 800, rise), mount = leverMount(bar, h, front);
      const builder = new SpatialMeshBuilder();
      const surfaces = commercial
        ? buildCockpit("renthal-fatbar-35", h, { bar } as AssemblyV2, "#777777")
        : (buildControls(builder, "handlebar", h, { bar } as AssemblyV2, "#777777"), builder.finish());
      const meshes = surfaces.map(s => new T.Mesh(s.geometry, new T.MeshBasicMaterial({ side: T.DoubleSide })));
      meshes.forEach(m => m.updateMatrixWorld());
      // The clamp center must lie inside the tube, bounded by its 11–12 mm outer radius.
      const ray = new T.Raycaster(mount.center, new T.Vector3(0, 1, 0));
      const hit = ray.intersectObjects(meshes)[0];
      expect(hit).toBeDefined(); expect(hit.distance).toBeLessThan(0.014);
      const source = new T.BufferGeometry().setAttribute("position", new T.Float32BufferAttribute([
        ...mount.original.toArray(), ...mount.original.clone().add(new T.Vector3(0, 0, 0.008)).toArray(),
        -0.4, 0.05, -0.065,
      ], 3));
      const before = Array.from(source.getAttribute("position").array);
      const mounted = mountLeverGeometry(source, mount), p = mounted.getAttribute("position");
      expect(new T.Vector3().fromBufferAttribute(p, 0).distanceTo(mount.center)).toBeLessThan(1e-7);
      const axis = new T.Vector3().fromBufferAttribute(p, 1).sub(mount.center).normalize();
      expect(axis.dot(new T.Vector3(0, 0, 1).applyQuaternion(mount.rotation))).toBeGreaterThan(0.9999);
      expect(p.getX(2)).toBeCloseTo(-0.4); expect(p.getY(2)).toBeCloseTo(0.05);
      expect(Array.from(source.getAttribute("position").array)).toEqual(before);
      mounted.dispose(); source.dispose(); surfaces.forEach(s => s.geometry.dispose());
      meshes.forEach(m => (m.material as T.Material).dispose());
    });
  }
  it("mirrors the two clamps without changing their common elevation", () => {
    const h = handlebar(true, 760, 35), left = leverMount(bar, h, true), right = leverMount(bar, h, false);
    expect(left.center.x).toBeCloseTo(right.center.x); expect(left.center.y).toBeCloseTo(right.center.y);
    expect(left.center.z).toBeCloseTo(-right.center.z);
  });
});
