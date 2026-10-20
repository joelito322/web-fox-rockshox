create table public.brands(id uuid primary key default gen_random_uuid(),name text not null check(length(btrim(name)) between 1 and 100),slug text not null unique check(slug~'^[a-z0-9]+(-[a-z0-9]+)*$'),region text,published boolean not null default false);
create table public.components(id uuid primary key default gen_random_uuid(),brand_id uuid not null references public.brands on delete restrict,name text not null check(length(btrim(name)) between 1 and 150),slug text not null unique check(slug~'^[a-z0-9]+(-[a-z0-9]+)*$'),category text not null check(category in('frame','fork','shock','rim','tire','hub','brake','rotor','cassette','chain','rear_derailleur','bottom_bracket','crankset','pedals','handlebar','stem','seatpost','saddle')),disciplines text[] not null default '{}',description text not null default '',technical_notes text,image_key text,sources jsonb not null default '[]',published boolean not null default false,check(jsonb_typeof(sources)='array' and pg_column_size(sources)<32768));
create table public.visual_assets(id uuid primary key default gen_random_uuid(),kind text not null check(kind in('glb','procedural')),storage_path text,generator_key text,manifest jsonb not null,reference_notes text,published boolean not null default false,check((kind='glb' and storage_path is not null and generator_key is null) or(kind='procedural' and generator_key is not null and storage_path is null)),check(jsonb_typeof(manifest)='object' and pg_column_size(manifest)<32768));
create table public.component_variants(id uuid primary key default gen_random_uuid(),component_id uuid not null references public.components on delete restrict,label text not null check(length(btrim(label)) between 1 and 150),model_year smallint check(model_year between 1990 and 2200),generation text,manufacturer_code text,image_key text,sources jsonb not null default '[]',specs_schema_version integer not null default 1 check(specs_schema_version=1),specs jsonb not null default '{}',price_reference jsonb,allowed_finishes jsonb not null,visual_asset_id uuid references public.visual_assets on delete restrict,representation text not null check(representation in('reference','approximate','generic')),published boolean not null default false,selectable boolean not null default true,check(not(published and selectable) or visual_asset_id is not null),check(jsonb_typeof(specs)='object' and pg_column_size(specs)<32768),check(jsonb_typeof(sources)='array' and pg_column_size(sources)<32768));
create table public.bike_presets(id uuid primary key default gen_random_uuid(),brand_id uuid not null references public.brands on delete restrict,name text not null,slug text not null unique,family_key text not null,label text not null,model_year smallint,image_key text,kind text not null check(kind in('factory','example')),sources jsonb not null default '[]',published boolean not null default false,selectable boolean not null default true);
create table public.bike_preset_items(id uuid primary key default gen_random_uuid(),preset_id uuid not null references public.bike_presets on delete cascade,slot text not null,variant_id uuid not null references public.component_variants on delete restrict,finish_id text not null,custom_color text check(custom_color is null or custom_color~'^#[0-9A-Fa-f]{6}$'),unique(preset_id,slot));
create index components_brand_idx on public.components(brand_id);
create index components_category_name_idx on public.components(category,name,id);
create index component_variants_component_idx on public.component_variants(component_id);
create index component_variants_asset_idx on public.component_variants(visual_asset_id);
create index bike_presets_brand_idx on public.bike_presets(brand_id);
create index bike_preset_items_variant_idx on public.bike_preset_items(variant_id);

alter table public.brands enable row level security;
alter table public.components enable row level security;
alter table public.visual_assets enable row level security;
alter table public.component_variants enable row level security;
alter table public.bike_presets enable row level security;
alter table public.bike_preset_items enable row level security;
revoke all on public.brands,public.components,public.visual_assets,public.component_variants,public.bike_presets,public.bike_preset_items from public,anon,authenticated;
grant select on public.brands,public.components,public.visual_assets,public.component_variants,public.bike_presets,public.bike_preset_items to anon,authenticated;
create policy published_brands on public.brands for select to anon,authenticated using(published);
create policy published_components on public.components for select to anon,authenticated using(published and exists(select 1 from public.brands b where b.id=brand_id and b.published));
create policy published_variants on public.component_variants for select to anon,authenticated using(published and exists(select 1 from public.components c where c.id=component_id and c.published));
create policy published_assets on public.visual_assets for select to anon,authenticated using(published and exists(select 1 from public.component_variants v where v.visual_asset_id=visual_assets.id and v.published));
create policy published_presets on public.bike_presets for select to anon,authenticated using(published and exists(select 1 from public.brands b where b.id=brand_id and b.published));
create policy published_preset_items on public.bike_preset_items for select to anon,authenticated using(exists(select 1 from public.bike_presets p where p.id=preset_id and p.published) and exists(select 1 from public.component_variants v where v.id=variant_id and v.published));

