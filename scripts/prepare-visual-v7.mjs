// Preserve published v6 and create successors only for the nine restored brake shells.
import { readFileSync, writeFileSync } from "node:fs";
import { v5 as uuid } from "./lib/uuid.mjs";
import { parseCatalogImport } from "../src/features/catalog/model/ingestion.ts";
const read = (name) =>
  JSON.parse(readFileSync(`supabase/catalog/visual-${name}.json`));
const source = read("v6-reviewed"),
  catalog = structuredClone(source),
  mapping = {};
const assets = new Map(catalog.assets.map((a) => [a.id, a]));
for (const variant of catalog.variants) {
  const previous = variant.id,
    asset = assets.get(variant.visual_asset_id);
  mapping[previous] = previous;
  if (asset.generator_key !== "atlas-bike-v6") continue;
  variant.id = uuid(
    "variant-v7:" + previous,
    "df29e6ee-1845-5df4-80e7-c9f5ac4169c0",
  );
  mapping[previous] = variant.id;
  asset.id = uuid(
    "asset-v7:" + previous,
    "df29e6ee-1845-5df4-80e7-c9f5ac4169c0",
  );
  asset.generator_key = "atlas-bike-v7";
  asset.reference_notes =
    "Pinza exterior v7 con carcasa completa y montaje trasero adelantado. Carcasa por modelo aproximada; no certifica tolerancias de fabricación.";
  variant.visual_asset_id = asset.id;
}
parseCatalogImport(catalog);
const presets = read("v6-examples");
for (const p of presets.presets)
  for (const item of p.items) item.variantId = mapping[item.variantId];
for (const [name, data] of Object.entries({
  reviewed: catalog,
  examples: presets,
  successors: mapping,
}))
  writeFileSync(
    `supabase/catalog/visual-v7-${name}.json`,
    JSON.stringify(data, null, 2) + "\n",
  );
console.log(
  "Prepared nine immutable brake successors; other 119 captures unchanged.",
);
