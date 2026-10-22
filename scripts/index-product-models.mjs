// Classify published products separately from local research; no cloud writes.
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
const read = (p) => JSON.parse(readFileSync(p));
const bases = [
  "visual-v7-reviewed",
  "cockpit-reviewed",
  "gravity-reviewed",
].map((n) => read("supabase/catalog/" + n + ".json"));
let variants = [
  ...new Map(bases.flatMap((s) => s.variants).map((v) => [v.id, v])).values(),
];
for (const version of readdirSync("supabase/catalog")
  .map((n) => /^frames-v(\d+)-reviewed\.json$/.exec(n))
  .filter(Boolean)
  .map((m) => Number(m[1]))
  .filter((v) => v !== 12)
  .sort((a, b) => a - b)) {
  const source = read(`supabase/catalog/frames-v${version}-reviewed.json`),
    mapping = read(`supabase/catalog/frames-v${version}-successors.json`);
  variants = variants.filter((v) => !mapping[v.id]).concat(source.variants);
}
const current = new Set(
  variants
    .filter((v) => v.published && v.selectable)
    .map((v) => v.visual_asset_id),
);
const files = new Map();
for (const version of readdirSync("models").filter((n) =>
  /^catalog-v\d+$/.test(n),
)) {
  const path = join("models", version, "uploads.json");
  if (!existsSync(path)) continue;
  for (const capture of read(path)) {
    const file = capture.file.startsWith("models/")
      ? capture.file
      : join("models", version, "exports", capture.file);
    if (!file.endsWith(".glb")) continue;
    if (!existsSync(file))
      throw Error("Missing final published model: " + file);
    const bytes = readFileSync(file),
      sha256 = createHash("sha256").update(bytes).digest("hex");
    if (sha256 !== capture.sha256)
      throw Error("Changed published model: " + file);
    const item = files.get(file) ?? {
      file,
      sha256,
      bytes: bytes.length,
      usage: "published-history",
      asset_ids: [],
    };
    item.asset_ids.push(capture.asset_id);
    if (current.has(capture.asset_id)) item.usage = "current-catalog";
    files.set(file, item);
  }
}
const result = {
  policy:
    "current-catalog and published-history are final products; saved builds may require historical assets. Experiments/references/results live in ignored models/local.",
  models: [...files.values()].sort((a, b) => a.file.localeCompare(b.file)),
};
writeFileSync(
  "models/product-index.json",
  JSON.stringify(result, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    {
      files: result.models.length,
      current: result.models.filter((m) => m.usage === "current-catalog")
        .length,
      historical: result.models.filter((m) => m.usage === "published-history")
        .length,
      bytes: result.models.reduce((s, m) => s + m.bytes, 0),
    },
    null,
    2,
  ),
);
