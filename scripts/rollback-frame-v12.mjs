import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import {
  readProjectEnvironment,
  postgresEnvironment,
} from "./lib/environment.mjs";
const mapping = JSON.parse(
  readFileSync("supabase/catalog/frames-v12-successors.json", "utf8"),
);
if (
  Object.keys(mapping).length !== 30 ||
  new Set(Object.values(mapping)).size !== 30
)
  throw Error("Invalid rollback mapping");
const copy = `create temporary table atlas_frame_successors(payload jsonb) on commit drop;\ncopy atlas_frame_successors(payload) from stdin with(format csv);\n"${JSON.stringify(mapping).replaceAll('"', '""')}"\n\\.\n`;
const checks = `with pairs as(select key::uuid old_id,(value #>> '{}')::uuid new_id from atlas_frame_successors,jsonb_each(payload)),checks as(select
 (select count(*) from public.component_variants where published and selectable)=146 choices,
 (select count(*) from pairs p join public.component_variants v on v.id=p.old_id join public.visual_assets a on a.id=v.visual_asset_id where v.published and v.selectable and a.storage_path like 'catalog/v11/%')=30 restored_frames,
 (select count(*) from pairs p join public.component_variants v on v.id=p.new_id where not v.selectable)=30 withdrawn_frames,
 not exists(select 1 from public.bike_preset_items i join pairs p on p.new_id=i.variant_id) presets_restored,
 (select count(*) from public.component_variants)=728 history_variants_preserved,
 (select count(*) from public.visual_assets)=726 history_assets_preserved
)select row_to_json(checks) from checks;`;
const apply = process.argv.includes("--apply");
const result = spawnSync("psql", ["-X", "-qAt", "-v", "ON_ERROR_STOP=1"], {
  input:
    (apply ? "begin;\n" : "begin read only;\n") +
    copy +
    (apply
      ? readFileSync("supabase/operations/rollback-frame-v12.sql", "utf8")
      : "") +
    "\n" +
    checks +
    "\ncommit;",
  env: postgresEnvironment(readProjectEnvironment()),
  encoding: "utf8",
  maxBuffer: 1024 * 1024,
});
if (result.status !== 0) {
  console.error("Rollback transaction failed:", result.stderr);
  process.exit(1);
}
const verified = JSON.parse(result.stdout.trim());
console.log(JSON.stringify({ applied: apply, checks: verified }));
if (Object.values(verified).some((v) => !v)) process.exit(1);
writeFileSync(
  apply ? "models/catalog-v12/rollback.json" : "models/catalog-v12/rollback-check.json",
  JSON.stringify(
    { checked_at: new Date().toISOString(), applied: apply, checks: verified },
    null,
    2,
  ) + "\n",
);
