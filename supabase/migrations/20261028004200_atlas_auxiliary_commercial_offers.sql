-- Explicitly authorized ATLAS generic products become sellable.
-- Keep geometry, catalogue specifications, existing offers and accepted order snapshots unchanged.
-- Only the five reviewed ATLAS component slugs are enabled; future visual-only auxiliaries remain excluded.
create or replace function public._sales_identity(p_variant uuid,p_finish text) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('component_id',v.component_id,'category',c.category,'generation',v.generation,'year',v.model_year,'finish',f->>'label','finish_id',p_finish,'measures',
  (select coalesce(jsonb_object_agg(k,val),'{}'::jsonb) from jsonb_each(v.specs) x(k,val) where k in ('size_label','wheel_front','wheel_rear','wheel_format','wheel_bsd_mm','travel_mm','eye_to_eye_mm','stroke_mm','offset_mm','rotor_diameter_mm','commercial_size','etrto','speed_count','shell_standard','spindle_standard','length_mm','width_mm','clamp_diameter_mm','axle_standard','spring_type','piston_count','rise_mm','steerer_standard','freehub_standard','actuation','associated_shifter','axle_diameter_mm','axle_width_mm','backsweep_deg','bar_clamp_diameter_mm','bb_shell','bb_shell_fit','bead_type','body_material','brake_mount','cage','caliper_model','casing','chain_system','chainline_mm','chainring','compound','connector','construction','crank_length_mm','crown_type','cup_type','damping_system','derailleur_mount','diameter_mm','direct_mount_interface','ecosystem','erd_mm','fluid','fork_layout','headset_standard','hose','inner_width_mm','insertion_mm','lever_model','link_count','material','max_sprocket_teeth','min_sprocket_teeth','mount_standard','mount_type','nominal_speed_count','outer_width_mm','pedal_type','platform_length_mm','platform_thickness_mm','platform_width_mm','position','profile_height_mm','rail_interface','rear_axle_standard','rear_travel_mm','reservoir','rise_mm','rotor_mount','rotor_thickness_mm','seat_clamp_diameter_mm','seatpost_diameter_mm','shell_width_mm','shock_fit','spindle_material','spoke_hole_count','sprocket_teeth','stanchion_diameter_mm','steerer_diameter_mm','suspension_type','thread_standard','tire_width_mm','tpi','tubeless','upsweep_deg')))
 from public.component_variants v join public.components c on c.id=v.component_id cross join lateral jsonb_array_elements(v.allowed_finishes->'options') f
 where v.id=p_variant and f->>'id'=p_finish and exists(select 1 from public.brands b where b.id=c.brand_id and (b.slug<>'atlas' or c.slug in ('atlas-handlebar-v1','atlas-potencia-directa','atlas-saddle-v1','atlas-seatpost-v1','atlas-stem-v1')))
$$;
create or replace function public.sales_admin_choices(p_search text default '') returns jsonb language plpgsql security definer set search_path='' as $$
begin
 perform public._sales_account();perform iam.require_permission('sales.offers.manage');
 return (select coalesce(jsonb_agg(to_jsonb(t)),'[]') from (select v.id variant_id,c.id component_id,b.name||' '||c.name||' · '||v.label label,v.allowed_finishes,v.generation,v.model_year from public.component_variants v join public.components c on c.id=v.component_id join public.brands b on b.id=c.brand_id where v.published and v.selectable and (b.slug<>'atlas' or c.slug in ('atlas-handlebar-v1','atlas-potencia-directa','atlas-saddle-v1','atlas-seatpost-v1','atlas-stem-v1')) and (c.name||' '||b.name||' '||v.label) ilike '%'||left(p_search,100)||'%' order by c.name,v.label limit 100)t);
end$$;

