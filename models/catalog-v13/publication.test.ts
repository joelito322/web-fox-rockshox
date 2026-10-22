import { describe, it, expect } from "vitest";
import * as T from "three";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { junctionDefinitions, junctionGeometry } from "./frames";
import { openBore } from "./trim";
import rows from "./predecessors.json";
import protectedSlugs from "./protected.json";
import source from "../../supabase/catalog/frames-v13-reviewed.json";
import mapping from "../../supabase/catalog/frames-v13-successors.json";
import original from "../catalog-v11/uploads.json";
import uploads from "./uploads.json";
import { parseCatalogImport } from "../../src/features/catalog/model/ingestion";
const sha = (file: string) =>
  createHash("sha256").update(readFileSync(file)).digest("hex");
describe("targeted head junctions v13", () => {
  it("excludes all five approved models and preserves every original resource", () => {
    const parsed = parseCatalogImport(source);
    expect(parsed.components).toHaveLength(10);
    expect(parsed.variants).toHaveLength(20);
    expect(parsed.components.some((c) => protectedSlugs.includes(c.slug))).toBe(
      false,
    );
    for (const c of original)
      expect(sha("models/catalog-v11/exports/" + c.file)).toBe(c.sha256);
    for (const slug of protectedSlugs)
      expect(() => junctionDefinitions({ ...rows[0], slug })).toThrow(
        "Protected",
      );
    for (const row of rows) {
      const fresh = parsed.variants.find(
        (v) => v.id === mapping[row.variant.id as keyof typeof mapping],
      )!;
      expect(fresh.specs).toEqual(row.variant.specs);
      expect(fresh.allowed_finishes).toEqual(row.variant.allowed_finishes);
      expect(
        parsed.assets.find((a) => a.id === fresh.visual_asset_id)!.manifest
          .anchors,
      ).toEqual(row.asset.manifest.anchors);
    }
  });
  it("captures each successor under a new immutable content hash", () => {
    expect(uploads).toHaveLength(20);
    for (const c of uploads) {
      expect(sha("models/catalog-v13/exports/" + c.file)).toBe(c.sha256);
      expect(c.variant_id).not.toBe(c.predecessor_id);
    }
  });
  it.each(rows)(
    "keeps new root surfaces symmetric for $slug $variant.specs.size_label",
    (row) => {
      const geometry = junctionGeometry(row),
        mesh = new T.Mesh(
          geometry,
          new T.MeshBasicMaterial({ side: T.DoubleSide }),
        );
      mesh.updateMatrixWorld(true);
      geometry.computeBoundingBox();
      const box = geometry.boundingBox!,
        size = box.getSize(new T.Vector3());
      let hits = 0,
        maxError = 0;
      for (let i = 1; i <= 12; i++)
        for (let j = 1; j <= 12; j++) {
          const x = box.min.x + (size.x * i) / 13,
            y = box.min.y + (size.y * j) / 13;
          const a = new T.Raycaster(
              new T.Vector3(x, y, 0.2),
              new T.Vector3(0, 0, -1),
              0,
              0.4,
            ).intersectObject(mesh)[0],
            b = new T.Raycaster(
              new T.Vector3(x, y, -0.2),
              new T.Vector3(0, 0, 1),
              0,
              0.4,
            ).intersectObject(mesh)[0];
          expect(Boolean(a)).toBe(Boolean(b));
          if (a && b) {
            hits++;
            maxError = Math.max(maxError, Math.abs(a.point.z + b.point.z));
          }
        }
      expect(hits).toBeGreaterThan(5);
      expect(maxError).toBeLessThan(0.0001);
      geometry.dispose();
      mesh.material.dispose();
    },
  );
  it("preserves tiny original triangles far from a local cut", () => {
    const geometry = new T.BufferGeometry();
    geometry.setAttribute(
      "position",
      new T.Float32BufferAttribute([0, 0, 0, 0.003, 0, 0, 0, 1e-12, 0], 3),
    );
    geometry.setAttribute(
      "normal",
      new T.Float32BufferAttribute([1, 0, 0, 0, 1, 0, 0, 0, 1], 3),
    );
    const result = openBore(geometry, {
      name: "head",
      start: new T.Vector3(1, 1, 1),
      end: new T.Vector3(1, 2, 1),
      radius: 0.03,
    });
    expect(result.index!.count).toBe(3);
    expect(result.attributes.position.count).toBe(3);
    geometry.dispose();
    result.dispose();
  });
});
