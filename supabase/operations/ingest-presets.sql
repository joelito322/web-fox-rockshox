-- Trusted repository ingestion uses exactly the validation shared by the administrative RPC.
do $$declare document jsonb;entry jsonb;item jsonb;header jsonb;begin
 select payload into strict document from atlas_preset_import;
 for entry in select value from jsonb_array_elements(document->'presets') loop
  header=entry-'items';perform iam.validate_preset_document(header,entry->'items');
  insert into public.bike_presets select(jsonb_populate_record(null::public.bike_presets,header)).*
  on conflict(id) do update set brand_id=excluded.brand_id,name=excluded.name,slug=excluded.slug,family_key=excluded.family_key,label=excluded.label,model_year=excluded.model_year,image_key=excluded.image_key,kind=excluded.kind,sources=excluded.sources,published=excluded.published,selectable=excluded.selectable;
  delete from public.bike_preset_items where preset_id=(entry->>'id')::uuid;
  insert into public.bike_preset_items(preset_id,slot,variant_id,finish_id,custom_color) select(entry->>'id')::uuid,i->>'slot',(i->>'variantId')::uuid,i->>'finishId',upper(i->>'customColor') from jsonb_array_elements(entry->'items')i;
 end loop;
end$$;
