-- Draft compositions may reference unpublished parts; public builds never gain that permission.
create function iam.validate_item(p_item jsonb,p_allow_retired boolean,p_allow_unpublished boolean) returns void language plpgsql security definer set search_path='' as $$declare v public.component_variants;category text;begin
 if p_item is null or jsonb_typeof(p_item)<>'object' or iam.slot_category(p_item->>'slot') is null or nullif(p_item->>'variantId','') is null or nullif(p_item->>'finishId','') is null then raise exception 'invalid_item' using errcode='22023';end if;
 if exists(select 1 from jsonb_object_keys(p_item) k where k not in('slot','variantId','finishId','customColor')) then raise exception 'unknown_item_field' using errcode='22023';end if;
 select * into strict v from public.component_variants where id=(p_item->>'variantId')::uuid;
 select c.category into strict category from public.components c join public.brands b on b.id=c.brand_id where c.id=v.component_id and (p_allow_unpublished or (c.published and b.published));
 if category<>iam.slot_category(p_item->>'slot') or (not p_allow_unpublished and not v.published) then raise exception 'invalid_item_category' using errcode='22023';end if;
 if not v.selectable and not p_allow_retired then raise exception 'variant_retired' using errcode='23514';end if;
 if not exists(select 1 from jsonb_array_elements(v.allowed_finishes->'options') f where f->>'id'=p_item->>'finishId') then raise exception 'invalid_finish' using errcode='22023';end if;
 if p_item->>'customColor' is not null and(coalesce((v.allowed_finishes->>'custom_color_enabled')::boolean,false)=false or(p_item->>'customColor')!~'^#[0-9A-Fa-f]{6}$') then raise exception 'invalid_custom_color' using errcode='22023';end if;
end$$;
revoke all on function iam.validate_item(jsonb,boolean,boolean) from public,anon,authenticated;
create or replace function iam.validate_item(p_item jsonb,p_allow_retired boolean default false) returns void language sql security definer set search_path='' as $$select iam.validate_item(p_item,p_allow_retired,false);$$;
create function iam.validate_preset_document(p_data jsonb,p_items jsonb) returns void language plpgsql security definer set search_path='' as $$declare item jsonb;begin
 if p_data is null or jsonb_typeof(p_data)<>'object' or p_items is null or jsonb_typeof(p_items)<>'array' or pg_column_size(p_items)>65536 or jsonb_array_length(p_items)>23 or(select count(distinct i->>'slot') from jsonb_array_elements(p_items)i)<>jsonb_array_length(p_items) then raise exception 'invalid_preset' using errcode='22023';end if;
 if coalesce((p_data->>'published')::boolean,false) then
  if not exists(select 1 from public.brands where id=(p_data->>'brand_id')::uuid and published) then raise exception 'publication_dependencies_missing' using errcode='23514';end if;
  if not exists(select 1 from jsonb_array_elements(p_items)i where i->>'slot'='frame') then raise exception 'frame_required' using errcode='23514';end if;
  if jsonb_array_length(p_items)<>23 then raise exception 'preset_positions_missing' using errcode='23514';end if;
  if coalesce(p_data->>'kind','')='factory' and(jsonb_typeof(p_data->'sources') is distinct from 'array' or jsonb_array_length(p_data->'sources')=0) then raise exception 'factory_source_required' using errcode='23514';end if;
 end if;
 for item in select value from jsonb_array_elements(p_items) loop perform iam.validate_item(item,not coalesce((p_data->>'published')::boolean,false),not coalesce((p_data->>'published')::boolean,false));end loop;
