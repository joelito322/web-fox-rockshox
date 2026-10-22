import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { parseCatalogImport } from "../../src/features/catalog/model/ingestion";
import { roundedContour } from "./contour-volume";
import { RoundedMeshBuilder } from "./rounded-mesh";
import rows from "./predecessors.json";
import source from "../../supabase/catalog/frames-v10-reviewed.json";
import { presetImportSchema } from "../../src/features/catalog/model/presets";
import examples from "../../supabase/catalog/frames-v10-examples.json";
import mapping from "../../supabase/catalog/frames-v10-successors.json";
import uploads from "./uploads.json";
import v6 from "../catalog-v6/uploads.json";
import v9 from "../catalog-v9/uploads.json";
describe("frame v10 publication contracts", () => {
  it("keeps all four complete examples and replaces only their frame references", () => {
    const parsed = presetImportSchema.parse(examples);
    expect(parsed.presets).toHaveLength(4);
    for (const p of parsed.presets) {
      expect(p.items).toHaveLength(23);
      expect(
        source.variants.some(
          (v) => v.id === p.items.find((i) => i.slot === "frame")!.variantId,
        ),
      ).toBe(true);
    }
  });
  it("covers all fifteen frames and both published sizes without changing business specifications or anchors", () => {
    const catalog = parseCatalogImport(source);
    expect(catalog.components).toHaveLength(15);
    expect(catalog.variants).toHaveLength(30);
    for (const row of rows) {
      const variant = catalog.variants.find(
        (v) => v.id === mapping[row.variant.id as keyof typeof mapping],
      )!;
      expect(variant).toBeDefined();
      expect(variant.specs).toEqual(row.variant.specs);
      expect(variant.allowed_finishes).toEqual(row.variant.allowed_finishes);
      expect(variant.id).not.toBe(row.variant.id);
      const asset = catalog.assets.find(
        (a) => a.id === variant.visual_asset_id,
      )!;
      expect(asset.manifest.anchors).toEqual(row.asset.manifest.anchors);
      expect(asset.storage_path).toMatch(/^catalog\/v10\//);
    }
  });
  it("keeps content-addressed exports reproducible and every predecessor file intact", () => {
    for (const capture of uploads) {
      const bytes = readFileSync("models/catalog-v10/exports/" + capture.file);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(
        capture.sha256,
      );
      expect(capture.storage_path).toContain(capture.sha256.slice(0, 24));
    }
    for (const row of rows) {
      const bytes = readFileSync(row.predecessor_file);
      const expected = [...v6, ...v9].find((c) => c.asset_id === row.asset.id)!;
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(
        expected.sha256,
      );
    }
  });
  it("creates genuine rounded transverse volume while retaining a bent silhouette", () => {
    const g = roundedContour(
      {
        name: "down",
        polygon: [
          [0, 0],
          [0.12, 0],
          [0.3, 0.2],
          [0.28, 0.24],
          [0.1, 0.05],
          [0, 0.04],
        ],
        depth: 0.066,
        z: 0,
      },
      "#ffffff",
      true,
    );
    g.computeBoundingBox();
    expect(g.boundingBox!.max.z - g.boundingBox!.min.z).toBeGreaterThan(0.06);
    const p = g.getAttribute("position");
    for (const x of p.array) expect(Number.isFinite(x)).toBe(true);
    const n = g.getAttribute("normal");
    expect(
      Array.from(n.array).some((v) => Math.abs(v) > 0.1 && Math.abs(v) < 0.9),
    ).toBe(true);
    g.dispose();
  });
  it("creates paired closed rocker surfaces rather than floating line segments", () => {
    const b = new RoundedMeshBuilder();
    b.rockerPlate(
      [
        [0, 0, 0],
        [0.08, 0, 0],
        [0.04, 0.045, 0],
      ],
      0.043,
      0.01,
      "#202526",
      true,
    );
    const geometry = b.finish()[0].geometry;
    geometry.computeBoundingBox();
    expect(geometry.boundingBox!.max.x).toBeGreaterThan(0.08);
    expect(geometry.boundingBox!.min.z).toBeGreaterThan(0.03);
    expect(geometry.getAttribute("position").count).toBeGreaterThan(100);
    geometry.dispose();
  });
});