create function iam.slot_category(p_slot text) returns text language sql immutable set search_path='' as $$
 select case when p_slot in('front_rim','rear_rim') then 'rim' when p_slot in('front_tire','rear_tire') then 'tire' when p_slot in('front_hub','rear_hub') then 'hub' when p_slot in('front_brake','rear_brake') then 'brake' when p_slot in('front_rotor','rear_rotor') then 'rotor' when p_slot in('frame','fork','shock','cassette','chain','rear_derailleur','bottom_bracket','crankset','pedals','handlebar','stem','seatpost','saddle') then p_slot else null end;
$$;
create function iam.validate_specs(p_category text,p_specs jsonb) returns void language plpgsql immutable set search_path='' as $$declare entry record;allowed text[];numeric_keys text[];maintenance jsonb;task jsonb;begin
 if p_specs is null or jsonb_typeof(p_specs)<>'object' or pg_column_size(p_specs)>32768 then raise exception 'invalid_specs' using errcode='22023';end if;
 allowed=case p_category
 when 'frame' then array['size_label','material','suspension_type','wheel_front','wheel_rear','geometry','rear_travel_mm','shock_fit','headset_standard','rear_axle_standard','derailleur_mount','bb_shell','seatpost_diameter_mm','seat_clamp_diameter_mm','brake_mount','fork_restrictions','tire_clearance_notes']
 when 'fork' then array['wheel_format','wheel_bsd_mm','travel_mm','axle_to_crown_mm','offset_mm','stanchion_diameter_mm','crown_type','fork_layout','steerer_standard','axle_standard','brake_mount','rotor_min_mm','rotor_max_mm','spring_type','damping_system','adjustments']
 when 'shock' then array['eye_to_eye_mm','stroke_mm','spring_type','mount_standard','damping_system','adjustments','coil','reservoir']
 when 'brake' then array['caliper_model','lever_model','piston_count','actuation','fluid','lever_side','brake_mount','rotor_min_mm','rotor_max_mm','rotor_thickness_mm','hose','adjustments','pad_references']
 when 'rotor' then array['rotor_diameter_mm','rotor_thickness_mm','minimum_thickness_mm','rotor_mount','construction','material','restrictions']
 when 'rear_derailleur' then array['speed_count','ecosystem','actuation','mount_standard','cage','total_capacity_teeth','min_sprocket_teeth','max_sprocket_teeth','chain_system','associated_shifter']
 when 'cassette' then array['speed_count','sprocket_teeth','freehub_standard','ecosystem','construction','material','spacer_notes']
 when 'chain' then array['supported_systems','nominal_speed_count','link_count','connector','direction_notes']
 when 'bottom_bracket' then array['shell_standard','shell_width_mm','shell_diameter_mm','shell_thread','spindle_standard','spindle_diameter_mm','cup_type','bearing_notes','spacer_notes','restrictions','material']
 when 'crankset' then array['crank_length_mm','spindle_standard','spindle_diameter_mm','bb_shell_fit','chainline_mm','chainring','pedal_thread','material']
 when 'pedals' then array['pedal_type','platform_width_mm','platform_length_mm','platform_thickness_mm','thread_standard','body_material','spindle_material','cleat_system','pin_notes','bearing_notes','weight_basis']
 when 'rim' then array['wheel_bsd_mm','commercial_size','inner_width_mm','outer_width_mm','profile_height_mm','erd_mm','spoke_hole_count','profile_offset_mm','material','bead_type','tubeless','tire_restrictions']
 when 'hub' then array['position','axle_standard','axle_diameter_mm','axle_width_mm','spoke_hole_count','rotor_mount','freehub_standard','flange_dimensions','bearing_notes']
 when 'tire' then array['etrto','commercial_size','wheel_bsd_mm','tire_width_mm','outer_diameter_mm','casing','compound','bead_type','tpi','tubeless','recommended_position','rotation_notes','terrain_tags','condition_tags','pressure_limits','rim_width_limits_mm']
 when 'handlebar' then array['width_mm','clamp_diameter_mm','rise_mm','upsweep_deg','backsweep_deg']
 when 'stem' then array['mount_type','steerer_diameter_mm','bar_clamp_diameter_mm','length_mm','angle_deg','direct_mount_interface']
 when 'saddle' then array['length_mm','width_mm','rail_interface']
 when 'seatpost' then array['diameter_mm','length_mm','insertion_mm','travel_mm','actuation'] else null end;
 if allowed is null then raise exception 'unknown_category' using errcode='22023';end if;
 allowed=allowed||array['weight_g','maintenance'];
 for entry in select key,value from jsonb_each(p_specs) loop
  if not(entry.key=any(allowed)) then raise exception 'unknown_specification' using errcode='22023';end if;
  if entry.value='null'::jsonb then continue;end if;
  if entry.key~'(_mm|_g|_count|_teeth|_deg)$' and entry.key not in('sprocket_teeth') then
   if jsonb_typeof(entry.value)<>'number' or abs((entry.value::text)::numeric)>100000 then raise exception 'invalid_dimension' using errcode='22023';end if;
   if entry.key not in('offset_mm','profile_offset_mm','rise_mm','angle_deg','upsweep_deg','backsweep_deg') and(entry.value::text)::numeric<=0 then raise exception 'invalid_positive_dimension' using errcode='22023';end if;
  end if;
  if entry.key in('adjustments','pad_references','sprocket_teeth','supported_systems','bb_shell_fit','terrain_tags','condition_tags') and jsonb_typeof(entry.value)<>'array' then raise exception 'invalid_list' using errcode='22023';end if;
 end loop;
 if p_specs->>'spring_type' is not null and p_specs->>'spring_type' not in('air','coil') then raise exception 'invalid_spring_type' using errcode='22023';end if;
 if p_specs->>'crown_type' is not null and p_specs->>'crown_type' not in('single','dual') then raise exception 'invalid_crown_type' using errcode='22023';end if;
 if p_specs->>'fork_layout' is not null and p_specs->>'fork_layout' not in('conventional','inverted') then raise exception 'invalid_fork_layout' using errcode='22023';end if;
 maintenance=p_specs->'maintenance';
 if maintenance is not null and maintenance<>'null'::jsonb then
  if jsonb_typeof(maintenance)<>'object' or jsonb_typeof(maintenance->'documents')<>'array' or jsonb_typeof(maintenance->'tasks')<>'array' then raise exception 'invalid_maintenance' using errcode='22023';end if;
  for task in select value from jsonb_array_elements(maintenance->'tasks') loop
   if nullif(task->>'name','') is null or coalesce(task->>'source_url','')!~'^https?://' then raise exception 'invalid_maintenance_source' using errcode='22023';end if;
   if task->>'interval_hours' is not null and(task->>'interval_hours')::numeric<=0 then raise exception 'invalid_interval' using errcode='22023';end if;
   if task->>'interval_months' is not null and(task->>'interval_months')::numeric<=0 then raise exception 'invalid_interval' using errcode='22023';end if;
  end loop;
 end if;
