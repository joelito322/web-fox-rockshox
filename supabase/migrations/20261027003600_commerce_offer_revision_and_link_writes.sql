-- System alias changes participate in the offer's optimistic revision.
update public.store_offers o set revision=revision+1,updated_at=clock_timestamp()
where exists(select 1 from public.store_offer_variants l join public.component_variants v on v.id=l.variant_id where l.offer_id=o.id and not v.selectable);
-- Updating price/stock must not rewrite the unchanged historical alias set.
create or replace function public.sales_save_offer(p_data jsonb,p_revision integer) returns uuid language plpgsql security definer set search_path='' as $$
#variable_conflict use_variable
declare owner uuid=public._sales_account(); o public.store_offers; id uuid=(p_data->>'id')::uuid; choice jsonb; identity jsonb; available bigint; stock integer=(p_data->>'stock_total')::integer;
begin
 perform iam.lock_authorization();perform iam.require_permission('sales.offers.manage');
 if id is null or p_revision is null then raise exception 'revision_conflict' using errcode='PT409';end if;
 perform pg_advisory_xact_lock(hashtextextended('sales-offer:'||id::text,0));
 select * into o from public.store_offers where store_offers.id=id for update;
 if (o.id is null and p_revision<>0) or (o.id is not null and o.revision is distinct from p_revision) then raise exception 'revision_conflict' using errcode='PT409';end if;
 if jsonb_typeof(p_data->'choices') is distinct from 'array' or (jsonb_array_length(p_data->'choices') not between 1 and 1000 or pg_column_size(p_data->'choices')>262144) then raise exception 'sales_invalid_selection' using errcode='22023';end if;
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
 if (select coalesce(jsonb_agg(jsonb_build_object('variant_id',(x->>'variant_id')::uuid,'finish_id',x->>'finish_id') order by x->>'variant_id',x->>'finish_id'),'[]') from jsonb_array_elements(p_data->'choices') x)
 is distinct from (select coalesce(jsonb_agg(jsonb_build_object('variant_id',l.variant_id,'finish_id',l.finish_id) order by l.variant_id,l.finish_id),'[]') from public.store_offer_variants l where l.offer_id=id) then
 for choice in select x from jsonb_array_elements(p_data->'choices') x loop
  if not exists(select 1 from public.component_variants v where v.id=(choice->>'variant_id')::uuid and v.published and v.selectable)
   and not exists(select 1 from public.store_offer_variants l where l.offer_id=id and l.variant_id=(choice->>'variant_id')::uuid and l.finish_id=choice->>'finish_id') then raise exception 'sales_variant_unavailable' using errcode='22023';end if;
 end loop;
 delete from public.store_offer_variants where offer_id=id;
 for choice in select x from jsonb_array_elements(p_data->'choices') x loop
  insert into public.store_offer_variants(variant_id,finish_id,offer_id) values((choice->>'variant_id')::uuid,choice->>'finish_id',id);
 end loop;
 end if;
 perform public._sales_validate_promotions(id);return id;
end$$;
