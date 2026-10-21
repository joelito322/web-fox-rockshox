// Publish immutable visual successors and refresh example compositions atomically.
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { parseCatalogImport } from "../src/features/catalog/model/ingestion.ts";
import { presetImportSchema } from "../src/features/catalog/model/presets.ts";
import {
  readProjectEnvironment,
  postgresEnvironment,
} from "./lib/environment.mjs";
const read = (path) =>
  JSON.parse(readFileSync("supabase/catalog/" + path + ".json", "utf8"));
const versionArg = process.argv.find((a) => a.startsWith("--version="));
if (versionArg && !/^--version=v[34567]$/.test(versionArg))
  throw Error("Unsupported visual source version");
const version = versionArg?.split("=")[1] ?? "v4";
const catalog = parseCatalogImport(read(`visual-${version}-reviewed`));
const presets = presetImportSchema.parse(read(`visual-${version}-examples`));
const mapping = read(`visual-${version}-successors`);
if (
  Object.keys(mapping).length !== catalog.variants.length ||
  new Set(Object.values(mapping)).size !== catalog.variants.length
)
  throw Error("invalid_successor_mapping");
const ids = new Set(catalog.variants.map((v) => v.id));
if (
  Object.values(mapping).some((id) => !ids.has(id)) ||
  presets.presets.some((p) => p.items.some((i) => !ids.has(i.variantId)))
)
  throw Error("missing_visual_successor");
console.log(
  JSON.stringify({
    models: catalog.components.length,
    variants: catalog.variants.length,
    published: catalog.variants.filter((v) => v.published).length,
    selectablePublished: catalog.variants.filter(
      (v) => v.selectable && v.published,
    ).length,
    presets: presets.presets.length,
  }),
);
if (!process.argv.includes("--apply")) {
  console.log("Validated source only; no remote writes.");
  process.exit(0);
}
const copy = (table, value) =>
  `create temporary table ${table}(payload jsonb) on commit drop;\ncopy ${table}(payload) from stdin with(format csv);\n"${JSON.stringify(value).replace(/"/g, '""')}"\n\\.\n`;
// Validate compositions before retiring old variants: existing compositions retain readable history.
const sql =
  "begin;\n" +
  copy("atlas_catalog_import", catalog) +
  readFileSync("supabase/operations/ingest-catalog.sql", "utf8") +
  "\n" +
  copy("atlas_preset_import", presets) +
  readFileSync("supabase/operations/ingest-presets.sql", "utf8") +
  "\n" +
  copy("atlas_visual_successors", {
    generator: `atlas-bike-${version}`,
    successors: mapping,
  }) +
  readFileSync("supabase/operations/publish-visual-successors.sql", "utf8") +
  "\ncommit;\n";
const result = spawnSync("psql", ["-X", "-q", "-v", "ON_ERROR_STOP=1"], {
  input: sql,
  encoding: "utf8",
  env: postgresEnvironment(readProjectEnvironment()),
});
if (result.status !== 0) {
  console.error(
    "Visual publication rolled back; database rejected a source or contract.",
  );
  process.exit(1);
}
console.log(
  "Visual successors and compositions published atomically; previous resources retained.",
);
