create table public.builds(id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade,name text not null check(length(btrim(name)) between 1 and 80),schema_version integer not null default 1 check(schema_version=1),revision integer not null default 1 check(revision>0),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.build_items(id uuid primary key default gen_random_uuid(),build_id uuid not null references public.builds on delete cascade,slot text not null check(iam.slot_category(slot) is not null),variant_id uuid not null references public.component_variants on delete restrict,finish_id text not null,custom_color text check(custom_color is null or custom_color~'^#[0-9A-F]{6}$'),unique(build_id,slot));
create index builds_owner_updated_idx on public.builds(user_id,updated_at desc,id);
create index build_items_variant_idx on public.build_items(variant_id);
alter table public.builds enable row level security;alter table public.build_items enable row level security;
revoke all on public.builds,public.build_items from public,anon,authenticated;
grant select,delete on public.builds to authenticated;grant select on public.build_items to authenticated;
create policy own_builds_read on public.builds for select to authenticated using(user_id=auth.uid() and public.has_permission('builds.read_own'));
create policy own_builds_delete on public.builds for delete to authenticated using(user_id=auth.uid() and public.has_permission('builds.delete_own'));
create policy own_build_items_read on public.build_items for select to authenticated using(exists(select 1 from public.builds b where b.id=build_id and b.user_id=auth.uid()));

create function iam.normalized_items(p_items jsonb) returns jsonb language sql immutable set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('slot',i->>'slot','variantId',i->>'variantId','finishId',i->>'finishId','customColor',upper(i->>'customColor')) order by i->>'slot'),'[]'::jsonb) from jsonb_array_elements(p_items) i;
$$;
create function iam.validate_item(p_item jsonb,p_allow_retired boolean default false) returns void language plpgsql security definer set search_path='' as $$declare v public.component_variants;category text;begin
 if p_item is null or jsonb_typeof(p_item)<>'object' or iam.slot_category(p_item->>'slot') is null or nullif(p_item->>'variantId','') is null or nullif(p_item->>'finishId','') is null then raise exception 'invalid_item' using errcode='22023';end if;
 if exists(select 1 from jsonb_object_keys(p_item) k where k not in('slot','variantId','finishId','customColor')) then raise exception 'unknown_item_field' using errcode='22023';end if;
 select * into strict v from public.component_variants where id=(p_item->>'variantId')::uuid;
 select c.category into strict category from public.components c join public.brands b on b.id=c.brand_id where c.id=v.component_id and c.published and b.published;
 if category<>iam.slot_category(p_item->>'slot') or not v.published then raise exception 'invalid_item_category' using errcode='22023';end if;
 if not v.selectable and not p_allow_retired then raise exception 'variant_retired' using errcode='23514';end if;
 if not exists(select 1 from jsonb_array_elements(v.allowed_finishes->'options') f where f->>'id'=p_item->>'finishId') then raise exception 'invalid_finish' using errcode='22023';end if;
 if p_item->>'customColor' is not null and(coalesce((v.allowed_finishes->>'custom_color_enabled')::boolean,false)=false or(p_item->>'customColor')!~'^#[0-9A-Fa-f]{6}$') then raise exception 'invalid_custom_color' using errcode='22023';end if;
end$$;
create function public.save_build(p_build_id uuid,p_expected_revision integer,p_configuration jsonb) returns jsonb language plpgsql security definer set search_path='' as $$declare header public.builds;items jsonb;previous jsonb;item jsonb;owner uuid;can_keep boolean;result jsonb;begin
 perform iam.require_permission('builds.write_own');owner=auth.uid();
 if p_build_id is null or p_expected_revision is null or p_expected_revision<0 or p_configuration is null or jsonb_typeof(p_configuration)<>'object' or pg_column_size(p_configuration)>65536 or coalesce(p_configuration->>'schemaVersion','')<>'1' or nullif(btrim(p_configuration->>'name'),'') is null or length(btrim(p_configuration->>'name'))>80 or coalesce(jsonb_typeof(p_configuration->'items'),'null')<>'array' then raise exception 'invalid_configuration' using errcode='22023';end if;
 if exists(select 1 from jsonb_object_keys(p_configuration) k where k not in('schemaVersion','name','items')) then raise exception 'unknown_configuration_field' using errcode='22023';end if;
 items=iam.normalized_items(p_configuration->'items');
 if jsonb_array_length(items)>23 or(select count(distinct i->>'slot') from jsonb_array_elements(items)i)<>jsonb_array_length(items) then raise exception 'invalid_slots' using errcode='22023';end if;
 select * into header from public.builds where id=p_build_id for update;
 if found then
  if header.user_id<>owner then raise exception 'not_owner' using errcode='42501';end if;
  if header.revision<>p_expected_revision or p_expected_revision=0 then raise exception 'revision_conflict' using errcode='40001';end if;
  select coalesce(jsonb_agg(jsonb_build_object('slot',slot,'variantId',variant_id,'finishId',finish_id,'customColor',custom_color) order by slot),'[]'::jsonb) into previous from public.build_items where build_id=p_build_id;
  if items<>previous then perform iam.require_permission('configurator.use');end if;
 else
  if p_expected_revision<>0 then raise exception 'build_no_longer_exists' using errcode='40001';end if;
  perform iam.require_permission('configurator.use');
 end if;
 for item in select value from jsonb_array_elements(p_configuration->'items') loop
  can_keep=exists(select 1 from public.build_items where build_id=p_build_id and slot=item->>'slot' and variant_id=(item->>'variantId')::uuid);
  perform iam.validate_item(item,can_keep);
 end loop;
 if header.id is null then
  insert into public.builds(id,user_id,name) values(p_build_id,owner,btrim(p_configuration->>'name'));
 else
  update public.builds set name=btrim(p_configuration->>'name'),revision=revision+1,updated_at=now() where id=p_build_id;
 end if;
 delete from public.build_items where build_id=p_build_id;
 insert into public.build_items(build_id,slot,variant_id,finish_id,custom_color) select p_build_id,i->>'slot',(i->>'variantId')::uuid,i->>'finishId',upper(i->>'customColor') from jsonb_array_elements(items)i;
 select jsonb_build_object('id',id,'name',name,'revision',revision,'updated_at',updated_at) into result from public.builds where id=p_build_id;
 return result;
