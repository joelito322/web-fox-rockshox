// Local-only explicit anchor allowlist. Run after final offline capture, before Cloud publication.
import { readFileSync, writeFileSync } from "node:fs";
const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const rows = read("models/catalog-v23/predecessors.json"),
  source = read("supabase/catalog/frames-v23-reviewed.json"),
  uploads = read("models/catalog-v23/uploads.json");
const allowed = ["saddle"];
const changes = rows.map((row) => {
  const c = uploads.find((c) => c.predecessor_id === row.variant.id),
    asset = source.assets.find((a) => a.id === c.asset_id),
    before = row.asset.manifest.anchors,
    after = asset.manifest.anchors;
  const changed = Object.keys(before).filter(
    (k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]),
  );
  if (changed.some((k) => !allowed.includes(k)) || changed.length !== 1)
    throw Error("Unexpected anchor drift");
  return {
    predecessor: row.variant.id,
    successor: c.variant_id,
    asset: c.asset_id,
    size: row.variant.specs.size_label,
    before,
    after,
    changed,
    reason:
      "Only the estimated saddle marker is aligned with the photographed upper seat-tube axis; its reference length and every other anchor stay unchanged. Historical resources remain immutable.",
  };
});
writeFileSync(
  "models/catalog-v23/anchor-changes.json",
  JSON.stringify(changes, null, 2) + "\n",
);
const sql = `-- Exact two-ID allowlist for Enduro saddle-axis visual-anchor changes only. Historical resources stay immutable.
-- Generated from the reviewed local anchor-changes.json, not from caller-selected permission flags.
create temporary table atlas_enduro_v23_anchor_contract(payload jsonb) on commit drop;
insert into atlas_enduro_v23_anchor_contract values ($anchor_contract$${JSON.stringify(changes)}$anchor_contract$::jsonb);
`;
writeFileSync("supabase/operations/frame-v23-anchor-contract.sql", sql);
console.log("Prepared two exact versioned anchor contracts; no Cloud writes.");