end$$;
revoke all on function iam.validate_preset_document(jsonb,jsonb) from public,anon,authenticated;
-- A published reference represents a complete bicycle, not a partial visual draft.
create or replace function public.save_preset(p_data jsonb,p_items jsonb) returns uuid language plpgsql security definer set search_path='' as $$declare v_id uuid;old_public boolean;item jsonb;begin
 perform iam.require_permission('presets.manage');
 if p_data is null or jsonb_typeof(p_data)<>'object' or p_items is null or jsonb_typeof(p_items)<>'array' or pg_column_size(p_items)>65536 or jsonb_array_length(p_items)>23 or(select count(distinct i->>'slot') from jsonb_array_elements(p_items)i)<>jsonb_array_length(p_items) then raise exception 'invalid_preset' using errcode='22023';end if;
 v_id=coalesce(nullif(p_data->>'id','')::uuid,gen_random_uuid());select published into old_public from public.bike_presets where id=v_id for update;
 if coalesce(old_public,false) or coalesce((p_data->>'published')::boolean,false) then perform iam.require_permission('presets.publish');end if;
 perform iam.validate_preset_document(p_data,p_items);
 insert into public.bike_presets(id,brand_id,name,slug,family_key,label,model_year,image_key,kind,sources,published,selectable) values(v_id,(p_data->>'brand_id')::uuid,p_data->>'name',p_data->>'slug',p_data->>'family_key',p_data->>'label',(p_data->>'model_year')::smallint,p_data->>'image_key',p_data->>'kind',coalesce(p_data->'sources','[]'::jsonb),coalesce((p_data->>'published')::boolean,false),coalesce((p_data->>'selectable')::boolean,true)) on conflict(id) do update set brand_id=excluded.brand_id,name=excluded.name,slug=excluded.slug,family_key=excluded.family_key,label=excluded.label,model_year=excluded.model_year,image_key=excluded.image_key,kind=excluded.kind,sources=excluded.sources,published=excluded.published,selectable=excluded.selectable;
 delete from public.bike_preset_items where preset_id=v_id;
 insert into public.bike_preset_items(preset_id,slot,variant_id,finish_id,custom_color) select v_id,i->>'slot',(i->>'variantId')::uuid,i->>'finishId',upper(i->>'customColor') from jsonb_array_elements(p_items)i;
 return v_id;
end$$;
create function iam.enforce_brand() returns trigger language plpgsql security definer set search_path='' as $$begin
 if old.published and not new.published and exists(select 1 from public.components where brand_id=old.id and published) then raise exception 'published_parent_required' using errcode='23514';end if;
 return new;
end$$;
revoke all on function iam.enforce_brand() from public,anon,authenticated;
create trigger atlas_brand_publication before update on public.brands for each row execute function iam.enforce_brand();
-- Only reference editors may read draft options; public catalogue RLS is unchanged.
create function public.preset_options(p_category text default null,p_search text default '',p_page integer default 0,p_ids uuid[] default null) returns jsonb language plpgsql stable security definer set search_path='' as $$declare result jsonb;begin
 perform iam.require_permission('presets.manage');
 if p_page<0 or p_page>100000 or length(p_search)>150 or cardinality(p_ids)>23 then raise exception 'invalid_filter' using errcode='22023';end if;
 with filtered as(select c.id,c.name,c.category,b.name brand_name from public.components c join public.brands b on b.id=c.brand_id where (p_category is null or c.category=p_category) and strpos(lower(c.name),lower(p_search))>0 and (p_ids is null or exists(select 1 from public.component_variants v where v.component_id=c.id and v.id=any(p_ids)))), page as(select * from filtered order by name,id limit 24 offset p_page*24)
 select jsonb_build_object('count',(select count(*) from filtered),'brands',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name) order by name),'[]'::jsonb) from public.brands),'components',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'category',p.category,'brands',jsonb_build_object('name',p.brand_name),'component_variants',(select coalesce(jsonb_agg(to_jsonb(v) order by v.label,v.id),'[]'::jsonb) from public.component_variants v where v.component_id=p.id and(p_ids is null or v.id=any(p_ids)))) order by p.name,p.id) from page p),'[]'::jsonb)) into result;
 return result;
end$$;
revoke all on function public.preset_options(text,text,integer,uuid[]) from public,anon;
grant execute on function public.preset_options(text,text,integer,uuid[]) to authenticated;
