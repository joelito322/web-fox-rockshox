-- A generic visual resource does not make a named physical product generic.
create or replace function public._sales_identity(p_variant uuid,p_finish text) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('component_id',v.component_id,'category',c.category,'generation',v.generation,'year',v.model_year,'finish',f->>'label','finish_id',p_finish,'measures',
  (select coalesce(jsonb_object_agg(k,val),'{}'::jsonb) from jsonb_each(v.specs) x(k,val) where k in ('size_label','wheel_front','wheel_rear','wheel_format','wheel_bsd_mm','travel_mm','eye_to_eye_mm','stroke_mm','offset_mm','rotor_diameter_mm','commercial_size','etrto','speed_count','shell_standard','spindle_standard','length_mm','width_mm','clamp_diameter_mm','axle_standard','spring_type','piston_count','rise_mm','steerer_standard','freehub_standard','actuation','associated_shifter','axle_diameter_mm','axle_width_mm','backsweep_deg','bar_clamp_diameter_mm','bb_shell','bb_shell_fit','bead_type','body_material','brake_mount','cage','caliper_model','casing','chain_system','chainline_mm','chainring','compound','connector','construction','crank_length_mm','crown_type','cup_type','damping_system','derailleur_mount','diameter_mm','direct_mount_interface','ecosystem','erd_mm','fluid','fork_layout','headset_standard','hose','inner_width_mm','insertion_mm','lever_model','link_count','material','max_sprocket_teeth','min_sprocket_teeth','mount_standard','mount_type','nominal_speed_count','outer_width_mm','pedal_type','platform_length_mm','platform_thickness_mm','platform_width_mm','position','profile_height_mm','rail_interface','rear_axle_standard','rear_travel_mm','reservoir','rise_mm','rotor_mount','rotor_thickness_mm','seat_clamp_diameter_mm','seatpost_diameter_mm','shell_width_mm','shock_fit','spindle_material','spoke_hole_count','sprocket_teeth','stanchion_diameter_mm','steerer_diameter_mm','suspension_type','thread_standard','tire_width_mm','tpi','tubeless','upsweep_deg')))
 from public.component_variants v join public.components c on c.id=v.component_id cross join lateral jsonb_array_elements(v.allowed_finishes->'options') f
 where v.id=p_variant and f->>'id'=p_finish and exists(select 1 from public.brands b where b.id=c.brand_id and b.slug<>'atlas')
$$;
create or replace function public.sales_admin_choices(p_search text default '') returns jsonb language plpgsql security definer set search_path='' as $$
begin
 perform public._sales_account();perform iam.require_permission('sales.offers.manage');
 return (select coalesce(jsonb_agg(to_jsonb(t)),'[]') from (select v.id variant_id,c.id component_id,b.name||' '||c.name||' · '||v.label label,v.allowed_finishes,v.generation,v.model_year from public.component_variants v join public.components c on c.id=v.component_id join public.brands b on b.id=c.brand_id where v.published and v.selectable and b.slug<>'atlas' and (c.name||' '||b.name||' '||v.label) ilike '%'||left(p_search,100)||'%' order by c.name,v.label limit 100)t);
end$$;
create function public._sales_selection_snapshot(p_selection jsonb) returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('slot',x->>'slot','variantId',v.id,'finishId',x->>'finishId','customColor',null,'technical',jsonb_build_object('category',c.category,'name',b.name||' '||c.name||' · '||v.label,'slug',c.slug,'year',v.model_year,'generation',v.generation,'specs',v.specs,'specs_schema_version',v.specs_schema_version)) order by x->>'slot'),'[]')
 from jsonb_array_elements(p_selection) x join public.component_variants v on v.id=(x->>'variantId')::uuid join public.components c on c.id=v.component_id join public.brands b on b.id=c.brand_id
$$;
revoke all on function public._sales_selection_snapshot(jsonb) from public,anon,authenticated;