end$$;
create function iam.validate_variant(p_variant public.component_variants) returns void language plpgsql security definer set search_path='' as $$declare category text;option jsonb;finish_ids text[];begin
 select c.category into strict category from public.components c where c.id=p_variant.component_id;
 perform iam.validate_specs(category,p_variant.specs);
 if p_variant.price_reference is not null then
  if jsonb_typeof(p_variant.price_reference)<>'object' or coalesce((p_variant.price_reference->>'amount')::numeric,0)<=0 or coalesce(p_variant.price_reference->>'currency','')!~'^[A-Z]{3}$' or nullif(p_variant.price_reference->>'market','') is null or coalesce(p_variant.price_reference->>'source_url','')!~'^https?://' or nullif(p_variant.price_reference->>'as_of','') is null then raise exception 'invalid_price_reference' using errcode='22023';end if;
  perform (p_variant.price_reference->>'as_of')::date;
 end if;
 if jsonb_typeof(p_variant.allowed_finishes)<>'object' or jsonb_typeof(p_variant.allowed_finishes->'options')<>'array' or jsonb_array_length(p_variant.allowed_finishes->'options') not between 1 and 30 or jsonb_typeof(p_variant.allowed_finishes->'custom_color_enabled')<>'boolean' then raise exception 'invalid_finishes' using errcode='22023';end if;
 finish_ids='{}';
 for option in select value from jsonb_array_elements(p_variant.allowed_finishes->'options') loop
  if nullif(option->>'id','') is null or option->>'id'=any(finish_ids) or nullif(option->>'label','') is null or coalesce(option->'material'->>'color','')!~'^#[0-9A-Fa-f]{6}$' then raise exception 'invalid_finish' using errcode='22023';end if;
  finish_ids=array_append(finish_ids,option->>'id');
 end loop;
 if not coalesce(p_variant.allowed_finishes->>'default_finish_id'=any(finish_ids),false) then raise exception 'invalid_default_finish' using errcode='22023';end if;
 if p_variant.published and p_variant.selectable then
  if not exists(select 1 from public.components c join public.brands b on b.id=c.brand_id where c.id=p_variant.component_id and c.published and b.published) or not exists(select 1 from public.visual_assets a where a.id=p_variant.visual_asset_id and a.published) then raise exception 'publication_dependencies_missing' using errcode='23514';end if;
 end if;
