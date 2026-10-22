import { describe, it, expect } from "vitest";
import * as T from "three";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { buildMeta, metaRegistration } from "./frames";
import rows from "./predecessors.json";
import protectedCaptures from "./protected-captures.json";
import source from "../../supabase/catalog/frames-v21-reviewed.json";
import mapping from "../../supabase/catalog/frames-v21-successors.json";
import original from "../catalog-v20/uploads.json";
import uploads from "./uploads.json";
import { parseCatalogImport } from "../../src/features/catalog/model/ingestion";
const sha = (file: string) =>
  createHash("sha256").update(readFileSync(file)).digest("hex");
describe("COMMENCAL META SX V5 full frame v21", () => {
  it("changes only COMMENCAL META SX V5 and preserves all other current frame resources", () => {
    const parsed = parseCatalogImport(source);
    expect(parsed.components).toHaveLength(1);
    expect(parsed.variants).toHaveLength(2);
    expect(parsed.components[0].slug).toBe("commencal-meta-sx-v5");
    expect(protectedCaptures).toHaveLength(28);
    for (const c of protectedCaptures) expect(sha(c.file)).toBe(c.sha256);
    for (const c of original)
      expect(sha("models/catalog-v20/exports/" + c.file)).toBe(c.sha256);
    expect(() =>
      buildMeta({ ...rows[0], slug: "gt-fury-carbon-high-pivot" }),
    ).toThrow("META-only");
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
      expect(sha("models/catalog-v21/exports/" + c.file)).toBe(c.sha256);
      expect(c.variant_id).not.toBe(c.predecessor_id);
    }
  });
  it.each(rows)(
    "keeps all declared long members and their contours straight for $variant.specs.size_label",
    (row) => {
      const built = buildMeta(row);
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
      built.geometry.dispose();
    },
  );
  it.each(rows)(
    "keeps the upper shock support fixed and lower eye free of a fixed paint bridge for $variant.specs.size_label",
    (row) => {
      const built = buildMeta(row),
        material = new T.MeshBasicMaterial({ side: T.DoubleSide }),
        mesh = new T.Mesh(built.geometry, material);
      mesh.updateMatrixWorld(true);
      const cast = (at: number[]) => {
        const p = new T.Vector3(...at);
        p.y += 0.007;
        p.z = 0.15;
        return new T.Raycaster(
          p,
          new T.Vector3(0, 0, -1),
          0,
          0.3,
        ).intersectObject(mesh).length;
      };
      expect(
        cast(row.asset.manifest.anchors.shock_upper.position),
      ).toBeGreaterThan(0);
      expect(cast(row.asset.manifest.anchors.shock_lower.position)).toBe(0);
      built.geometry.dispose();
      material.dispose();
    },
  );
  it.each(rows)(
    "connects the fixed shock eye to the top member and keeps the rear upright on both sides for $variant.specs.size_label",
    (row) => {
      const built = buildMeta(row),
        geometry = built.geometry,
        material = new T.MeshBasicMaterial({ side: T.DoubleSide }),
        mesh = new T.Mesh(geometry, material);
      mesh.updateMatrixWorld(true);
      const xy = metaRegistration(row);
      const cast = (pixel: number[]) => {
        const p = xy(pixel);
        p.z = 0.15;
        return new T.Raycaster(
          p,
          new T.Vector3(0, 0, -1),
          0,
          0.3,
        ).intersectObject(mesh).length;
      };
      expect(cast([796, 250])).toBeGreaterThan(0);
      const rear = built.pathEvidence.filter((p) => p.name === "rear_upright");
      expect(rear).toHaveLength(2);
      expect(rear[0].side).toBe(-rear[1].side);
      for (let i = 0; i < rear[0].sampled.samples.length; i++) {
        const a = rear[0].sampled.samples[i].point,
          b = rear[1].sampled.samples[i].point;
        expect(a.x).toBeCloseTo(b.x, 10);
        expect(a.y).toBeCloseTo(b.y, 10);
        expect(a.z).toBeCloseTo(-b.z, 10);
      }
      geometry.dispose();
      material.dispose();
    },
  );
});
