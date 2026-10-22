// Local-only explicit anchor allowlist. Run after final offline capture, before Cloud publication.
import { readFileSync, writeFileSync } from "node:fs";
const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const rows = read("models/catalog-v24/predecessors.json"),
  source = read("supabase/catalog/frames-v24-reviewed.json"),
  uploads = read("models/catalog-v24/uploads.json");
const allowed = [
  "seat_tube",
  "saddle",
  "shock_upper",
  "shock_lower",
  "suspension_pivot",
  "chain_idler",
];
const changes = rows.map((row) => {
  const c = uploads.find((c) => c.predecessor_id === row.variant.id),
    asset = source.assets.find((a) => a.id === c.asset_id),
    before = row.asset.manifest.anchors,
    after = asset.manifest.anchors;
  const changed = Object.keys(before).filter(
    (k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]),
  );
  if (changed.some((k) => !allowed.includes(k)) || changed.length !== 6)
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
      "The old visual tracing represents Sender 2021. MY25 photographs replace its estimated shock, seat, principal pivot and coaxial idler registration. Commercial head/BB/axles remain unchanged.",
  };
});
writeFileSync(
  "models/catalog-v24/anchor-changes.json",
  JSON.stringify(changes, null, 2) + "\n",
);
const sql = `-- Exact two-ID allowlist for Sender MY25 visual-anchor changes only. Historical resources stay immutable.
-- Generated from the reviewed local anchor-changes.json, not from caller-selected permission flags.
create temporary table atlas_sender_v24_anchor_contract(payload jsonb) on commit drop;
insert into atlas_sender_v24_anchor_contract values ($anchor_contract$${JSON.stringify(changes)}$anchor_contract$::jsonb);
`;
writeFileSync("supabase/operations/frame-v24-anchor-contract.sql", sql);
console.log("Prepared two exact versioned anchor contracts; no Cloud writes.");
