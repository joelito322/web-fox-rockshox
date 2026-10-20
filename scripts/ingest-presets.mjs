import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { presetImportSchema } from "../src/features/catalog/model/presets.ts";
import {
  readProjectEnvironment,
  postgresEnvironment,
} from "./lib/environment.mjs";
const file = process.argv[2];
if (!file?.startsWith("supabase/catalog/") || !file.endsWith(".json"))
  throw new Error("Provide a reviewed reference JSON under supabase/catalog");
const document = presetImportSchema.parse(
  JSON.parse(readFileSync(file, "utf8")),
);
console.log(
  JSON.stringify({
    presets: document.presets.length,
    published: document.presets.filter((p) => p.published).length,
    positions: document.presets.map((p) => p.items.length),
  }),
);
if (!process.argv.includes("--apply")) {
  console.log("Source validated; no remote write.");
  process.exit(0);
}
const row = '"' + JSON.stringify(document).replace(/"/g, '""') + '"\n';
const input =
  "begin;\ncreate temporary table atlas_preset_import(payload jsonb) on commit drop;\ncopy atlas_preset_import(payload) from stdin with(format csv);\n" +
  row +
  "\\.\n" +
  readFileSync("supabase/operations/ingest-presets.sql", "utf8") +
  "\ncommit;\n";
const result = spawnSync("psql", ["-X", "-q", "-v", "ON_ERROR_STOP=1"], {
  input,
  encoding: "utf8",
  env: postgresEnvironment(readProjectEnvironment()),
});
if (result.status !== 0) {
  console.error(
    "Reference transaction failed; no success reported. Review its source and database contracts.",
  );
  process.exit(result.status ?? 1);
}
console.log("Reviewed references ingested atomically.");
