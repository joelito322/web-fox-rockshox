import { describe, it, expect } from "vitest";
import * as T from "three";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { buildV10, buildV10Links, v10Anchors, v10Registration } from "./frames";
import rows from "./predecessors.json";
import captures from "./uploads.json";
import protectedCaptures from "./protected-captures.json";
import checks from "./contour-checks.json";
import corrections from "./anchor-corrections.json";
import source from "../../supabase/catalog/frames-v30-reviewed.json";
import mapping from "../../supabase/catalog/frames-v30-successors.json";
import { parseCatalogImport } from "../../src/features/catalog/model/ingestion";
const sha = (p: string) =>
  createHash("sha256").update(readFileSync(p)).digest("hex");
describe("V10.8 MY27 photographic reconstruction v30", () => {
  it("changes only the two V10 choices and preserves 28 other current frame captures", () => {
    const s = parseCatalogImport(source);
    expect(s.components).toHaveLength(1);
    expect(s.components[0].slug).toBe("santa-cruz-v10-8-my27");
    expect(s.variants).toHaveLength(2);
    expect(protectedCaptures).toHaveLength(28);
    for (const c of protectedCaptures) expect(sha(c.file)).toBe(c.sha256);
    expect(() => buildV10({ ...rows[0], slug: "other-frame" })).toThrow(
      "V10-only",
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
      expect(sha("models/catalog-v30/exports/" + c.file)).toBe(c.sha256);
    }
    const historic = JSON.parse(
      readFileSync("models/catalog-v13/uploads.json", "utf8"),
    );
    for (const c of historic)
      expect(sha("models/catalog-v13/exports/" + c.file)).toBe(c.sha256);
  });
  it.each(rows)(
    "rectifies the oblique reference to official BB, rear and head for $variant.specs.size_label",
    (row) => {
      const xy = v10Registration(row);
      expect(xy([645, 754]).length()).toBeLessThan(1e-10);
      for (const [pixel, key] of [
        [[303, 755], "rear_axle"],
        [[1018, 278], "head_tube"],
      ] as [number[], string][]) {
        expect(
          xy(pixel).distanceTo(
            new T.Vector3(
              ...row.asset.manifest.anchors[
                key as keyof typeof row.asset.manifest.anchors
              ].position,
            ),
          ),
        ).toBeLessThan(1e-10);
      }
    },
  );
  it.each(rows)(
    "matches independent inside/outside photographic samples for $variant.specs.size_label",
    (row) => {
      const built = buildV10(row),
        link = buildV10Links(row),
        material = new T.MeshBasicMaterial({ side: T.DoubleSide }),
        g = new T.Group();
      g.add(new T.Mesh(built.geometry, material), new T.Mesh(link, material));
      g.updateMatrixWorld(true);
      const xy = v10Registration(row);
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
      const a = v10Anchors(row),
        c = corrections.find((c) => c.predecessor_id === row.variant.id)!;
      expect(a).toEqual(c.after);
      expect(row.asset.manifest.anchors).toEqual(c.before);
      expect(a.rear_axle).toEqual(row.asset.manifest.anchors.rear_axle);
      expect(
        new T.Vector3(...a.shock_upper.position).distanceTo(
          new T.Vector3(...a.shock_lower.position),
        ),
      ).toBeCloseTo(0.25, 10);
      expect(c.changed_keys).toHaveLength(5);
    },
  );
});
