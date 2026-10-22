-- User-requested rollback: restore v11 selection without changing saved builds or immutable resources.
-- atlas_frame_successors(payload jsonb) contains the original v11 -> v12 map.
do $$declare pair record;prior public.component_variants;fresh public.component_variants;begin
 if (select count(*) from atlas_frame_successors,jsonb_object_keys(payload))<>30 then raise exception 'rollback_mapping_mismatch';end if;
 for pair in select key as predecessor,value #>> '{}' as successor from atlas_frame_successors,jsonb_each(payload) loop
  select * into strict prior from public.component_variants where id=pair.predecessor::uuid;
  select * into strict fresh from public.component_variants where id=pair.successor::uuid;
  if prior.component_id<>fresh.component_id or prior.specs<>fresh.specs or prior.allowed_finishes<>fresh.allowed_finishes then raise exception 'rollback_specification_mismatch';end if;
  if not exists(select 1 from public.components c join public.visual_assets a on a.id=prior.visual_asset_id join public.visual_assets b on b.id=fresh.visual_asset_id where c.id=prior.component_id and c.category='frame' and a.storage_path like 'catalog/v11/%' and b.storage_path like 'catalog/v12/%') then raise exception 'rollback_resource_mismatch';end if;
  update public.component_variants set selectable=false where id=fresh.id;
  update public.component_variants set selectable=true where id=prior.id;
  update public.bike_preset_items set variant_id=prior.id where slot='frame' and variant_id=fresh.id;
 end loop;
 if (select count(*) from public.component_variants v join public.components c on c.id=v.component_id where c.category='frame' and v.published and v.selectable)<>30 then raise exception 'rollback_frame_count_mismatch';end if;
end$$;
