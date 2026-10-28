-- Existing private montages keep their visual revision and share the same SKU
-- only when the complete commercial identity still matches exactly.
insert into public.store_offer_variants(variant_id,finish_id,offer_id)
select v.id,f->>'id',o.id
from public.component_variants v
cross join lateral jsonb_array_elements(v.allowed_finishes->'options') f
join public.store_offers o on o.commercial_identity=public._sales_identity(v.id,f->>'id')
where v.published and not v.selectable
on conflict(variant_id,finish_id) do nothing;

create or replace function public.sales_convert_selection(p_selection jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare item jsonb; mapped uuid; lines jsonb; unresolved jsonb='[]'; slots text[]='{}'; position_lines jsonb='[]'; cat text;
begin
 perform public._sales_account();
 if jsonb_typeof(p_selection) is distinct from 'array' or jsonb_array_length(p_selection) not between 1 and 23 or pg_column_size(p_selection)>131072 then raise exception 'sales_invalid_selection' using errcode='22023';end if;
 for item in select x from jsonb_array_elements(p_selection) x loop
  cat=iam.slot_category(item->>'slot');
  if cat is null or item->>'slot'=any(slots) then raise exception 'sales_invalid_selection' using errcode='22023';end if;slots=array_append(slots,item->>'slot');
  select l.offer_id into mapped from public.store_offer_variants l join public.component_variants v on v.id=l.variant_id join public.components c on c.id=v.component_id join public.store_offers o on o.id=l.offer_id where l.variant_id=(item->>'variantId')::uuid and l.finish_id=item->>'finishId' and c.category=cat and o.active and (v.published or (iam.has_permission('builds.read_own') and exists(select 1 from public.build_items bi join public.builds b on b.id=bi.build_id where bi.variant_id=v.id and b.user_id=auth.uid()))) and (item->>'customColor' is null);
  if mapped is null then unresolved=unresolved||jsonb_build_array(item->>'slot');else position_lines=position_lines||jsonb_build_array(jsonb_build_object('slot',item->>'slot','offer_id',mapped,'quantity',1));end if;
 end loop;
 select coalesce(jsonb_agg(jsonb_build_object('offer_id',offer_id,'quantity',quantity) order by offer_id),'[]') into lines from (select (x->>'offer_id')::uuid offer_id,count(*) quantity from jsonb_array_elements(position_lines) x group by x->>'offer_id')t;
 return jsonb_build_object('lines',lines,'positions',position_lines,'unresolved',unresolved);
end$$;
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
 for choice in select x from jsonb_array_elements(p_data->'choices') x loop
  if not exists(select 1 from public.component_variants v where v.id=(choice->>'variant_id')::uuid and v.published and v.selectable)
   and not exists(select 1 from public.store_offer_variants l where l.offer_id=id and l.variant_id=(choice->>'variant_id')::uuid and l.finish_id=choice->>'finish_id') then raise exception 'sales_variant_unavailable' using errcode='22023';end if;
 end loop;
 delete from public.store_offer_variants where offer_id=id;
 for choice in select x from jsonb_array_elements(p_data->'choices') x loop
  insert into public.store_offer_variants(variant_id,finish_id,offer_id) values((choice->>'variant_id')::uuid,choice->>'finish_id',id);
 end loop;
 perform public._sales_validate_promotions(id);return id;
end$$;