with reviewed(id,sku,variant_id,slug,label,cents) as (values
 ('9a4709bd-6973-5337-b8d7-8a90067a38a6'::uuid,'ATLAS-HB-318-780-BK','9e54da8d-11d7-5647-92ed-c318b4cf46ec'::uuid,'atlas-handlebar-v1','Manillar ATLAS · 31,8 × 780 mm',8000::bigint),
 ('bffbf367-d357-5020-9b68-7a9217f4d093'::uuid,'ATLAS-SADDLE-145-BK','2e033d68-1b1f-55e7-9443-fe475351cab7'::uuid,'atlas-saddle-v1','Sillín ATLAS · 145 mm',6500::bigint),
 ('c1322d7f-2a59-5491-a6b8-af60e2bc8b07'::uuid,'ATLAS-POST-316-250-BK','39387cf5-69f7-59b3-8f1e-66977bd1bc66'::uuid,'atlas-seatpost-v1','Tija fija ATLAS · 31,6 × 250 mm',6000::bigint),
 ('82d37d6d-f0eb-52ee-b22d-da541bd19d66'::uuid,'ATLAS-POST-349-350-BK','5dfa1287-9144-5813-aaa4-7e1efb3e26f6'::uuid,'atlas-seatpost-v1','Tija fija ATLAS · 34,9 × 350 mm',7000::bigint),
 ('51bcb2d2-5f84-5dd7-a6f8-9ca4ce950dd0'::uuid,'ATLAS-STEM-318-40-BK','a9ae59d0-bd4a-5fce-a148-edc1cf381958'::uuid,'atlas-stem-v1','Potencia ATLAS · convencional · 40 mm',9000::bigint),
 ('2a6f5b0b-2edf-5786-b816-d8ab72bda71d'::uuid,'ATLAS-DIRECT-318-40-BK','231dc45b-8a01-565c-84f0-905be936afc6'::uuid,'atlas-potencia-directa','Potencia ATLAS · directa · 40 mm',16000::bigint)
)
insert into public.store_offers(id,sku,component_id,label,commercial_identity,unit_of_sale,base_price_cents,currency,stock_total,active,item_condition)
select r.id,r.sku,c.id,r.label,public._sales_identity(v.id,'black'),'unit',r.cents,'PEN',12,true,'new'
from reviewed r join public.component_variants v on v.id=r.variant_id join public.components c on c.id=v.component_id and c.slug=r.slug join public.brands b on b.id=c.brand_id
where b.slug='atlas' and b.published and c.published and v.published and v.selectable
on conflict do nothing;
insert into public.store_offer_variants(variant_id,finish_id,offer_id)
select '9e54da8d-11d7-5647-92ed-c318b4cf46ec'::uuid,'black',o.id from public.store_offers o where o.sku='ATLAS-HB-318-780-BK' and o.id='9a4709bd-6973-5337-b8d7-8a90067a38a6'::uuid and o.commercial_identity=public._sales_identity('9e54da8d-11d7-5647-92ed-c318b4cf46ec'::uuid,'black')
union all
select '2e033d68-1b1f-55e7-9443-fe475351cab7'::uuid,'black',o.id from public.store_offers o where o.sku='ATLAS-SADDLE-145-BK' and o.id='bffbf367-d357-5020-9b68-7a9217f4d093'::uuid and o.commercial_identity=public._sales_identity('2e033d68-1b1f-55e7-9443-fe475351cab7'::uuid,'black')
union all
select '39387cf5-69f7-59b3-8f1e-66977bd1bc66'::uuid,'black',o.id from public.store_offers o where o.sku='ATLAS-POST-316-250-BK' and o.id='c1322d7f-2a59-5491-a6b8-af60e2bc8b07'::uuid and o.commercial_identity=public._sales_identity('39387cf5-69f7-59b3-8f1e-66977bd1bc66'::uuid,'black')
union all
select '5dfa1287-9144-5813-aaa4-7e1efb3e26f6'::uuid,'black',o.id from public.store_offers o where o.sku='ATLAS-POST-349-350-BK' and o.id='82d37d6d-f0eb-52ee-b22d-da541bd19d66'::uuid and o.commercial_identity=public._sales_identity('5dfa1287-9144-5813-aaa4-7e1efb3e26f6'::uuid,'black')
union all
select 'a9ae59d0-bd4a-5fce-a148-edc1cf381958'::uuid,'black',o.id from public.store_offers o where o.sku='ATLAS-STEM-318-40-BK' and o.id='51bcb2d2-5f84-5dd7-a6f8-9ca4ce950dd0'::uuid and o.commercial_identity=public._sales_identity('a9ae59d0-bd4a-5fce-a148-edc1cf381958'::uuid,'black')
union all
select '231dc45b-8a01-565c-84f0-905be936afc6'::uuid,'black',o.id from public.store_offers o where o.sku='ATLAS-DIRECT-318-40-BK' and o.id='2a6f5b0b-2edf-5786-b816-d8ab72bda71d'::uuid and o.commercial_identity=public._sales_identity('231dc45b-8a01-565c-84f0-905be936afc6'::uuid,'black')
on conflict do nothing;
do $$begin
 if (select count(*) from public.store_offer_variants l join public.store_offers o on o.id=l.offer_id where o.sku in ('ATLAS-HB-318-780-BK','ATLAS-SADDLE-145-BK','ATLAS-POST-316-250-BK','ATLAS-POST-349-350-BK','ATLAS-STEM-318-40-BK','ATLAS-DIRECT-318-40-BK'))<>6 then raise exception 'ATLAS offer links did not match the reviewed inventory';end if;
end$$;
