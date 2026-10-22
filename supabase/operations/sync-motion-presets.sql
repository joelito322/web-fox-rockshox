-- Four known public compositions only. Private builds and their immutable resources are untouched.
do $$declare e jsonb;old_v public.component_variants;new_v public.component_variants;changed integer;begin
 if (select jsonb_array_length(payload) from atlas_motion_presets)<>4 then raise exception 'expected_four_preset_frame_mappings';end if;
 for e in select value from atlas_motion_presets,jsonb_array_elements(payload) loop
  select * into strict old_v from public.component_variants where id=(e->>'before')::uuid;
  select * into strict new_v from public.component_variants where id=(e->>'after')::uuid;
  if old_v.component_id<>new_v.component_id or old_v.specs<>new_v.specs or old_v.allowed_finishes<>new_v.allowed_finishes or not new_v.published or not new_v.selectable then raise exception 'motion_preset_contract_mismatch';end if;
  if not exists(select 1 from public.components where id=new_v.component_id and category='frame' and slug in ('commencal-meta-sx-v5','commencal-supreme-dh-v5')) then raise exception 'unexpected_motion_preset_frame';end if;
  if not exists(select 1 from public.bike_presets where id=(e->>'preset_id')::uuid and published and selectable and kind='example') then raise exception 'unexpected_motion_preset';end if;
  update public.bike_preset_items set variant_id=new_v.id where preset_id=(e->>'preset_id')::uuid and slot='frame' and variant_id in(old_v.id,new_v.id);
  get diagnostics changed=row_count;if changed<>1 then raise exception 'motion_preset_changed_concurrently';end if;
 end loop;
 if exists(select 1 from public.bike_preset_items i join public.bike_presets p on p.id=i.preset_id join public.component_variants v on v.id=i.variant_id where p.published and p.selectable and not v.selectable) then raise exception 'preset_still_has_retired_choices';end if;
end$$;
