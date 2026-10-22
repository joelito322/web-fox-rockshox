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
    read("supabase/catalog/frames-v28-reviewed.json"),
  ),
  mapping = read("supabase/catalog/frames-v28-successors.json"),
  uploads = read("models/catalog-v28/uploads.json"),
  corrections = read("models/catalog-v28/anchor-corrections.json");
if (
  source.components.length !== 1 ||
  source.variants.length !== 2 ||
  Object.keys(mapping).length !== 2 ||
  new Set(Object.values(mapping)).size !== 2 ||
  source.components.some((c) => c.category !== "frame")
)
  throw Error("Frame coverage mismatch");
const predecessors = read("models/catalog-v28/predecessors.json");
if (corrections.length !== 2)
  throw Error("Expected two exact visual anchor contracts");
const allowed = [
  "head_tube",
  "head_tube_lower",
  "seat_tube",
  "saddle",
  "shock_upper",
  "shock_lower",
  "suspension_pivot",
  "front_axle",
];
for (const old of predecessors) {
  const fresh = source.variants.find((v) => v.id === mapping[old.variant.id]),
    asset = source.assets.find((a) => a.id === fresh.visual_asset_id),
    c = corrections.find(
      (c) => c.predecessor_id === old.variant.id && c.successor_id === fresh.id,
    );
  if (
    !c ||
    JSON.stringify(c.before) !== JSON.stringify(old.asset.manifest.anchors) ||
    JSON.stringify(c.after) !== JSON.stringify(asset.manifest.anchors) ||
    c.changed_keys.some((k) => !allowed.includes(k)) ||
    JSON.stringify(c.before.rear_axle) !== JSON.stringify(c.after.rear_axle)
  )
    throw Error("Unapproved visual anchor contract");
  const distance = (a, b) => Math.hypot(...a.map((n, i) => n - b[i]));
  if (
    Math.abs(
      distance(c.after.shock_upper.position, c.after.shock_lower.position) -
        0.25,
    ) > 1e-10
  )
    throw Error("Shock commercial length changed");
  if (
    JSON.stringify(fresh.specs) !== JSON.stringify(old.variant.specs) ||
    JSON.stringify(fresh.allowed_finishes) !==
      JSON.stringify(old.variant.allowed_finishes)
  )
    throw Error("Commercial fields changed");
}
for (const a of source.assets) {
  const c = uploads.find((c) => c.asset_id === a.id);
  if (
    !c ||
    c.storage_path !== a.storage_path ||
    createHash("sha256")
      .update(readFileSync("models/catalog-v28/exports/" + c.file))
      .digest("hex") !== c.sha256
  )
    throw Error("Capture checksum mismatch");
}
if (!process.argv.includes("--apply")) {
  console.log(
    "Validated TUES MK4 Carbon only / two successors. No remote writes.",
  );
  process.exit(0);
}
if (source.components.some((c) => c.slug !== "yt-tues-mk4-carbon"))
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
  copy("atlas_frame_v28", source) +
  copy("atlas_frame_successors", mapping) +
  copy("atlas_frame_anchor_corrections", corrections) +
  readFileSync("supabase/operations/publish-frame-v28.sql", "utf8") +
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
  "Published two TUES MK4 Carbon successors; other frames and presets unchanged.",
);
