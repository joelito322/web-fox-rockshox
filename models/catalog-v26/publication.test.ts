import { describe, it, expect } from "vitest";
import * as T from "three";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  buildTues,
  buildTuesLinks,
  tuesAnchors,
  tuesRegistration,
} from "./frames";
import rows from "./predecessors.json";
import captures from "./uploads.json";
import protectedCaptures from "./protected-captures.json";
import source from "../../supabase/catalog/frames-v26-reviewed.json";
import mapping from "../../supabase/catalog/frames-v26-successors.json";
import { parseCatalogImport } from "../../src/features/catalog/model/ingestion";
const sha = (p: string) =>
  createHash("sha256").update(readFileSync(p)).digest("hex");
describe("TUES MK4 Carbon scoped exterior v26", () => {
  it("replaces exactly two TUES choices, preserving the other 28 frame captures", () => {
    const parsed = parseCatalogImport(source);
    expect(parsed.components).toHaveLength(1);
    expect(parsed.components[0].slug).toBe("yt-tues-mk4-carbon");
    expect(parsed.variants).toHaveLength(2);
    expect(protectedCaptures).toHaveLength(28);
    for (const c of protectedCaptures) expect(sha(c.file)).toBe(c.sha256);
    expect(() =>
      buildTues({ ...rows[0], slug: "commencal-supreme-dh-v5" }),
    ).toThrow("TUES-only");
    for (const row of rows) {
      const fresh = parsed.variants.find(
        (v) => v.id === mapping[row.variant.id as keyof typeof mapping],
      )!;
      expect(fresh.specs).toEqual(row.variant.specs);
      expect(fresh.allowed_finishes).toEqual(row.variant.allowed_finishes);
    }
  });
  it("retains immutable predecessors and exports new content identities", () => {
    expect(captures).toHaveLength(2);
    for (const c of captures) {
      expect(c.variant_id).not.toBe(c.predecessor_id);
      expect(sha("models/catalog-v26/exports/" + c.file)).toBe(c.sha256);
    }
  });
  it.each(rows)(
    "preserves mechanical anchors and shock length, aligning only the saddle for $variant.specs.size_label",
    (row) => {
      const a = tuesAnchors(row),
        old = row.asset.manifest.anchors,
        built = buildTues(row),
        tube = built.pathEvidence.find((p) => p.name === "seat_tube")!.sampled
          .points;
      for (const key of Object.keys(old))
        if (key !== "saddle")
          expect(a[key]).toEqual(old[key as keyof typeof old]);
      const seat = new T.Vector3(...a.seat_tube.position),
        saddle = new T.Vector3(...a.saddle.position);
      expect(saddle.distanceTo(seat)).toBeCloseTo(
        new T.Vector3(...old.saddle.position).distanceTo(seat),
        10,
      );
      expect(
        saddle
          .sub(seat)
          .normalize()
          .distanceTo(tube.at(-1)!.clone().sub(tube.at(-2)!).normalize()),
      ).toBeLessThan(1e-10);
      expect(
        new T.Vector3(...a.shock_upper.position).distanceTo(
          new T.Vector3(...a.shock_lower.position),
        ),
      ).toBeCloseTo(0.25, 6);
      built.geometry.dispose();
    },
  );
  it.each(rows)(
    "builds paired rear members and finite surfaces for $variant.specs.size_label",
    (row) => {
      const built = buildTues(row),
        links = buildTuesLinks(row);
      for (const name of ["seat_stay", "chain_stay"]) {
        const left = built.pathEvidence.find(
            (p) => p.name === name && p.side === -1,
          )!.sampled.samples,
          right = built.pathEvidence.find(
            (p) => p.name === name && p.side === 1,
          )!.sampled.samples;
        expect(left.length).toBe(right.length);
        for (let i = 0; i < left.length; i++) {
          expect(left[i].point.x).toBeCloseTo(right[i].point.x, 10);
          expect(left[i].point.y).toBeCloseTo(right[i].point.y, 10);
          expect(left[i].point.z).toBeCloseTo(-right[i].point.z, 10);
        }
      }
      for (const g of [built.geometry, links]) {
        expect(
          Array.from(g.getAttribute("position").array).every(Number.isFinite),
        ).toBe(true);
        g.dispose();
      }
    },
  );
  it.each(rows)(
    "keeps the frame window and full BB passage open for $variant.specs.size_label",
    (row) => {
      const built = buildTues(row),
        links = buildTuesLinks(row),
        mat = new T.MeshBasicMaterial({ side: T.DoubleSide }),
        g = new T.Group();
      g.add(new T.Mesh(built.geometry, mat), new T.Mesh(links, mat));
      g.updateMatrixWorld(true);
      const hit = (p: T.Vector3) =>
        new T.Raycaster(
          p.setZ(0.15),
          new T.Vector3(0, 0, -1),
          0,
          0.3,
        ).intersectObject(g, true).length;
      const xy = tuesRegistration(row);
      expect(hit(xy([1010, 485]))).toBe(0);
      for (const radius of [0, 0.006, 0.012, 0.018])
        for (let i = 0; i < (radius ? 8 : 1); i++)
          expect(
            hit(
              new T.Vector3(
                radius * Math.cos((i * Math.PI) / 4),
                radius * Math.sin((i * Math.PI) / 4),
                0,
              ),
            ),
          ).toBe(0);
      expect(hit(xy([943, 681]))).toBeGreaterThan(0);
      built.geometry.dispose();
      links.dispose();
      mat.dispose();
    },
  );
});
