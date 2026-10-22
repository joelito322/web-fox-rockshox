// Scoped frame publication. Keeps every non-frame selection and all historical resources.
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { parseCatalogImport } from "../src/features/catalog/model/ingestion.ts";
import {
  readProjectEnvironment,
  postgresEnvironment,
} from "./lib/environment.mjs";
const read = (p) => JSON.parse(readFileSync(p, "utf8")),
  source = parseCatalogImport(
    read("supabase/catalog/frames-v24-reviewed.json"),
  ),
  mapping = read("supabase/catalog/frames-v24-successors.json"),
  uploads = read("models/catalog-v24/uploads.json");
if (
  source.components.length !== 1 ||
  source.variants.length !== 2 ||
  Object.keys(mapping).length !== 2 ||
  new Set(Object.values(mapping)).size !== 2 ||
  source.components.some((c) => c.category !== "frame")
)
  throw Error("Frame coverage mismatch");
for (const a of source.assets) {
  const c = uploads.find((c) => c.asset_id === a.id);
  if (
    !c ||
    c.storage_path !== a.storage_path ||
    createHash("sha256")
      .update(readFileSync("models/catalog-v24/exports/" + c.file))
      .digest("hex") !== c.sha256
  )
    throw Error("Capture checksum mismatch");
}
if (!process.argv.includes("--apply")) {
  console.log(
    "Validated CANYON SENDER only / two successors. No remote writes.",
  );
  process.exit(0);
}
if (source.components.some((c) => c.slug !== "canyon-sender-cfr-high-pivot"))
  throw Error("Approved frame included in publication");
const env = readProjectEnvironment();
for (const c of uploads) {
  if (!c.published_at) throw Error("Upload captures before publishing");
  const response = await fetch(
    env.SUPABASE_URL + "/storage/v1/object/public/models/" + c.storage_path,
  );
  if (
    !response.ok ||
    createHash("sha256")
      .update(Buffer.from(await response.arrayBuffer()))
      .digest("hex") !== c.sha256
  )
    throw Error("Storage checksum mismatch");
}
const copy = (table, value) =>
  `create temporary table ${table}(payload jsonb) on commit drop;\ncopy ${table}(payload) from stdin with(format csv);\n"${JSON.stringify(value).replaceAll('"', '""')}"\n\\.\n`;
const sql =
  "begin;\n" +
  copy("atlas_frame_v24", source) +
  copy("atlas_frame_successors", mapping) +
  readFileSync("supabase/operations/frame-v24-anchor-contract.sql", "utf8") +
  readFileSync("supabase/operations/publish-frame-v24.sql", "utf8") +
  "\ncommit;";
const result = spawnSync("psql", ["-X", "-q", "-v", "ON_ERROR_STOP=1"], {
  input: sql,
  env: postgresEnvironment(env),
  encoding: "utf8",
  maxBuffer: 4 * 1024 * 1024,
});
if (result.status !== 0) {
  console.error(
    "Frame publication rolled back:",
    result.stderr.replaceAll(env.SUPABASE_DB_URL ?? "__never__", "[redacted]"),
  );
  process.exit(1);
}
console.log(
  "Published two CANYON SENDER successors; other frames and presets unchanged.",
);
