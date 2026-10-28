import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import {
  readProjectEnvironment,
  postgresEnvironment,
} from "./lib/environment.mjs";
const review = JSON.parse(
  readFileSync("supabase/catalog/retail-price-review.json", "utf8"),
);
const planned = new Map(review.offers.map((o) => [o.offer_id, o]));
if (planned.size !== review.offers.length || review.currency !== "PEN")
  throw new Error("Duplicate offers or unexpected review currency");
for (const o of review.offers) {
  if (
    !review.models[o.slug] ||
    !Number.isSafeInteger(o.price_cents) ||
    o.price_cents < 1 ||
    o.source_ids.some((id) => !review.sources[id])
  )
    throw new Error("Invalid price review contract: " + o.slug);
}
const q = `select coalesce(json_agg(t),'[]') from (
 select o.id,o.base_price_cents,o.item_condition,o.unit_of_sale,o.updated_by,
 c.slug,c.category,exists(select 1 from public.promotion_offers l join public.promotions p on p.id=l.promotion_id where l.offer_id=o.id and p.active and p.ends_at>clock_timestamp()) campaign
 from public.store_offers o join public.components c on c.id=o.component_id
 where o.sku not like 'BROWSER-validation-%' and o.sku not like 'RACE-%'
 order by o.id)t;`;
const result = spawnSync("psql", ["-X", "-At", "-v", "ON_ERROR_STOP=1"], {
  env: postgresEnvironment(readProjectEnvironment()),
  input: q,
  encoding: "utf8",
  timeout: 60000,
});
if (result.status !== 0) throw new Error("Cannot audit live catalogue prices");
const rows = JSON.parse(result.stdout);
const failures = [],
  preserved = [];
for (const row of rows) {
  const expected = planned.get(row.id);
  if (!expected) {
    failures.push({ id: row.id, reason: "missing_review" });
    continue;
  }
  if (
    row.slug !== expected.slug ||
    row.unit_of_sale !== expected.unit ||
    row.item_condition !== expected.condition
  )
    failures.push({ id: row.id, reason: "product_contract_changed" });
  if (row.base_price_cents !== expected.price_cents) {
    (row.updated_by || row.campaign ? preserved : failures).push({
      id: row.id,
      reason: "price_differs",
      actual: row.base_price_cents,
      reviewed: expected.price_cents,
    });
  }
}
for (const id of planned.keys())
  if (!rows.some((r) => r.id === id))
    failures.push({ id, reason: "reviewed_offer_missing" });
const report = {
  checked_at: new Date().toISOString(),
  offers: rows.length,
  reviewed_models: Object.keys(review.models).length,
  failures,
  preserved,
};
mkdirSync("models/local/validation/pricing", { recursive: true });
writeFileSync(
  "models/local/validation/pricing/audit.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report));
if (failures.length)
  throw new Error("Catalogue prices differ from their product review");