create or replace function public.sales_request_quote(p_id uuid,p_lines jsonb,p_contact jsonb,p_delivery text,p_address jsonb,p_assembly boolean,p_selection jsonb default '[]',p_build_id uuid default null,p_previous uuid default null,p_revision integer default null) returns uuid language plpgsql security definer set search_path='' as $$
declare owner uuid=public._sales_account(); previous public.sales_quotes; old public.sales_quotes; series uuid; version_no integer=1; digest text; converted jsonb; lines jsonb;
begin
 perform public._sales_contact(p_contact,p_delivery,p_address);
 if p_id is null or p_assembly is null then raise exception 'sales_invalid_selection' using errcode='22023';end if;
 if p_build_id is not null then perform iam.require_permission('builds.read_own');if not exists(select 1 from public.builds where id=p_build_id and user_id=owner) then raise exception 'permission_denied' using errcode='42501';end if;end if;
 digest=public._sales_hash(jsonb_build_object('lines',p_lines,'contact',p_contact,'delivery',p_delivery,'address',p_address,'assembly',p_assembly,'selection',p_selection,'build',p_build_id,'previous',p_previous,'revision',p_revision));
 perform pg_advisory_xact_lock(hashtextextended('sales-request:'||owner::text||':'||p_id::text,0));
 select * into old from public.sales_quotes where id=p_id;
 if found then if old.user_id<>owner or old.request_hash<>digest then raise exception 'sales_idempotency_conflict' using errcode='PT409';end if;return old.id;end if;
 series=p_id;
 if p_previous is not null then
  select * into previous from public.sales_quotes where id=p_previous and user_id=owner;
  if not found then raise exception 'sales_quote_unavailable' using errcode='42501';end if;series=previous.series_id;
 end if;
 perform pg_advisory_xact_lock(hashtextextended('sales-quote:'||series::text,0));
 if p_previous is not null then
  select * into previous from public.sales_quotes where id=p_previous for update;
  if p_revision is null or previous.revision is distinct from p_revision or previous.status='superseded' then raise exception 'revision_conflict' using errcode='PT409';end if;
  select max(version)+1 into version_no from public.sales_quotes where series_id=series;
  update public.sales_quotes set status='superseded',revision=revision+1,updated_at=clock_timestamp() where series_id=series and status in ('requested','quoted');
 end if;
 lines=public._sales_price_lines(public._sales_snapshot(p_lines,clock_timestamp()));
 if p_assembly then
  converted=public.sales_convert_selection(p_selection);
  if jsonb_array_length(converted->'unresolved')>0 or (select jsonb_agg(x order by x->>'offer_id') from jsonb_array_elements(converted->'lines') x) is distinct from (select jsonb_agg(x order by x->>'offer_id') from jsonb_array_elements(p_lines) x) then raise exception 'sales_assembly_selection_required' using errcode='22023';end if;
 end if;
 insert into public.sales_quotes(id,user_id,series_id,version,request_hash,source_build_id,selection_snapshot,selection_hash,assembly_requested,technical_review,merchandise_snapshot,delivery_method,delivery_snapshot,contact_snapshot)
 values(p_id,owner,series,version_no,digest,p_build_id,case when p_assembly then public._sales_selection_snapshot(p_selection) else '[]'::jsonb end,public._sales_hash(case when p_assembly then public._sales_selection_snapshot(p_selection) else '[]'::jsonb end),p_assembly,case when p_assembly then 'pending' else 'not_required' end,lines,p_delivery,p_address,p_contact);return p_id;
end$$;
-- Deliberately illustrative PEN prices/quantities, never market quotations.
-- Stable identities: reruns must not overwrite staff price/stock edits.
insert into public.store_offers(id,sku,component_id,label,commercial_identity,unit_of_sale,base_price_cents,stock_total,active)
select distinct on (identity) md5('atlas-demo-offer-v1:'||identity::text)::uuid,'DEMO-'||upper(left(md5(identity::text),20)),component_id,label,identity,unit,
 case category when 'frame' then 900000 when 'fork' then 550000 when 'shock' then 240000 when 'brake' then 90000 when 'rim' then 40000 when 'hub' then 65000 when 'tire' then 22000 when 'rotor' then 18000 when 'cassette' then 55000 when 'rear_derailleur' then 80000 when 'crankset' then 60000 when 'bottom_bracket' then 15000 when 'pedals' then 20000 when 'handlebar' then 30000 when 'stem' then 25000 when 'seatpost' then 50000 when 'saddle' then 18000 else 10000 end,
 12,true
