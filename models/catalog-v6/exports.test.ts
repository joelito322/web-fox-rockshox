// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as T from "three";
import { parseCatalogImport } from "../../src/features/catalog/model/ingestion";
const catalog = JSON.parse(
  readFileSync("supabase/catalog/visual-v6-reviewed.json", "utf8"),
);
const successors = JSON.parse(
  readFileSync("supabase/catalog/visual-v6-successors.json", "utf8"),
);
const rows = JSON.parse(
  readFileSync("models/catalog-v6/exports/report.json", "utf8"),
) as Record<
  string,
  {
    file: string;
    paintable_nodes: string[];
    anchors: Record<string, [number, number, number]>;
    category: string;
    structure: { connected_groups: string[][] };
  }
>;
describe("v6 multiview mesh capture contracts", () => {
  it("binds 53 model profiles and keeps every published business specification and finish", () => {
    const old = JSON.parse(
      readFileSync("supabase/catalog/visual-v5-reviewed.json", "utf8"),
    );
    const mapping = JSON.parse(
      readFileSync("supabase/catalog/visual-v6-successors.json", "utf8"),
    );
    const fresh = parseCatalogImport(catalog);
    expect(fresh.components).toHaveLength(53);
    expect(fresh.variants).toHaveLength(128);
    for (const v of old.variants) {
      const next = fresh.variants.find((n) => n.id === mapping[v.id])!;
      expect(next.specs).toEqual(v.specs);
      if (
        !["frame", "fork", "shock", "brake"].includes(
          old.components.find((c: any) => c.id === v.component_id).category,
        )
      ) {
        expect(next).toEqual(v);
      } else expect(next.id).not.toBe(v.id);
      expect(next.allowed_finishes).toEqual(v.allowed_finishes);
      expect(next.component_id).toBe(v.component_id);
      expect(next.published).toBe(v.published);
      expect(next.selectable).toBe(v.selectable);
    }
    const bad = structuredClone(catalog);
    const fork = bad.assets.find(
      (a: any) => a.manifest.parameters.mount_space === "fork",
    );
    fork.manifest.parameters.mount_space = "shock";
    expect(() => parseCatalogImport(bad)).toThrow();
    const missing = structuredClone(catalog);
    delete missing.assets.find(
      (a: any) => a.manifest.parameters.mount_space === "fork",
    ).manifest.anchors.axle;
    expect(() => parseCatalogImport(missing)).toThrow();
  });
  it("parses every exported GLB, preserving mounts, paint targets, depth and finite geometry", async () => {
    expect(Object.keys(rows)).toHaveLength(76);
    for (const [id, row] of Object.entries(rows)) {
      expect(row.structure.connected_groups, row.file).toHaveLength(1);
      const data = readFileSync("models/catalog-v6/exports/" + row.file);
      const gltf = await new GLTFLoader().parseAsync(
        data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
        "",
      );
      expect(data.length).toBeLessThan(8388608);
      for (const name of row.paintable_nodes)
        expect(
          gltf.scene.getObjectByName(name),
          row.file + ":" + name,
        ).toBeDefined();
      for (const [name, point] of Object.entries(row.anchors)) {
        const n = gltf.scene.getObjectByName("mount_" + name);
        expect(n, row.file + ":" + name).toBeDefined();
        expect(
          n!
            .getWorldPosition(new T.Vector3())
            .distanceTo(new T.Vector3(...point)),
        ).toBeLessThan(0.00001);
      }
      const variant = catalog.variants.find(
        (v: any) => v.id === successors[id],
      );
      if (row.category === "frame") {
        expect(row.anchors.head_tube[0]).toBeCloseTo(
          variant.specs.geometry.reach_mm / 1000,
          6,
        );
        expect(row.anchors.head_tube[1]).toBeCloseTo(
          variant.specs.geometry.stack_mm / 1000,
          6,
        );
        expect(Math.hypot(...row.anchors.rear_axle)).toBeCloseTo(
          variant.specs.geometry.chainstay_mm / 1000,
          6,
        );
      }
      if (row.category === "shock")
        expect(
          new T.Vector3(...row.anchors.upper_eye).distanceTo(
            new T.Vector3(...row.anchors.lower_eye),
          ),
        ).toBeCloseTo(variant.specs.eye_to_eye_mm / 1000, 6);
      const box = new T.Box3().setFromObject(gltf.scene),
        size = box.getSize(new T.Vector3());
      expect(Math.min(...size.toArray())).toBeGreaterThan(0.025);
      gltf.scene.traverse((n) => {
        if (n instanceof T.Mesh) {
          expect(
            Array.from(n.geometry.getAttribute("position").array).every(
              Number.isFinite,
            ),
          ).toBe(true);
          n.geometry.dispose();
        }
      });
    }
  }, 30000);
});
