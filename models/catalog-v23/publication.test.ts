import { describe, it, expect } from "vitest";
import * as T from "three";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  buildEnduro,
  buildEnduroLinks,
  enduroRegistration,
  enduroAnchors,
} from "./frames";
import rows from "./predecessors.json";
import profile from "./profile.json";
import protectedCaptures from "./protected-captures.json";
import source from "../../supabase/catalog/frames-v23-reviewed.json";
import mapping from "../../supabase/catalog/frames-v23-successors.json";
import uploads from "./uploads.json";
import { parseCatalogImport } from "../../src/features/catalog/model/ingestion";
const sha = (p: string) =>
  createHash("sha256").update(readFileSync(p)).digest("hex");
const cast = (geometry: T.BufferGeometry, p: T.Vector3) => {
  const material = new T.MeshBasicMaterial({ side: T.DoubleSide }),
    mesh = new T.Mesh(geometry, material);
  mesh.updateMatrixWorld(true);
  const hits = new T.Raycaster(
    p.clone().setZ(0.16),
    new T.Vector3(0, 0, -1),
    0,
    0.32,
  ).intersectObject(mesh).length;
  material.dispose();
  return hits;
};
describe("S-Works Enduro UDH v23 own reconstruction", () => {
  it("changes only the two true Enduro S3/S4 choices and preserves commercial and mounting data", () => {
    const parsed = parseCatalogImport(source);
    expect(parsed.components).toHaveLength(1);
    expect(parsed.components[0].slug).toBe("specialized-s-works-enduro-udh");
    expect(parsed.variants).toHaveLength(2);
    expect(rows.map((r) => r.variant.specs.size_label)).toEqual(["S3", "S4"]);
    for (const row of rows) {
      const v = parsed.variants.find(
        (v) => v.id === mapping[row.variant.id as keyof typeof mapping],
      )!;
      expect(v.specs).toEqual(row.variant.specs);
      expect(v.allowed_finishes).toEqual(row.variant.allowed_finishes);
      expect(
        parsed.assets.find((a) => a.id === v.visual_asset_id)!.manifest.anchors,
      ).toEqual(enduroAnchors(row));
    }
    expect(() =>
      buildEnduro({ ...rows[0], slug: "gt-fury-carbon-high-pivot" }),
    ).toThrow("Enduro-only");
  });
  it("keeps all other current frame captures and records its own two immutable successors", () => {
    expect(protectedCaptures).toHaveLength(28);
    for (const p of protectedCaptures) expect(sha(p.file)).toBe(p.sha256);
    expect(uploads).toHaveLength(2);
    for (const c of uploads) {
      expect(sha("models/catalog-v23/exports/" + c.file)).toBe(c.sha256);
      expect(c.variant_id).not.toBe(c.predecessor_id);
    }
  });
  it.each(rows)(
    "keeps front triangle long runs straight for $variant.specs.size_label",
    (row) => {
      const built = buildEnduro(row);
      for (const path of built.pathEvidence.filter((p) =>
        ["top_tube", "downtube"].includes(p.name),
      )) {
        for (const range of path.sampled.straightRanges) {
          const start = path.sampled.samples[range.from],
            end = path.sampled.samples[range.to],
            line = new T.Line3(start.point, end.point);
          for (let i = range.from; i <= range.to; i++)
            expect(
              line
                .closestPointToPoint(
                  path.sampled.samples[i].point,
                  true,
                  new T.Vector3(),
                )
                .distanceTo(path.sampled.samples[i].point),
            ).toBeLessThan(1e-9);
        }
      }
      built.geometry.dispose();
    },
  );
  it.each(rows)(
    "leaves the low shock bay open with a fixed forward trunnion and free rear extension for $variant.specs.size_label",
    (row) => {
      const built = buildEnduro(row),
        xy = enduroRegistration(row),
        forward = new T.Vector3(
          ...row.asset.manifest.anchors.shock_upper.position,
        ),
        rear = new T.Vector3(
          ...row.asset.manifest.anchors.shock_lower.position,
        );
      expect(cast(built.geometry, xy([684, 773]))).toBe(0);
      expect(
        cast(built.geometry, forward.add(new T.Vector3(0, 0.009, 0))),
      ).toBeGreaterThan(0);
      expect(cast(built.geometry, rear.add(new T.Vector3(0, 0.007, 0)))).toBe(
        0,
      );
      expect(cast(built.geometry, xy([667, 832]))).toBeGreaterThan(0);
      built.geometry.dispose();
    },
  );
  it.each(rows)(
    "separates upper/mid/lower links and keeps their bearing centres open for $variant.specs.size_label",
    (row) => {
      const g = buildEnduroLinks(row),
        xy = enduroRegistration(row);
      expect(profile.links.map((l) => l.name)).toEqual([
        "upper",
        "mid",
        "lower",
      ]);
      for (const pixel of [
        [608, 677],
        [504, 677],
        [490, 817],
        [619, 846],
      ])
        expect(cast(g, xy(pixel))).toBe(0);
      expect(cast(g, xy([497, 745]))).toBeGreaterThan(0);
      g.dispose();
    },
  );
  it.each(rows)(
    "keeps brake bosses only on the non-drive seatstay for $variant.specs.size_label",
    (row) => {
      const built = buildEnduro(row),
        material = new T.MeshBasicMaterial({ side: T.DoubleSide }),
        mesh = new T.Mesh(built.geometry, material),
        base = enduroRegistration(row)([176, 797]);
      mesh.updateMatrixWorld(true);
      const hits = (z: number) =>
        new T.Raycaster(
          new T.Vector3(base.x - 0.02, base.y + 0.024, z),
          new T.Vector3(1, 0, 0),
          0,
          0.04,
        ).intersectObject(mesh).length;
      expect(hits(-0.077)).toBeGreaterThan(0);
      expect(hits(0.077)).toBe(0);
      built.geometry.dispose();
      material.dispose();
    },
  );
  it.each(rows)(
    "aligns only the new estimated saddle marker with the seat tube for $variant.specs.size_label",
    (row) => {
      const a = enduroAnchors(row),
        before = row.asset.manifest.anchors,
        seat = new T.Vector3(...a.seat_tube.position),
        saddle = new T.Vector3(...a.saddle.position),
        oldSaddle = new T.Vector3(...before.saddle.position),
        body = enduroRegistration(row)(
          profile.members.find((m) => m.name === "seat_tube")!.path[1],
        );
      for (const key of Object.keys(before).filter((k) => k !== "saddle"))
        expect(a[key as keyof typeof a]).toEqual(
          before[key as keyof typeof before],
        );
      expect(saddle.distanceTo(seat)).toBeCloseTo(
        oldSaddle.distanceTo(seat),
        12,
      );
      expect(
        saddle
          .clone()
          .sub(seat)
          .normalize()
          .dot(seat.clone().sub(body).normalize()),
      ).toBeCloseTo(1, 12);
    },
  );
});