from (select v.component_id,b.name||' '||c.name||' · '||v.label||' · '||(f->>'label') label,c.category,public._sales_identity(v.id,f->>'id') identity,
 case when c.category='pedals' then 'pair' when c.category in ('crankset','rear_derailleur') then 'set' else 'unit' end unit
 from public.component_variants v join public.components c on c.id=v.component_id join public.brands b on b.id=c.brand_id cross join lateral jsonb_array_elements(v.allowed_finishes->'options') f
 where v.published and v.selectable and c.published and b.published and b.slug<>'atlas') s
where identity is not null order by identity,label on conflict do nothing;
insert into public.store_offer_variants(variant_id,finish_id,offer_id)
 select v.id,f->>'id',md5('atlas-demo-offer-v1:'||public._sales_identity(v.id,f->>'id')::text)::uuid
 from public.component_variants v cross join lateral jsonb_array_elements(v.allowed_finishes->'options') f
 join public.store_offers o on o.id=md5('atlas-demo-offer-v1:'||public._sales_identity(v.id,f->>'id')::text)::uuid
 where v.published and v.selectable and public._sales_identity(v.id,f->>'id') is not null on conflict do nothing;

create or replace function public.sales_save_offer(p_data jsonb,p_revision integer) returns uuid language plpgsql security definer set search_path='' as $$
#variable_conflict use_variable
declare owner uuid=public._sales_account(); o public.store_offers; id uuid=(p_data->>'id')::uuid; choice jsonb; identity jsonb; available bigint; stock integer=(p_data->>'stock_total')::integer;
begin
 perform iam.lock_authorization();perform iam.require_permission('sales.offers.manage');
 if id is null or p_revision is null then raise exception 'revision_conflict' using errcode='PT409';end if;
 perform pg_advisory_xact_lock(hashtextextended('sales-offer:'||id::text,0));
 select * into o from public.store_offers where store_offers.id=id for update;
 if (o.id is null and p_revision<>0) or (o.id is not null and o.revision is distinct from p_revision) then raise exception 'revision_conflict' using errcode='PT409';end if;
 if jsonb_typeof(p_data->'choices') is distinct from 'array' or jsonb_array_length(p_data->'choices') not between 1 and 30 then raise exception 'sales_invalid_selection' using errcode='22023';end if;
 choice=p_data->'choices'->0;identity=public._sales_identity((choice->>'variant_id')::uuid,choice->>'finish_id');
 if identity is null then raise exception 'sales_identity_mismatch' using errcode='22023';end if;
 if o.id is not null then
  if identity is distinct from o.commercial_identity or p_data->>'sku' is distinct from o.sku or p_data->>'unit_of_sale' is distinct from o.unit_of_sale then raise exception 'sales_identity_in_use' using errcode='22023';end if;
  if stock<o.stock_total-public._sales_available(o.id,clock_timestamp()) then raise exception 'sales_reserved_stock' using errcode='PT409';end if;
  update public.store_offers set label=p_data->>'label',base_price_cents=(p_data->>'base_price_cents')::bigint,stock_total=stock,active=(p_data->>'active')::boolean,revision=revision+1,updated_at=clock_timestamp(),updated_by=owner where store_offers.id=id;
 else
  if exists(select 1 from public.store_offers where commercial_identity=identity and unit_of_sale=p_data->>'unit_of_sale') then raise exception 'sales_identity_in_use' using errcode='22023';end if;
  insert into public.store_offers(id,sku,component_id,label,commercial_identity,unit_of_sale,base_price_cents,stock_total,active,updated_by)
  values(id,p_data->>'sku',(identity->>'component_id')::uuid,p_data->>'label',identity,p_data->>'unit_of_sale',(p_data->>'base_price_cents')::bigint,stock,(p_data->>'active')::boolean,owner);
 end if;
 if exists(select 1 from public.store_offer_variants l join jsonb_array_elements(p_data->'choices') x on l.variant_id=(x->>'variant_id')::uuid and l.finish_id=x->>'finish_id' where l.offer_id<>id) then raise exception 'sales_variant_already_linked' using errcode='PT409';end if;
 delete from public.store_offer_variants where offer_id=id;
 for choice in select x from jsonb_array_elements(p_data->'choices') x loop
  insert into public.store_offer_variants(variant_id,finish_id,offer_id) values((choice->>'variant_id')::uuid,choice->>'finish_id',id);
 end loop;
 perform public._sales_validate_promotions(id);return id;
end$$;
