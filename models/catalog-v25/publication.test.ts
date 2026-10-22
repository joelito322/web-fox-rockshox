import { describe, it, expect } from "vitest";
import * as T from "three";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  buildSupreme,
  buildSupremeLinks,
  supremeAnchors,
  supremeRegistration,
} from "./frames";
import rows from "./predecessors.json";
import protectedCaptures from "./protected-captures.json";
import source from "../../supabase/catalog/frames-v25-reviewed.json";
import mapping from "../../supabase/catalog/frames-v25-successors.json";
import original from "../catalog-v24/uploads.json";
import uploads from "./uploads.json";
import { parseCatalogImport } from "../../src/features/catalog/model/ingestion";
const sha = (file: string) =>
  createHash("sha256").update(readFileSync(file)).digest("hex");
describe("COMMENCAL SUPREME DH V5 full frame v25", () => {
  it("changes only COMMENCAL SUPREME DH V5 and preserves all other current frame resources", () => {
    const parsed = parseCatalogImport(source);
    expect(parsed.components).toHaveLength(1);
    expect(parsed.variants).toHaveLength(2);
    expect(parsed.components[0].slug).toBe("commencal-supreme-dh-v5");
    expect(protectedCaptures).toHaveLength(28);
    for (const c of protectedCaptures) expect(sha(c.file)).toBe(c.sha256);
    for (const c of original)
      expect(sha("models/catalog-v24/exports/" + c.file)).toBe(c.sha256);
    expect(() =>
      buildSupreme({ ...rows[0], slug: "gt-fury-carbon-high-pivot" }),
    ).toThrow("SUPREME-only");
    for (const row of rows) {
      const fresh = parsed.variants.find(
        (v) => v.id === mapping[row.variant.id as keyof typeof mapping],
      )!;
      expect(fresh.specs).toEqual(row.variant.specs);
      expect(fresh.allowed_finishes).toEqual(row.variant.allowed_finishes);
      expect(
        parsed.assets.find((a) => a.id === fresh.visual_asset_id)!.manifest
          .anchors,
      ).toEqual(supremeAnchors(row));
    }
  });
  it("captures each successor under a new immutable content hash", () => {
    expect(uploads).toHaveLength(2);
    for (const c of uploads) {
      expect(sha("models/catalog-v25/exports/" + c.file)).toBe(c.sha256);
      expect(c.variant_id).not.toBe(c.predecessor_id);
    }
  });
  it.each(rows)(
    "keeps all declared long members and their contours straight for $variant.specs.size_label",
    (row) => {
      const built = buildSupreme(row);
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
    "supports both moving shock eyes without a fixed paint bridge for $variant.specs.size_label",
    (row) => {
      const built = buildSupreme(row),
        links = buildSupremeLinks(row),
        material = new T.MeshBasicMaterial({ side: T.DoubleSide }),
        fixed = new T.Mesh(built.geometry, material),
        moving = new T.Mesh(links, material);
      fixed.updateMatrixWorld(true);
      moving.updateMatrixWorld(true);
      for (const key of ["shock_upper", "shock_lower"]) {
        const eye = new T.Vector3(...row.asset.manifest.anchors[key].position);
        eye.y += 0.007;
        expect(
          new T.Raycaster(
            eye.clone().setZ(0.016),
            new T.Vector3(0, 0, -1),
            0,
            0.032,
          ).intersectObject(fixed).length,
        ).toBe(0);
        expect(
          new T.Raycaster(
            eye.clone().setZ(0.15),
            new T.Vector3(0, 0, -1),
            0,
            0.3,
          ).intersectObject(moving).length,
        ).toBeGreaterThan(0);
      }
      links.dispose();
      built.geometry.dispose();
      material.dispose();
    },
  );
  it.each(rows)(
    "opens its triangular frame gap and six-bar window for $variant.specs.size_label",
    (row) => {
      const built = buildSupreme(row),
        links = buildSupremeLinks(row),
        material = new T.MeshBasicMaterial({ side: T.DoubleSide }),
        xy = supremeRegistration(row);
      const hit = (g: T.BufferGeometry, p: number[]) => {
        const mesh = new T.Mesh(g, material);
        mesh.updateMatrixWorld(true);
        return new T.Raycaster(
          xy(p).setZ(0.15),
          new T.Vector3(0, 0, -1),
          0,
          0.3,
        ).intersectObject(mesh).length;
      };
      expect(hit(built.geometry, [570, 466])).toBe(0);
      expect(hit(built.geometry, [604, 716])).toBe(0);
      expect(hit(built.geometry, [640, 735])).toBeGreaterThan(0);
      expect(hit(built.geometry, [581, 538])).toBeGreaterThan(0);
      expect(hit(links, [522, 640])).toBe(0);
      expect(hit(links, [581, 547])).toBeGreaterThan(0);
      built.geometry.dispose();
      links.dispose();
      material.dispose();
    },
  );
  it.each(rows)(
    "aligns only the new saddle reference, keeping commercial shock length and other anchors for $variant.specs.size_label",
    (row) => {
      const anchors = supremeAnchors(row),
        old = row.asset.manifest.anchors,
        seat = new T.Vector3(...anchors.seat_tube.position),
        saddle = new T.Vector3(...anchors.saddle.position),
        built = buildSupreme(row),
        tube = built.pathEvidence.find((p) => p.name === "seat_tube")!.sampled;
      const terminal = tube.points
        .at(-1)!
        .clone()
        .sub(tube.points.at(-2)!)
        .normalize();
      expect(
        saddle.clone().sub(seat).normalize().distanceTo(terminal),
      ).toBeLessThan(1e-10);
      expect(saddle.distanceTo(seat)).toBeCloseTo(
        new T.Vector3(...old.saddle.position).distanceTo(seat),
        10,
      );
      for (const key of Object.keys(old))
        if (key !== "saddle") expect(anchors[key]).toEqual(old[key]);
      expect(
        new T.Vector3(...anchors.shock_upper.position).distanceTo(
          new T.Vector3(...anchors.shock_lower.position),
        ) * 1000,
      ).toBeCloseTo(250, 4);
      built.geometry.dispose();
    },
  );
});
