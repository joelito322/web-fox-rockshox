// Read-only database and immutable-resource validation, before or after scoped publication.
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import {
  readProjectEnvironment,
  postgresEnvironment,
} from "./lib/environment.mjs";
const read = (n) =>
    JSON.parse(readFileSync(`supabase/catalog/${n}.json`, "utf8")),
  unique = (rows) => [...new Map(rows.map((r) => [r.id, r])).values()];
const old = [
    "initial-reviewed",
    "braking-reviewed",
    "suspension-reviewed",
    "frames-reviewed",
    "tyres-reviewed",
    "visual-v3-reviewed",
    "visual-v4-reviewed",
    "visual-v5-reviewed",
    "visual-v6-reviewed",
    "visual-v7-reviewed",
    "cockpit-reviewed",
    "gravity-reviewed",
    "frames-v10-reviewed",
    "frames-v11-reviewed",
    "frames-v12-reviewed",
    "frames-v13-reviewed",
    "frames-v14-reviewed",
    "frames-v15-reviewed",
    "frames-v16-reviewed",
  ].map(read),
  source = read("frames-v17-reviewed"),
  mapping = read("frames-v17-successors"),
  before = process.argv.includes("--before");
const variants = unique(old.flatMap((s) => s.variants)),
  assets = unique(old.flatMap((s) => s.assets)),
  current = unique(
    ["visual-v7-reviewed", "cockpit-reviewed", "gravity-reviewed"].flatMap(
      (n) => read(n).variants,
    ),
  );
const v10map = read("frames-v10-successors");
const v10Current = [
  ...current.filter((v) => !v10map[v.id]),
  ...read("frames-v10-reviewed").variants,
];
const v11map = read("frames-v11-successors");
const v11Current = [
  ...v10Current.filter((v) => !v11map[v.id]),
  ...read("frames-v11-reviewed").variants,
];
const v13map = read("frames-v13-successors");
const v13Current = [
  ...v11Current.filter((v) => !v13map[v.id]),
  ...read("frames-v13-reviewed").variants,
];
const v14map = read("frames-v14-successors");
const v14Current = [
  ...v13Current.filter((v) => !v14map[v.id]),
  ...read("frames-v14-reviewed").variants,
];
const v15map = read("frames-v15-successors");
const v15Current = [
  ...v14Current.filter((v) => !v15map[v.id]),
  ...read("frames-v15-reviewed").variants,
];
const v16map=read("frames-v16-successors");
const actualCurrent=[...v15Current.filter(v=>!v16map[v.id]),...read("frames-v16-reviewed").variants];
const payload = {
  variants: variants.map(
    ({ id, visual_asset_id, specs, allowed_finishes }) => ({
      id,
      visual_asset_id,
      specs,
      allowed_finishes,
    }),
  ),
  assets: assets.map(({ id, kind, generator_key, storage_path, manifest }) => ({
    id,
    kind,
    generator_key,
    storage_path,
    manifest,
  })),
  current: actualCurrent
    .filter((v) => v.published && v.selectable)
    .map((v) => ({ id: v.id, selectable: before || !mapping[v.id] })),
  source,
};
const literal =
  "'" + JSON.stringify(payload).replaceAll("'", "''") + "'::jsonb";
const sql = `begin read only;
with s as(select ${literal} data),checks as(select
 (select count(*) from public.components)=70 models,
 (select count(*) from public.component_variants where published and selectable)=146 choices,
 (select count(*) from public.component_variants)=${variants.length + (before ? 0 : 2)} history_variants,
 (select count(*) from public.visual_assets)=${assets.length + (before ? 0 : 2)} history_assets,
 (select count(*) from public.bike_presets where published and selectable)=4 examples,
 (select count(*) from public.bike_preset_items)=92 example_positions,
 not exists(select 1 from s cross join lateral jsonb_array_elements(data->'assets') e left join public.visual_assets a on a.id=(e->>'id')::uuid where a.id is null or a.kind is distinct from e->>'kind' or a.storage_path is distinct from e->>'storage_path' or a.generator_key is distinct from e->>'generator_key' or a.manifest is distinct from e->'manifest') historical_geometry_preserved,
 not exists(select 1 from s cross join lateral jsonb_array_elements(data->'variants') e left join public.component_variants v on v.id=(e->>'id')::uuid where v.id is null or v.visual_asset_id is distinct from (e->>'visual_asset_id')::uuid or v.specs is distinct from e->'specs' or v.allowed_finishes is distinct from e->'allowed_finishes') historical_specs_preserved,
 not exists(select 1 from s cross join lateral jsonb_array_elements(data->'current') e join public.component_variants v on v.id=(e->>'id')::uuid where v.selectable is distinct from (e->>'selectable')::boolean) only_frame_choices_retired,
 (select count(*) from public.component_variants v join public.visual_assets a on a.id=v.visual_asset_id where v.published and v.selectable and a.storage_path like 'catalog/v17/%')=${before ? 0 : 2} new_choices,
 ${before ? "true" : `not exists(select 1 from s cross join lateral jsonb_array_elements(data->'source'->'assets') e left join public.visual_assets a on a.id=(e->>'id')::uuid where a.id is null or a.kind is distinct from 'glb' or a.manifest is distinct from e->'manifest' or a.storage_path is distinct from e->>'storage_path' or not a.published)`} new_visual_contracts_match,
 ${before ? "true" : `not exists(select 1 from s cross join lateral jsonb_array_elements(data->'source'->'variants') e left join public.component_variants v on v.id=(e->>'id')::uuid where v.id is null or v.visual_asset_id is distinct from (e->>'visual_asset_id')::uuid or v.specs is distinct from e->'specs' or v.allowed_finishes is distinct from e->'allowed_finishes' or not v.published or not v.selectable)`} new_specs_and_identities_match
 )select row_to_json(checks) from checks;rollback;`;
const result = spawnSync("psql", ["-X", "-qAt", "-v", "ON_ERROR_STOP=1"], {
  input: sql,
  env: postgresEnvironment(readProjectEnvironment()),
  encoding: "utf8",
  maxBuffer: 8 * 1024 * 1024,
});
if (result.status !== 0) {
  console.error("Read-only frame validation failed.");
  process.exit(1);
}
const checks = JSON.parse(result.stdout.trim());
for (const [n, passed] of Object.entries(checks))
  console.log(`${passed ? "PASS" : "FAIL"} ${n}`);
if (Object.values(checks).some((x) => !x)) process.exitCode = 1;
else
  writeFileSync(
    `models/catalog-v17/cloud-${before ? "before" : "after"}.json`,
    JSON.stringify(
      { checked_at: new Date().toISOString(), mode: "read-only", checks },
      null,
      2,
    ) + "\n",
  );
