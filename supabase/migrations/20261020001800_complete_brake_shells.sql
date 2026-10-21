-- V7 restores replacement caliper shells after the legacy filtering phase; preserve v6.
alter table public.visual_assets drop constraint supported_published_generator;
alter table public.visual_assets add constraint supported_published_generator check(not published or kind <> 'procedural' or generator_key in ('atlas-bike-v1','atlas-bike-v2','atlas-bike-v3','atlas-bike-v4','atlas-bike-v5','atlas-bike-v6','atlas-bike-v7'));
alter table public.visual_assets add constraint visual_v7_requires_profile check(generator_key is distinct from 'atlas-bike-v7' or (manifest->'parameters'->>'profile_key') is not null);
create or replace function iam.enforce_visual_profile() returns trigger language plpgsql security definer set search_path='' as $$
declare expected text;actual text;begin
 if tg_table_name='component_variants' then
  select c.category,iam.visual_profile_category(a.manifest->'parameters'->>'profile_key') into expected,actual
   from public.components c join public.visual_assets a on a.id=new.visual_asset_id and (a.generator_key in ('atlas-bike-v3','atlas-bike-v4','atlas-bike-v5','atlas-bike-v6','atlas-bike-v7') or a.manifest->'parameters'->>'mount_space' is not null) where c.id=new.component_id;
  if found and expected is distinct from actual then raise exception 'visual_profile_category_mismatch' using errcode='23514';end if;
 elsif tg_table_name='components' then
  if exists(select 1 from public.component_variants v join public.visual_assets a on a.id=v.visual_asset_id where v.component_id=new.id and (a.generator_key in ('atlas-bike-v3','atlas-bike-v4','atlas-bike-v5','atlas-bike-v6','atlas-bike-v7') or a.manifest->'parameters'->>'mount_space' is not null) and new.category is distinct from iam.visual_profile_category(a.manifest->'parameters'->>'profile_key')) then raise exception 'visual_profile_category_mismatch' using errcode='23514';end if;
 elsif new.generator_key in ('atlas-bike-v3','atlas-bike-v4','atlas-bike-v5','atlas-bike-v6','atlas-bike-v7') or new.manifest->'parameters'->>'mount_space' is not null then
  if exists(select 1 from public.component_variants v join public.components c on c.id=v.component_id where v.visual_asset_id=new.id and c.category is distinct from iam.visual_profile_category(new.manifest->'parameters'->>'profile_key')) then raise exception 'visual_profile_category_mismatch' using errcode='23514';end if;
 end if;
 return new;
end$$;
