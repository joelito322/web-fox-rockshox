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
import checks from "../catalog-v28/contour-checks.json";
import corrections from "./anchor-corrections.json";
import source from "../../supabase/catalog/frames-v29-reviewed.json";
import mapping from "../../supabase/catalog/frames-v29-successors.json";
import { parseCatalogImport } from "../../src/features/catalog/model/ingestion";
const sha = (p: string) =>
  createHash("sha256").update(readFileSync(p)).digest("hex");
describe("TUES MK4 photographic reconstruction v29", () => {
  it("changes only the two TUES choices and preserves 28 other current frame captures", () => {
    const s = parseCatalogImport(source);
    expect(s.components).toHaveLength(1);
    expect(s.components[0].slug).toBe("yt-tues-mk4-carbon");
    expect(s.variants).toHaveLength(2);
    expect(protectedCaptures).toHaveLength(28);
    for (const c of protectedCaptures) expect(sha(c.file)).toBe(c.sha256);
    expect(() => buildTues({ ...rows[0], slug: "other-frame" })).toThrow(
      "TUES-only",
    );
    for (const row of rows) {
      const fresh = s.variants.find(
        (v) => v.id === mapping[row.variant.id as keyof typeof mapping],
      )!;
      expect(fresh.specs).toEqual(row.variant.specs);
      expect(fresh.allowed_finishes).toEqual(row.variant.allowed_finishes);
    }
  });
  it("exports new immutable identities without changing predecessor bytes", () => {
    expect(captures).toHaveLength(2);
    for (const c of captures) {
      expect(c.variant_id).not.toBe(c.predecessor_id);
      expect(sha("models/catalog-v29/exports/" + c.file)).toBe(c.sha256);
    }
    const historic = JSON.parse(
      readFileSync("models/catalog-v28/uploads.json", "utf8"),
    );
    for (const c of historic)
      expect(sha("models/catalog-v28/exports/" + c.file)).toBe(c.sha256);
  });
  it.each(rows)(
    "preserves photographic proportions without shear for $variant.specs.size_label",
    (row) => {
      const xy = tuesRegistration(row),
        a = xy([850, 817]),
        x = xy([950, 817]).sub(a),
        y = xy([850, 717]).sub(a);
      expect(x.length()).toBeCloseTo(y.length(), 10);
      expect(x.dot(y)).toBeCloseTo(0, 10);
      expect(
        xy([443, 824]).distanceTo(
          new T.Vector3(...row.asset.manifest.anchors.rear_axle.position),
        ),
      ).toBeLessThan(1e-10);
    },
  );
  it.each(rows)(
    "matches independent inside/outside photographic samples for $variant.specs.size_label",
    (row) => {
      const built = buildTues(row),
        link = buildTuesLinks(row),
        material = new T.MeshBasicMaterial({ side: T.DoubleSide }),
        g = new T.Group();
      g.add(new T.Mesh(built.geometry, material), new T.Mesh(link, material));
      g.updateMatrixWorld(true);
      const xy = tuesRegistration(row);
      for (const c of checks.samples) {
        const hit =
          new T.Raycaster(
            xy(c.pixel).setZ(0.16),
            new T.Vector3(0, 0, -1),
            0,
            0.32,
          ).intersectObject(g, true).length > 0;
        expect(hit, c.region + " " + c.pixel.join(",")).toBe(c.hit);
      }
      built.geometry.dispose();
      link.dispose();
      material.dispose();
    },
  );
  it.each(rows)(
    "keeps exact versioned anchor contract and commercial shock distance for $variant.specs.size_label",
    (row) => {
      const a = tuesAnchors(row),
        c = corrections.find((c) => c.predecessor_id === row.variant.id)!;
      expect(a).toEqual(c.after);
      expect(row.asset.manifest.anchors).toEqual(c.before);
      expect(a.rear_axle).toEqual(row.asset.manifest.anchors.rear_axle);
      expect(
        new T.Vector3(...a.shock_upper.position).distanceTo(
          new T.Vector3(...a.shock_lower.position),
        ),
      ).toBeCloseTo(0.25, 10);
      expect(c.changed_keys).toHaveLength(0);
    },
  );
  it.each(rows)(
    "draws the nearest exterior wall from both sides for $variant.specs.size_label",
    (row) => {
      const built = buildTues(row),
        mat = new T.MeshBasicMaterial(),
        mesh = new T.Mesh(built.geometry, mat),
        xy = tuesRegistration(row);
      mesh.updateMatrixWorld(true);
      for (const pixel of [
        [1080, 397],
        [1100, 530],
        [850, 610],
        [700, 715],
      ])
        for (const side of [-1, 1]) {
          const ray = new T.Raycaster(
            xy(pixel).setZ(side * 0.16),
            new T.Vector3(0, 0, -side),
            0,
            0.32,
          );
          mat.side = T.FrontSide;
          const front = ray.intersectObject(mesh)[0];
          mat.side = T.DoubleSide;
          const both = ray.intersectObject(mesh)[0];
          expect(front).toBeDefined();
          expect(both).toBeDefined();
          expect(front.distance).toBeCloseTo(both.distance, 7);
        }
      built.geometry.dispose();
      mat.dispose();
    },
  );
});
