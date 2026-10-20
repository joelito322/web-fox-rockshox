-- A published reference represents a complete bicycle, not a partial visual draft.
create or replace function public.save_preset(p_data jsonb,p_items jsonb) returns uuid language plpgsql security definer set search_path='' as $$declare v_id uuid;old_public boolean;item jsonb;begin
 perform iam.require_permission('presets.manage');
 if p_data is null or jsonb_typeof(p_data)<>'object' or p_items is null or jsonb_typeof(p_items)<>'array' or pg_column_size(p_items)>65536 or jsonb_array_length(p_items)>23 or(select count(distinct i->>'slot') from jsonb_array_elements(p_items)i)<>jsonb_array_length(p_items) then raise exception 'invalid_preset' using errcode='22023';end if;
 v_id=coalesce(nullif(p_data->>'id','')::uuid,gen_random_uuid());select published into old_public from public.bike_presets where id=v_id for update;
 if coalesce(old_public,false) or coalesce((p_data->>'published')::boolean,false) then perform iam.require_permission('presets.publish');end if;
 if coalesce((p_data->>'published')::boolean,false) then
  if not exists(select 1 from public.brands where id=(p_data->>'brand_id')::uuid and published) then raise exception 'publication_dependencies_missing' using errcode='23514';end if;
  if not exists(select 1 from jsonb_array_elements(p_items)i where i->>'slot'='frame') then raise exception 'frame_required' using errcode='23514';end if;
  if jsonb_array_length(p_items)<>23 then raise exception 'preset_positions_missing' using errcode='23514';end if;
  if coalesce(p_data->>'kind','')='factory' and(jsonb_typeof(p_data->'sources') is distinct from 'array' or jsonb_array_length(p_data->'sources')=0) then raise exception 'factory_source_required' using errcode='23514';end if;
 end if;
 for item in select value from jsonb_array_elements(p_items) loop perform iam.validate_item(item,false);end loop;
 insert into public.bike_presets(id,brand_id,name,slug,family_key,label,model_year,image_key,kind,sources,published,selectable) values(v_id,(p_data->>'brand_id')::uuid,p_data->>'name',p_data->>'slug',p_data->>'family_key',p_data->>'label',(p_data->>'model_year')::smallint,p_data->>'image_key',p_data->>'kind',coalesce(p_data->'sources','[]'::jsonb),coalesce((p_data->>'published')::boolean,false),coalesce((p_data->>'selectable')::boolean,true)) on conflict(id) do update set brand_id=excluded.brand_id,name=excluded.name,slug=excluded.slug,family_key=excluded.family_key,label=excluded.label,model_year=excluded.model_year,image_key=excluded.image_key,kind=excluded.kind,sources=excluded.sources,published=excluded.published,selectable=excluded.selectable;
 delete from public.bike_preset_items where preset_id=v_id;
 insert into public.bike_preset_items(preset_id,slot,variant_id,finish_id,custom_color) select v_id,i->>'slot',(i->>'variantId')::uuid,i->>'finishId',upper(i->>'customColor') from jsonb_array_elements(p_items)i;
 return v_id;
end$$;
