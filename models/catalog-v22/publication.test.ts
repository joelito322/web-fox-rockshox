import { describe, it, expect } from "vitest";
import * as T from "three";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  buildNomad,
  buildNomadBay,
  nomadRegistration,
  nomadAnchors,
} from "./frames";
import rows from "./predecessors.json";
import protectedCaptures from "./protected-captures.json";
import source from "../../supabase/catalog/frames-v22-reviewed.json";
import mapping from "../../supabase/catalog/frames-v22-successors.json";
import original from "../catalog-v21/uploads.json";
import uploads from "./uploads.json";
import { parseCatalogImport } from "../../src/features/catalog/model/ingestion";
const sha = (file: string) =>
  createHash("sha256").update(readFileSync(file)).digest("hex");
describe("Santa Cruz Nomad 7 CC full frame v22", () => {
  it("changes only Santa Cruz Nomad 7 CC and preserves all other current frame resources", () => {
    const parsed = parseCatalogImport(source);
    expect(parsed.components).toHaveLength(1);
    expect(parsed.variants).toHaveLength(2);
    expect(parsed.components[0].slug).toBe("santa-cruz-nomad-7-my27");
    expect(protectedCaptures).toHaveLength(28);
    for (const c of protectedCaptures) expect(sha(c.file)).toBe(c.sha256);
    for (const c of original)
      expect(sha("models/catalog-v21/exports/" + c.file)).toBe(c.sha256);
    expect(() =>
      buildNomad({ ...rows[0], slug: "commencal-meta-sx-v5" }),
    ).toThrow("Nomad-only");
    for (const row of rows) {
      const fresh = parsed.variants.find(
        (v) => v.id === mapping[row.variant.id as keyof typeof mapping],
      )!;
      expect(fresh.specs).toEqual(row.variant.specs);
      expect(fresh.allowed_finishes).toEqual(row.variant.allowed_finishes);
      expect(
        parsed.assets.find((a) => a.id === fresh.visual_asset_id)!.manifest
          .anchors,
      ).toEqual(nomadAnchors(row));
    }
  });
  it("captures each successor under a new immutable content hash", () => {
    expect(uploads).toHaveLength(2);
    for (const c of uploads) {
      expect(sha("models/catalog-v22/exports/" + c.file)).toBe(c.sha256);
      expect(c.variant_id).not.toBe(c.predecessor_id);
    }
  });
  it.each(rows)(
    "keeps all declared long members and their contours straight for $variant.specs.size_label",
    (row) => {
      const built = buildNomad(row);
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
    "keeps the forward shock support fixed and rear eye free of a fixed paint bridge for $variant.specs.size_label",
    (row) => {
      const built = buildNomad(row),
        material = new T.MeshBasicMaterial({ side: T.DoubleSide }),
        mesh = new T.Mesh(built.geometry, material);
      mesh.updateMatrixWorld(true);
      const cast = (at: number[], central = false) => {
        const p = new T.Vector3(...at);
        p.y += 0.007;
        p.z = central ? 0.014 : 0.15;
        return new T.Raycaster(
          p,
          new T.Vector3(0, 0, -1),
          0,
          central ? 0.028 : 0.3,
        ).intersectObject(mesh).length;
      };
      expect(
        cast(row.asset.manifest.anchors.shock_upper.position),
      ).toBeGreaterThan(0);
      expect(cast(row.asset.manifest.anchors.shock_lower.position, true)).toBe(
        0,
      );
      built.geometry.dispose();
      material.dispose();
    },
  );
  it.each(rows)(
    "opens the triangular lower bay window for $variant.specs.size_label",
    (row) => {
      const geometry = buildNomadBay(row),
        material = new T.MeshBasicMaterial({ side: T.DoubleSide }),
        mesh = new T.Mesh(geometry, material);
      mesh.updateMatrixWorld(true);
      const xy = nomadRegistration(row);
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
      expect(cast([785, 804])).toBe(0);
      expect(cast([744, 852])).toBeGreaterThan(0);
      geometry.dispose();
      material.dispose();
    },
  );
  it.each(rows)(
    "closes both rear structural arches without an open stay for $variant.specs.size_label",
    (row) => {
      const built = buildNomad(row);
      for (const side of [-1, 1]) {
        const arch = built.pathEvidence.find(
          (p) => p.name === "rear_arch" && p.side === side,
        )!.sampled;
        const stay = built.pathEvidence.find(
          (p) => p.name === "seat_stay" && p.side === side,
        )!.sampled;
        const chain = built.pathEvidence.find(
          (p) => p.name === "chain_stay" && p.side === side,
        )!.sampled;
        expect(arch.points[0].distanceTo(stay.points.at(-1)!)).toBeLessThan(
          1e-8,
        );
        const end = arch.points.at(-1)!;
        expect(
          Math.min(...chain.samples.map((p) => p.point.distanceTo(end))),
        ).toBeLessThan(0.018);
      }
      const a = row.asset.manifest.anchors;
      expect(
        new T.Vector3(...a.shock_upper.position).distanceTo(
          new T.Vector3(...a.shock_lower.position),
        ),
      ).toBeCloseTo(0.23, 6);
      built.geometry.dispose();
    },
  );
  it.each(rows)(
    "changes only the new saddle visual reference and keeps its length for $variant.specs.size_label",
    (row) => {
      const old = row.asset.manifest.anchors,
        fresh = nomadAnchors(row),
        built = buildNomad(row),
        points = built.pathEvidence.find((p) => p.name === "seat_tube")!.sampled
          .points;
      for (const key of Object.keys(old))
        if (key !== "saddle") expect(fresh[key]).toEqual(old[key]);
      const seat = new T.Vector3(...fresh.seat_tube.position),
        before = new T.Vector3(...old.saddle.position).sub(seat),
        after = new T.Vector3(...fresh.saddle.position).sub(seat);
      expect(after.length()).toBeCloseTo(before.length(), 10);
      expect(
        after
          .clone()
          .normalize()
          .angleTo(points.at(-1)!.clone().sub(points.at(-2)!).normalize()),
      ).toBeLessThan(1e-7);
      expect(fresh.saddle).not.toEqual(old.saddle);
      built.geometry.dispose();
    },
  );
});
