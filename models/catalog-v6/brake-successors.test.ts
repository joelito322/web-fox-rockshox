// @vitest-environment node
import { readFileSync } from "node:fs";
import { it, expect } from "vitest";
import { parseCatalogImport } from "../../src/features/catalog/model/ingestion";
it("versions exactly nine brake shell repairs and retains all other v6 captures", () => {
  const read = (version: string) =>
    JSON.parse(
      readFileSync(`supabase/catalog/visual-${version}-reviewed.json`, "utf8"),
    );
  const old = parseCatalogImport(read("v6")),
    next = parseCatalogImport(read("v7"));
  const map = JSON.parse(
    readFileSync("supabase/catalog/visual-v7-successors.json", "utf8"),
  );
  expect(
    Object.entries(map).filter(([old, fresh]) => old !== fresh),
  ).toHaveLength(9);
  for (const v of old.variants) {
    const fresh = next.variants.find((n) => n.id === map[v.id])!;
    expect(fresh.specs).toEqual(v.specs);
    expect(fresh.allowed_finishes).toEqual(v.allowed_finishes);
    if (
      old.components.find((c) => c.id === v.component_id)!.category !== "brake"
    )
      expect(fresh).toEqual(v);
    else
      expect(
        next.assets.find((a) => a.id === fresh.visual_asset_id)!.generator_key,
      ).toBe("atlas-bike-v7");
  }
});
