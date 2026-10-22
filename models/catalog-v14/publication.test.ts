import { describe, it, expect } from "vitest";
import * as T from "three";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { capraRoots } from "./frames";
import rows from "./predecessors.json";
import protectedCaptures from "./protected-captures.json";
import source from "../../supabase/catalog/frames-v14-reviewed.json";
import mapping from "../../supabase/catalog/frames-v14-successors.json";
import original from "../catalog-v13/uploads.json";
import uploads from "./uploads.json";
import { parseCatalogImport } from "../../src/features/catalog/model/ingestion";
const sha = (file: string) =>
  createHash("sha256").update(readFileSync(file)).digest("hex");
describe("targeted head junctions v14", () => {
  it("changes only CAPRA and preserves all other current frame resources", () => {
    const parsed = parseCatalogImport(source);
    expect(parsed.components).toHaveLength(1);
    expect(parsed.variants).toHaveLength(2);
    expect(parsed.components[0].slug).toBe("yt-capra-mk3-carbon-mx");
    expect(protectedCaptures).toHaveLength(28);
    for (const c of protectedCaptures) expect(sha(c.file)).toBe(c.sha256);
    for (const c of original)
      expect(sha("models/catalog-v13/exports/" + c.file)).toBe(c.sha256);
    expect(() =>
      capraRoots({ ...rows[0], slug: "commencal-meta-sx-v5" }),
    ).toThrow("CAPRA-only");
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
    expect(uploads).toHaveLength(2);
    for (const c of uploads) {
      expect(sha("models/catalog-v14/exports/" + c.file)).toBe(c.sha256);
      expect(c.variant_id).not.toBe(c.predecessor_id);
    }
  });
  it.each(rows)(
    "keeps new root surfaces symmetric for $slug $variant.specs.size_label",
    (row) => {
      const geometry = capraRoots(row),
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
});
