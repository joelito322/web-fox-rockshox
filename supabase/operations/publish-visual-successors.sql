-- Run only after ingesting the reviewed successor assets/variants, within the same transaction.
-- Match exact source identities. Never update published assets or physical variant fields.
do $$declare pair record;old_row public.component_variants;new_row public.component_variants;begin
 for pair in select key as predecessor,value #>> '{}' as successor from atlas_visual_successors,jsonb_each(payload->'successors') loop
  select * into strict old_row from public.component_variants where id=pair.predecessor::uuid;
  select * into strict new_row from public.component_variants where id=pair.successor::uuid;
  if old_row.component_id<>new_row.component_id or old_row.specs<>new_row.specs or old_row.allowed_finishes<>new_row.allowed_finishes then raise exception 'visual_successor_changes_business_specification'; end if;
  if old_row.id=new_row.id then continue; end if;
  if not exists(select 1 from public.visual_assets where id=new_row.visual_asset_id and (generator_key=(select payload->>'generator' from atlas_visual_successors) or ((select payload->>'generator' from atlas_visual_successors) in ('atlas-bike-v5','atlas-bike-v6') and kind='glb' and manifest->'parameters'->>'mount_space' is not null))) then raise exception 'visual_successor_resource_missing';end if;
  update public.component_variants set selectable=false where id=old_row.id;
 end loop;
end$$;