end$$;
create function iam.enforce_variant() returns trigger language plpgsql security definer set search_path='' as $$begin
 perform iam.validate_variant(new);
 if tg_op='UPDATE' and old.published and (old.component_id,old.specs,old.specs_schema_version,old.visual_asset_id,old.allowed_finishes,old.representation) is distinct from(new.component_id,new.specs,new.specs_schema_version,new.visual_asset_id,new.allowed_finishes,new.representation) then raise exception 'published_variant_immutable' using errcode='23514';end if;
 if tg_op='UPDATE' and old.published and not new.published then raise exception 'archive_using_selectable' using errcode='23514';end if;
 return new;
end$$;
create trigger atlas_variant_contract before insert or update on public.component_variants for each row execute function iam.enforce_variant();
create function iam.enforce_component() returns trigger language plpgsql security definer set search_path='' as $$begin
 if old.published and(old.category,old.brand_id) is distinct from(new.category,new.brand_id) then raise exception 'published_identity_immutable' using errcode='23514';end if;
 if old.published and not new.published and exists(select 1 from public.component_variants where component_id=old.id and published) then raise exception 'published_parent_required' using errcode='23514';end if;
 return new;
end$$;
create trigger atlas_component_identity before update on public.components for each row execute function iam.enforce_component();
create function iam.enforce_asset() returns trigger language plpgsql security definer set search_path='' as $$begin
 if old.published and row(old.*) is distinct from row(new.*) then raise exception 'published_visual_immutable' using errcode='23514';end if;
 return new;
end$$;
create trigger atlas_asset_version before update on public.visual_assets for each row execute function iam.enforce_asset();

create function public.admin_catalog(p_category text default null,p_search text default '',p_page integer default 0) returns jsonb language plpgsql stable security definer set search_path='' as $$begin
 perform iam.require_permission('catalog.manage');if p_page<0 or length(p_search)>150 then raise exception 'invalid_filter' using errcode='22023';end if;
 return jsonb_build_object('brands',(select coalesce(jsonb_agg(to_jsonb(b) order by b.name),'[]'::jsonb) from public.brands b),'assets',(select coalesce(jsonb_agg(jsonb_build_object('id',a.id,'kind',a.kind,'reference_notes',a.reference_notes,'published',a.published)),'[]'::jsonb) from public.visual_assets a),'components',coalesce((select jsonb_agg(to_jsonb(t)) from(select c.*,jsonb_build_object('name',b.name) brands,coalesce((select jsonb_agg(to_jsonb(v) order by v.label) from public.component_variants v where v.component_id=c.id),'[]'::jsonb) component_variants from public.components c join public.brands b on b.id=c.brand_id where(p_category is null or c.category=p_category) and strpos(lower(c.name),lower(p_search))>0 order by c.name,c.id limit 25 offset p_page*25)t),'[]'::jsonb));
