// Read-only acceptance of additive gravity publication and preservation of existing identities.
import {readFileSync}from'node:fs';import{spawnSync}from'node:child_process';
import{readProjectEnvironment,postgresEnvironment}from'./lib/environment.mjs';
const read=name=>JSON.parse(readFileSync(`supabase/catalog/${name}.json`,'utf8'));
const fresh=read('gravity-reviewed'),names=['initial-reviewed','braking-reviewed','suspension-reviewed','frames-reviewed','tyres-reviewed','visual-v3-reviewed','visual-v4-reviewed','visual-v5-reviewed','visual-v6-reviewed','visual-v7-reviewed','cockpit-reviewed'];
const old=names.map(read),unique=rows=>[...new Map(rows.map(r=>[r.id,r])).values()];
const variants=unique(old.flatMap(x=>x.variants)),assets=unique(old.flatMap(x=>x.assets)),models=unique(old.flatMap(x=>x.components));
const current=unique([...read('visual-v7-reviewed').variants,...read('cockpit-reviewed').variants]);
const payload={variants:variants.map(({id,visual_asset_id})=>({id,visual_asset_id})),assets:assets.map(({id,kind,generator_key,storage_path,manifest})=>({id,kind,generator_key,storage_path,manifest})),current:current.map(({id,published,selectable})=>({id,published,selectable})),fresh};
const literal="'"+JSON.stringify(payload).replaceAll("'","''")+"'::jsonb";
const sql=`begin read only;
with source as(select ${literal} data), checks as(select
 (select count(*) from public.components)=${models.length+fresh.components.length} models,
 (select count(*) from public.component_variants where published and selectable)=${current.filter(v=>v.published&&v.selectable).length+fresh.variants.length} selections,
 (select count(*) from public.component_variants)=${variants.length+fresh.variants.length} variant_history,
 (select count(*) from public.visual_assets)=${assets.length+fresh.assets.length} asset_history,
 (select count(*) from public.bike_presets where published and selectable)=4 presets,
 (select count(*) from public.bike_preset_items)=92 preset_positions,
 not exists(select 1 from source s cross join lateral jsonb_array_elements(s.data->'variants') e left join public.component_variants v on v.id=(e->>'id')::uuid where v.id is null or v.visual_asset_id is distinct from (e->>'visual_asset_id')::uuid) previous_variant_resources_unchanged,
 not exists(select 1 from source s cross join lateral jsonb_array_elements(s.data->'assets') e left join public.visual_assets a on a.id=(e->>'id')::uuid where a.id is null or a.kind is distinct from e->>'kind' or a.generator_key is distinct from e->>'generator_key' or a.storage_path is distinct from e->>'storage_path' or a.manifest is distinct from e->'manifest') previous_geometry_unchanged,
 not exists(select 1 from source s cross join lateral jsonb_array_elements(s.data->'current') e left join public.component_variants v on v.id=(e->>'id')::uuid where v.id is null or v.published is distinct from (e->>'published')::boolean or v.selectable is distinct from (e->>'selectable')::boolean) previous_choices_preserved,
 not exists(select 1 from source s cross join lateral jsonb_array_elements(s.data->'fresh'->'variants') e left join public.component_variants v on v.id=(e->>'id')::uuid where v.id is null or v.specs is distinct from e->'specs' or v.generation is distinct from e->>'generation' or v.visual_asset_id is distinct from (e->>'visual_asset_id')::uuid or not v.published or not v.selectable) new_specs_and_identities_match,
 not exists(select 1 from source s cross join lateral jsonb_array_elements(s.data->'fresh'->'assets') e left join public.visual_assets a on a.id=(e->>'id')::uuid where a.id is null or a.kind is distinct from 'glb' or a.manifest is distinct from e->'manifest' or a.storage_path is distinct from e->>'storage_path' or not a.published) new_visual_contracts_match,
 (select convalidated from pg_constraint where conname='gravity_profile_glb_contract') profile_constraint_validated)
select row_to_json(checks) from checks;
set local role anon;
select json_build_object('public_gravity_choices',count(*)=26) from public.component_variants v join public.visual_assets a on a.id=v.visual_asset_id where v.published and v.selectable and a.storage_path like 'catalog/v9/%';rollback;`;
const result=spawnSync('psql',['-X','-qAt','-v','ON_ERROR_STOP=1'],{input:sql,env:postgresEnvironment(readProjectEnvironment()),encoding:'utf8',maxBuffer:2*1024*1024});
if(result.status!==0){console.error('Read-only gravity validation failed.');process.exit(1);}
let failed=false;for(const row of result.stdout.trim().split('\n').map(s=>JSON.parse(s)))for(const[name,passed]of Object.entries(row)){console.log(`${passed?'PASS':'FAIL'} ${name}`);if(!passed)failed=true;}
if(failed)process.exitCode=1;
