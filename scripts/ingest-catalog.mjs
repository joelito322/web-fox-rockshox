import {
  readProjectEnvironment,
  postgresEnvironment,
} from "./lib/environment.mjs";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { parseCatalogImport } from "../src/features/catalog/model/ingestion.ts";
const file = process.argv[2];
if (!file?.startsWith("supabase/catalog/") || !file.endsWith(".json"))
  throw new Error(
    "Provide a reviewed catalogue JSON source under supabase/catalog",
  );
const document = parseCatalogImport(JSON.parse(readFileSync(file, "utf8")));
console.log(
  JSON.stringify({
    brands: document.brands.length,
    models: document.components.length,
    variants: document.variants.length,
    publishedVariants: document.variants.filter((v) => v.published).length,
  }),
);
if (!process.argv.includes("--apply")) {
  console.log(
    "Source validated; no remote write. Add --apply to ingest the reviewed source.",
  );
  process.exit(0);
}
const e = readProjectEnvironment();
// CSV-encoded JSON enters a COPY data stream, never an interpolated SQL literal.
const row = '"' + JSON.stringify(document).replace(/"/g, '""') + '"\n';
const input =
  "begin;\ncreate temporary table atlas_catalog_import(payload jsonb) on commit drop;\ncopy atlas_catalog_import(payload) from stdin with(format csv);\n" +
  row +
  "\\.\n" +
  readFileSync("supabase/operations/ingest-catalog.sql", "utf8") +
  "\ncommit;\n";
const r = spawnSync("psql", ["-X", "-q", "-v", "ON_ERROR_STOP=1"], {
  input,
  encoding: "utf8",
  env: postgresEnvironment(e),
});
if (r.status !== 0) {
  console.error(
    "Catalogue transaction failed; no success reported. Review source and database constraints.",
  );
  process.exit(r.status ?? 1);
}
console.log("Reviewed catalogue source ingested atomically.");
