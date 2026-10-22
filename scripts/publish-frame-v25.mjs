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
    read("supabase/catalog/frames-v25-reviewed.json"),
  ),
  mapping = read("supabase/catalog/frames-v25-successors.json"),
  uploads = read("models/catalog-v25/uploads.json"),
  corrections = read("models/catalog-v25/anchor-corrections.json");
if (
  source.components.length !== 1 ||
  source.variants.length !== 2 ||
  Object.keys(mapping).length !== 2 ||
  new Set(Object.values(mapping)).size !== 2 ||
  source.components.some((c) => c.category !== "frame")
)
  throw Error("Frame coverage mismatch");
const predecessors = read("models/catalog-v25/predecessors.json");
if (corrections.length !== 2)
  throw Error("Expected exactly two saddle corrections");
for (const old of predecessors) {
  const fresh = source.variants.find((v) => v.id === mapping[old.variant.id]),
    asset = source.assets.find((a) => a.id === fresh.visual_asset_id),
    correction = corrections.find(
      (c) => c.predecessor_id === old.variant.id && c.successor_id === fresh.id,
    );
  const before = old.asset.manifest.anchors,
    after = asset.manifest.anchors;
  if (
    !correction ||
    correction.anchor !== "saddle" ||
    JSON.stringify(correction.old_saddle) !== JSON.stringify(before.saddle) ||
    JSON.stringify(correction.new_saddle) !== JSON.stringify(after.saddle)
  )
    throw Error("Saddle correction evidence mismatch");
  for (const key of Object.keys(before))
    if (
      key !== "saddle" &&
      JSON.stringify(before[key]) !== JSON.stringify(after[key])
    )
      throw Error("Unapproved anchor correction");
  const length = (a) =>
    Math.hypot(...a.saddle.position.map((p, i) => p - a.seat_tube.position[i]));
  if (Math.abs(length(before) - length(after)) > 1e-10)
    throw Error("Saddle reference length changed");
}
for (const a of source.assets) {
  const c = uploads.find((c) => c.asset_id === a.id);
  if (
    !c ||
    c.storage_path !== a.storage_path ||
    createHash("sha256")
      .update(readFileSync("models/catalog-v25/exports/" + c.file))
      .digest("hex") !== c.sha256
  )
    throw Error("Capture checksum mismatch");
}
if (!process.argv.includes("--apply")) {
  console.log(
    "Validated SUPREME DH V5 only / two successors. No remote writes.",
  );
  process.exit(0);
}
if (source.components.some((c) => c.slug !== "commencal-supreme-dh-v5"))
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
  copy("atlas_frame_v25", source) +
  copy("atlas_frame_successors", mapping) +
  copy("atlas_frame_anchor_corrections", corrections) +
  readFileSync("supabase/operations/publish-frame-v25.sql", "utf8") +
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
  "Published two SUPREME DH V5 successors; other frames and presets unchanged.",
);
