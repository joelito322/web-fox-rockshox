import { describe, it, expect } from "vitest";
import * as T from "three";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { buildNewFrame } from "./capra-builder";
import rows from "./predecessors.json";
import protectedCaptures from "./protected-captures.json";
import source from "../../supabase/catalog/frames-v15-reviewed.json";
import mapping from "../../supabase/catalog/frames-v15-successors.json";
import original from "../catalog-v14/uploads.json";
import uploads from "./uploads.json";
import { parseCatalogImport } from "../../src/features/catalog/model/ingestion";
const sha = (file: string) =>
  createHash("sha256").update(readFileSync(file)).digest("hex");
describe("targeted head junctions v15", () => {
  it("changes only CAPRA and preserves all other current frame resources", () => {
    const parsed = parseCatalogImport(source);
    expect(parsed.components).toHaveLength(1);
    expect(parsed.variants).toHaveLength(2);
    expect(parsed.components[0].slug).toBe("yt-capra-mk3-carbon-mx");
    expect(protectedCaptures).toHaveLength(28);
    for (const c of protectedCaptures) expect(sha(c.file)).toBe(c.sha256);
    for (const c of original)
      expect(sha("models/catalog-v14/exports/" + c.file)).toBe(c.sha256);
    expect(() =>
      buildNewFrame("commencal-meta-sx-v5", rows[0].variant),
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
      expect(sha("models/catalog-v15/exports/" + c.file)).toBe(c.sha256);
      expect(c.variant_id).not.toBe(c.predecessor_id);
    }
  });
  it.each(rows)(
    "keeps all declared long members and their contours straight for $variant.specs.size_label",
    (row) => {
      const built = buildNewFrame("yt-capra-mk3-carbon-mx", row.variant);
      expect(built.pathEvidence.length).toBeGreaterThan(5);
      for (const member of built.pathEvidence) {
        const { samples, straightRanges } = member.sampled;
        for (const range of straightRanges) {
          const start = samples[range.from],
            end = samples[range.to],
            line = new T.Line3(start.point, end.point),
            normal = new T.Vector3(0, 0, 1).cross(start.tangent).normalize();
          for (let i = range.from; i <= range.to; i++) {
            const p = samples[i];
            expect(
              line
                .closestPointToPoint(p.point, true, new T.Vector3())
                .distanceTo(p.point),
            ).toBeLessThan(1e-9);
            expect(p.tangent.distanceTo(start.tangent)).toBeLessThan(1e-9);
            for (const side of [-1, 1]) {
              const edge = new T.Line3(
                start.point
                  .clone()
                  .addScaledVector(normal, side * start.height),
                end.point.clone().addScaledVector(normal, side * end.height),
              );
              const point = p.point
                .clone()
                .addScaledVector(normal, side * p.height);
              expect(
                edge
                  .closestPointToPoint(point, true, new T.Vector3())
                  .distanceTo(point),
              ).toBeLessThan(1e-9);
            }
          }
        }
      }
      built.surfaces.forEach((s) => s.geometry.dispose());
    },
  );
});