end$$;
revoke all on function public.admin_catalog(text,text,integer) from public,anon;grant execute on function public.admin_catalog(text,text,integer) to authenticated;
create function public.save_catalog(p_kind text,p_data jsonb) returns uuid language plpgsql security definer set search_path='' as $$declare v_id uuid;old_published boolean;v public.component_variants;begin
 perform iam.require_permission('catalog.manage');if p_data is null or jsonb_typeof(p_data)<>'object' then raise exception 'invalid_data' using errcode='22023';end if;
 v_id=coalesce(nullif(p_data->>'id','')::uuid,gen_random_uuid());
 if p_kind='brand' then
  select published into old_published from public.brands where id=v_id for update;
  if coalesce(old_published,false) or coalesce((p_data->>'published')::boolean,false) then perform iam.require_permission('catalog.publish');end if;
  if old_published and not coalesce((p_data->>'published')::boolean,false) and exists(select 1 from public.components where brand_id=v_id and published) then raise exception 'published_parent_required' using errcode='23514';end if;
  insert into public.brands(id,name,slug,region,published) values(v_id,btrim(p_data->>'name'),p_data->>'slug',p_data->>'region',coalesce((p_data->>'published')::boolean,false)) on conflict(id) do update set name=excluded.name,slug=excluded.slug,region=excluded.region,published=excluded.published;
 elsif p_kind='component' then
  select published into old_published from public.components where id=v_id for update;
  if coalesce(old_published,false) or coalesce((p_data->>'published')::boolean,false) then perform iam.require_permission('catalog.publish');end if;
  if coalesce((p_data->>'published')::boolean,false) and not exists(select 1 from public.brands where id=(p_data->>'brand_id')::uuid and published) then raise exception 'publication_dependencies_missing' using errcode='23514';end if;
  insert into public.components(id,brand_id,name,slug,category,disciplines,description,technical_notes,image_key,sources,published) values(v_id,(p_data->>'brand_id')::uuid,btrim(p_data->>'name'),p_data->>'slug',p_data->>'category',array(select jsonb_array_elements_text(coalesce(p_data->'disciplines','[]'::jsonb))),coalesce(p_data->>'description',''),p_data->>'technical_notes',p_data->>'image_key',coalesce(p_data->'sources','[]'::jsonb),coalesce((p_data->>'published')::boolean,false)) on conflict(id) do update set brand_id=excluded.brand_id,name=excluded.name,slug=excluded.slug,category=excluded.category,disciplines=excluded.disciplines,description=excluded.description,technical_notes=excluded.technical_notes,image_key=excluded.image_key,sources=excluded.sources,published=excluded.published;
 elsif p_kind='variant' then
  select published into old_published from public.component_variants where id=v_id for update;
  if coalesce(old_published,false) or coalesce((p_data->>'published')::boolean,false) then perform iam.require_permission('catalog.publish');end if;
  select * into v from jsonb_populate_record(null::public.component_variants,p_data||jsonb_build_object('id',v_id,'published',coalesce((p_data->>'published')::boolean,false),'selectable',coalesce((p_data->>'selectable')::boolean,true),'specs_schema_version',1,'sources',coalesce(p_data->'sources','[]'::jsonb)));
  insert into public.component_variants select(v).* on conflict(id) do update set label=excluded.label,component_id=excluded.component_id,model_year=excluded.model_year,generation=excluded.generation,manufacturer_code=excluded.manufacturer_code,image_key=excluded.image_key,sources=excluded.sources,specs=excluded.specs,price_reference=excluded.price_reference,allowed_finishes=excluded.allowed_finishes,visual_asset_id=excluded.visual_asset_id,representation=excluded.representation,published=excluded.published,selectable=excluded.selectable;
 else raise exception 'invalid_catalog_operation' using errcode='22023';end if;
 return v_id;
end$$;
revoke all on function public.save_catalog(text,jsonb) from public,anon;grant execute on function public.save_catalog(text,jsonb) to authenticated;
revoke all on all functions in schema iam from public,anon,authenticated;
