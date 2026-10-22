// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { parseCatalogImport } from "../../src/features/catalog/model/ingestion";
import source from "../../supabase/catalog/frames-v12-reviewed.json";
import mapping from "../../supabase/catalog/frames-v12-successors.json";
import prior from "./predecessors.json";
import before from "../catalog-v11/uploads.json";
import after from "./uploads.json";
import { inspectPassages } from "../test-utils/inspect-passages";
describe("v12 frame continuity", () => {
  it("keeps all thirty specifications, finishes and anchors without changing published v11 files", () => {
    const parsed = parseCatalogImport(source);
    expect(parsed.components).toHaveLength(15);
    expect(parsed.variants).toHaveLength(30);
    for (const row of prior) {
      const fresh = parsed.variants.find(
        (v) => v.id === mapping[row.variant.id as keyof typeof mapping],
      )!;
      expect(fresh.specs).toEqual(row.variant.specs);
      expect(fresh.allowed_finishes).toEqual(row.variant.allowed_finishes);
      const a = parsed.assets.find((a) => a.id === fresh.visual_asset_id)!;
      expect(a.manifest.anchors).toEqual(row.asset.manifest.anchors);
      const old = before.find((c) => c.variant_id === row.variant.id)!;
      expect(
        createHash("sha256")
          .update(readFileSync(row.predecessor_file))
          .digest("hex"),
      ).toBe(old.sha256);
    }
  });
  it("recomputes all three clear passages from the thirty final binaries", async () => {
    let blockedBefore = 0;
    for (const row of prior) {
      const capture = after.find((c) => c.predecessor_id === row.variant.id)!;
      const checked = await inspectPassages(
        row,
        "models/catalog-v12/exports/" + capture.file,
        true,
      );
      expect(checked.probes).toHaveLength(11);
      for (const p of checked.probes) {
        expect(p.after).toBe(0);
        blockedBefore += p.before;
      }
      expect(checked.boundsDelta).toBeLessThan(0.012);
    }
    expect(blockedBefore).toBeGreaterThan(0);
  }, 30000);
  it("matches all thirty binary exports to their content hashes", () => {
    expect(after).toHaveLength(30);
    for (const c of after)
      expect(
        createHash("sha256")
          .update(readFileSync("models/catalog-v12/exports/" + c.file))
          .digest("hex"),
      ).toBe(c.sha256);
  });
});