end$$;
revoke all on function public.save_build(uuid,integer,jsonb) from public,anon;grant execute on function public.save_build(uuid,integer,jsonb) to authenticated;

create function public.admin_presets() returns jsonb language plpgsql stable security definer set search_path='' as $$begin
 perform iam.require_permission('presets.manage');return coalesce((select jsonb_agg(to_jsonb(p)||jsonb_build_object('items',coalesce((select jsonb_agg(jsonb_build_object('slot',slot,'variantId',variant_id,'finishId',finish_id,'customColor',custom_color) order by slot) from public.bike_preset_items where preset_id=p.id),'[]'::jsonb)) order by p.name) from public.bike_presets p),'[]'::jsonb);
end$$;
revoke all on function public.admin_presets() from public,anon;grant execute on function public.admin_presets() to authenticated;
create function public.save_preset(p_data jsonb,p_items jsonb) returns uuid language plpgsql security definer set search_path='' as $$declare v_id uuid;old_public boolean;item jsonb;begin
 perform iam.require_permission('presets.manage');
 if p_data is null or jsonb_typeof(p_data)<>'object' or p_items is null or jsonb_typeof(p_items)<>'array' or pg_column_size(p_items)>65536 or jsonb_array_length(p_items)>23 or(select count(distinct i->>'slot') from jsonb_array_elements(p_items)i)<>jsonb_array_length(p_items) then raise exception 'invalid_preset' using errcode='22023';end if;
 v_id=coalesce(nullif(p_data->>'id','')::uuid,gen_random_uuid());select published into old_public from public.bike_presets where id=v_id for update;
 if coalesce(old_public,false) or coalesce((p_data->>'published')::boolean,false) then perform iam.require_permission('presets.publish');end if;
 if coalesce((p_data->>'published')::boolean,false) then
  if not exists(select 1 from public.brands where id=(p_data->>'brand_id')::uuid and published) then raise exception 'publication_dependencies_missing' using errcode='23514';end if;
  if not exists(select 1 from jsonb_array_elements(p_items)i where i->>'slot'='frame') then raise exception 'frame_required' using errcode='23514';end if;
  if coalesce(p_data->>'kind','')='factory' and(jsonb_typeof(p_data->'sources') is distinct from 'array' or jsonb_array_length(p_data->'sources')=0) then raise exception 'factory_source_required' using errcode='23514';end if;
 end if;
 for item in select value from jsonb_array_elements(p_items) loop perform iam.validate_item(item,false);end loop;
 insert into public.bike_presets(id,brand_id,name,slug,family_key,label,model_year,image_key,kind,sources,published,selectable) values(v_id,(p_data->>'brand_id')::uuid,p_data->>'name',p_data->>'slug',p_data->>'family_key',p_data->>'label',(p_data->>'model_year')::smallint,p_data->>'image_key',p_data->>'kind',coalesce(p_data->'sources','[]'::jsonb),coalesce((p_data->>'published')::boolean,false),coalesce((p_data->>'selectable')::boolean,true)) on conflict(id) do update set brand_id=excluded.brand_id,name=excluded.name,slug=excluded.slug,family_key=excluded.family_key,label=excluded.label,model_year=excluded.model_year,image_key=excluded.image_key,kind=excluded.kind,sources=excluded.sources,published=excluded.published,selectable=excluded.selectable;
 delete from public.bike_preset_items where preset_id=v_id;
 insert into public.bike_preset_items(preset_id,slot,variant_id,finish_id,custom_color) select v_id,i->>'slot',(i->>'variantId')::uuid,i->>'finishId',upper(i->>'customColor') from jsonb_array_elements(p_items)i;
 return v_id;
end$$;
revoke all on function public.save_preset(jsonb,jsonb) from public,anon;grant execute on function public.save_preset(jsonb,jsonb) to authenticated;
revoke all on all functions in schema iam from public,anon,authenticated;
