begin;
do $$declare target public.component_variants;reference uuid;begin
 if (select count(distinct manifest->'parameters'->>'profile_key') from public.visual_assets where generator_key='atlas-bike-v4')<>53 then raise exception 'incomplete_profile_coverage';end if;
 if exists(select 1 from public.component_variants v join public.visual_assets a on a.id=v.visual_asset_id where v.selectable and v.published and a.generator_key<>'atlas-bike-v4') then raise exception 'old_visual_still_selectable';end if;
 if (select count(*) from public.component_variants v join public.visual_assets a on a.id=v.visual_asset_id where v.selectable and v.published and a.generator_key='atlas-bike-v4')<>114 then raise exception 'selectable_inventory_changed';end if;
 select v.* into strict target from public.component_variants v join public.components c on c.id=v.component_id where c.category='fork' and v.published limit 1;
 select a.id into reference from public.visual_assets a where generator_key='atlas-bike-v4' and manifest->'parameters'->>'profile_key'='commencal-meta-sx-v5' limit 1;
 target.id=gen_random_uuid();target.visual_asset_id=reference;target.published=false;target.selectable=false;
 begin
  insert into public.component_variants select(target).*;
  raise exception 'mismatched_profile_was_accepted';
 exception when check_violation then null;
 end;
 if not exists(select 1 from public.visual_assets where generator_key='atlas-bike-v1' and published) or not exists(select 1 from public.visual_assets where generator_key='atlas-bike-v2' and published) then raise exception 'legacy_resources_missing';end if;
end$$;
rollback;
