-- Invoked inside a transaction after immutable Storage checksum verification.
-- Existing brands/components must already exist; metadata and non-frame choices are untouched.
do $$declare e jsonb;pair record;prior public.component_variants;fresh public.component_variants;actual public.visual_assets;begin
 if (select count(*) from atlas_frame_successors,jsonb_each(payload))<>2 then raise exception 'v28_mapping_count';end if;
 for e in select value from atlas_frame_v28,jsonb_array_elements(payload->'assets') loop
  select * into actual from public.visual_assets where id=(e->>'id')::uuid;
  if found then
   if actual.storage_path is distinct from e->>'storage_path' or actual.manifest is distinct from e->'manifest' or actual.kind<>'glb' then raise exception 'frame_v28_asset_identity_conflict';end if;
  else insert into public.visual_assets select(jsonb_populate_record(null::public.visual_assets,e)).*;end if;
 end loop;
 for e in select value from atlas_frame_v28,jsonb_array_elements(payload->'variants') loop
  insert into public.component_variants select(jsonb_populate_record(null::public.component_variants,e)).* on conflict(id) do nothing;
 end loop;
 for pair in select key as predecessor,value #>> '{}' as successor from atlas_frame_successors,jsonb_each(payload) loop
  select * into strict prior from public.component_variants where id=pair.predecessor::uuid;
  select * into strict fresh from public.component_variants where id=pair.successor::uuid;
  if prior.component_id<>fresh.component_id or prior.specs<>fresh.specs or prior.allowed_finishes<>fresh.allowed_finishes or prior.generation is distinct from fresh.generation or prior.model_year is distinct from fresh.model_year then raise exception 'frame_v28_changes_business_specification';end if;
  if not exists(select 1 from public.components c join public.visual_assets a on a.id=fresh.visual_asset_id join public.visual_assets old_a on old_a.id=prior.visual_asset_id where c.id=fresh.component_id and c.category='frame' and c.slug='yt-tues-mk4-carbon' and old_a.storage_path like 'catalog/v27/%' and a.kind='glb' and a.storage_path like 'catalog/v28/%' and a.manifest-'anchors'=old_a.manifest-'anchors' and exists(select 1 from atlas_frame_anchor_corrections t cross join lateral jsonb_array_elements(t.payload) correction where correction->>'predecessor_id'=prior.id::text and correction->>'successor_id'=fresh.id::text and correction->'before'=old_a.manifest->'anchors' and correction->'after'=a.manifest->'anchors' and correction->'before'->'rear_axle'=correction->'after'->'rear_axle' and not exists(select 1 from jsonb_array_elements_text(correction->'changed_keys') k where k not in ('head_tube','head_tube_lower','seat_tube','saddle','shock_upper','shock_lower','suspension_pivot','front_axle')))) then raise exception 'frame_v28_resource_contract_mismatch';end if;
  update public.component_variants set selectable=false where id=prior.id;
 end loop;
 if (select count(*) from public.component_variants v join public.components c on c.id=v.component_id where c.category='frame' and v.published and v.selectable)<>30 then raise exception 'unexpected_frame_selection_count';end if;
end$$;
