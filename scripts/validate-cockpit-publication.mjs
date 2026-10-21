// Read-only publication acceptance; no account, fixture or remote write is created.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { readProjectEnvironment, postgresEnvironment } from './lib/environment.mjs';

const read = (name) => JSON.parse(readFileSync(`supabase/catalog/${name}.json`, 'utf8'));
const current = read('visual-v7-reviewed');
const commercial = read('cockpit-reviewed');
const historicalSources = [
  'initial-reviewed', 'braking-reviewed', 'suspension-reviewed', 'frames-reviewed',
  'tyres-reviewed', 'visual-v3-reviewed', 'visual-v4-reviewed', 'visual-v5-reviewed',
  'visual-v6-reviewed', 'visual-v7-reviewed',
].map(read);
const unique = (rows) => [...new Map(rows.map((row) => [row.id, row])).values()];
const legacyVariants = unique(historicalSources.flatMap((source) => source.variants));
const legacyAssets = unique(historicalSources.flatMap((source) => source.assets));
const payload = {
  current: current.variants.map(({ id, visual_asset_id, published, selectable }) => ({ id, visual_asset_id, published, selectable })),
  legacyVariants: legacyVariants.map(({ id, visual_asset_id }) => ({ id, visual_asset_id })),
  legacyAssets: legacyAssets.map(({ id, kind, generator_key, storage_path, manifest }) => ({ id, kind, generator_key, storage_path, manifest })),
  newVariants: commercial.variants,
  newAssets: commercial.assets,
};
// Escaped PostgreSQL string literal sent directly on stdin; it is never shell text.
const literal = "'" + JSON.stringify(payload).replaceAll("'", "''") + "'::jsonb";
const sql = `begin read only;
with source as(select ${literal} data), checks as(
 select
 (select count(*) from public.components) >= 59 models,
 (select count(*) from public.component_variants where published and selectable) >= 120 selections,
 (select count(*) from public.bike_presets where published and selectable) = 4 presets,
 (select count(*) from public.bike_preset_items) = 92 preset_positions,
 (select count(*) from public.component_variants) >= ${legacyVariants.length + 6} variant_history,
 (select count(*) from public.visual_assets) >= ${legacyAssets.length + 6} asset_history,
 not exists(select 1 from source s cross join lateral jsonb_array_elements(s.data->'legacyVariants') e left join public.component_variants v on v.id=(e->>'id')::uuid where v.id is null or v.visual_asset_id is distinct from (e->>'visual_asset_id')::uuid) legacy_variant_resources_unchanged,
 not exists(select 1 from source s cross join lateral jsonb_array_elements(s.data->'legacyAssets') e left join public.visual_assets a on a.id=(e->>'id')::uuid where a.id is null or a.kind is distinct from e->>'kind' or a.generator_key is distinct from e->>'generator_key' or a.storage_path is distinct from e->>'storage_path' or a.manifest is distinct from e->'manifest') legacy_geometry_unchanged,
 not exists(select 1 from source s cross join lateral jsonb_array_elements(s.data->'current') e left join public.component_variants v on v.id=(e->>'id')::uuid where v.id is null or v.published is distinct from (e->>'published')::boolean or v.selectable is distinct from (e->>'selectable')::boolean) current_v7_publication_unchanged,
 not exists(select 1 from source s cross join lateral jsonb_array_elements(s.data->'newVariants') e left join public.component_variants v on v.id=(e->>'id')::uuid where v.id is null or not v.published or not v.selectable or v.specs is distinct from e->'specs' or v.visual_asset_id is distinct from (e->>'visual_asset_id')::uuid or v.manufacturer_code is distinct from e->>'manufacturer_code') commercial_variants_match,
 not exists(select 1 from source s cross join lateral jsonb_array_elements(s.data->'newAssets') e left join public.visual_assets a on a.id=(e->>'id')::uuid where a.id is null or a.generator_key is distinct from 'atlas-bike-v8' or a.manifest is distinct from e->'manifest' or not a.published) commercial_assets_match
)
select row_to_json(checks) from checks;
set local role anon;
select json_build_object('public_commercial_variants',count(*)=6) from public.component_variants v join public.visual_assets a on a.id=v.visual_asset_id join public.components c on c.id=v.component_id where v.published and v.selectable and a.generator_key='atlas-bike-v8';
rollback;`;
const result = spawnSync('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1'], {
  env: postgresEnvironment(readProjectEnvironment()), input: sql,
  encoding: 'utf8', maxBuffer: 1024 * 1024,
});
if (result.status !== 0) {
  console.error('Read-only cockpit publication validation failed.');
  process.exit(1);
}
const checks = result.stdout.trim().split('\n').map((line) => JSON.parse(line));
let failed = false;
for (const group of checks) {
  for (const [name, passed] of Object.entries(group)) {
    console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
    if (!passed) failed = true;
  }
}
if (failed) process.exitCode = 1;
