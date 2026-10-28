-- Commercial condition belongs to the offer, independently of GLB revisions.
-- Existing orders/quotes remain immutable: unknown historical condition stays NULL.
alter table public.store_offers add column item_condition text not null default 'new' check(item_condition in ('new','used'));
alter table public.order_items add column item_condition_snapshot text check(item_condition_snapshot in ('new','used'));
update public.store_offers o set item_condition='used',revision=revision+1,updated_at=clock_timestamp()
from public.components c where c.id=o.component_id and c.category in ('frame','fork','shock');

create or replace function public._sales_snapshot(p_lines jsonb,p_at timestamptz) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb='[]'; item jsonb; o public.store_offers; promo public.promotions; discount bigint; qty integer; available bigint;
begin
 if p_lines is null or jsonb_typeof(p_lines)<>'array' or jsonb_array_length(p_lines) not between 1 and 100 or pg_column_size(p_lines)>65536 then raise exception 'sales_empty_selection' using errcode='22023';end if;
 if exists(select 1 from jsonb_array_elements(p_lines) x group by x->>'offer_id' having count(*)>1) then raise exception 'sales_duplicate_offer' using errcode='22023';end if;
 for item in select x from jsonb_array_elements(p_lines) x order by x->>'offer_id' loop
  if (item->>'quantity') !~ '^[1-9][0-9]?$' then raise exception 'sales_invalid_quantity' using errcode='22023';end if;qty=(item->>'quantity')::integer;
  select * into o from public.store_offers where id=(item->>'offer_id')::uuid and active;
  if not found or not exists(select 1 from public.components c join public.brands b on b.id=c.brand_id where c.id=o.component_id and c.published and b.published) then raise exception 'sales_offer_unavailable' using errcode='22023';end if;
  select p.* into promo from public.promotions p join public.promotion_offers l on l.promotion_id=p.id where l.offer_id=o.id and p.active and p.starts_at<=p_at and p.ends_at>p_at order by public._sales_discount(o.base_price_cents,p) desc,p.id limit 1;
  discount=case when promo.id is null then 0 else public._sales_discount(o.base_price_cents,promo) end;
  if discount>=o.base_price_cents then raise exception 'sales_invalid_discount' using errcode='22023';end if;
  available=public._sales_available(o.id,p_at);
  result=result||jsonb_build_array(jsonb_build_object('offer_id',o.id,'component_id',o.component_id,'sku',o.sku,'item_condition',o.item_condition,'label',o.label,'image_key',(select c.image_key from public.components c where c.id=o.component_id),'identity',o.commercial_identity,'unit',o.unit_of_sale,'quantity',qty,'currency',o.currency,'base_cents',o.base_price_cents,'discount_cents',discount,'unit_cents',o.base_price_cents-discount,'subtotal_cents',(o.base_price_cents-discount)*qty,'promotion_id',promo.id,'promotion',case when promo.id is null then null else jsonb_build_object('id',promo.id,'name',promo.name,'type',promo.discount_type,'percentage_bps',promo.percentage_bps,'fixed_discount_cents',promo.fixed_discount_cents,'currency',promo.currency) end,'available',available));
 end loop;
 return result;
end$$;

create or replace function public.sales_cart() returns jsonb language plpgsql security definer set search_path='' as $$
declare owner uuid=public._sales_account(); cart public.carts; lines jsonb;
begin
 insert into public.carts(user_id) values(owner) on conflict(user_id) do nothing;
 select * into cart from public.carts where user_id=owner;
 -- Retain unavailable lines instead of hiding or deleting a stale cart.
 select coalesce(jsonb_agg(jsonb_build_object('offer_id',o.id,'component_id',o.component_id,'label',o.label,'item_condition',o.item_condition,'identity',o.commercial_identity,'quantity',i.quantity,'active',o.active,'unit',o.unit_of_sale,'currency',o.currency,'base_cents',o.base_price_cents,'available',public._sales_available(o.id,clock_timestamp())) order by o.label),'[]') into lines from public.cart_items i join public.store_offers o on o.id=i.offer_id where cart_id=cart.id;
 return jsonb_build_object('id',cart.id,'revision',cart.revision,'items',lines);
end$$;

create or replace function public.sales_save_offer(p_data jsonb,p_revision integer) returns uuid language plpgsql security definer set search_path='' as $$
#variable_conflict use_variable
declare owner uuid=public._sales_account(); o public.store_offers; id uuid=(p_data->>'id')::uuid; choice jsonb; identity jsonb; available bigint; sale_condition text; stock integer=(p_data->>'stock_total')::integer;
begin
 perform iam.lock_authorization();perform iam.require_permission('sales.offers.manage');
 if id is null or p_revision is null then raise exception 'revision_conflict' using errcode='PT409';end if;
 perform pg_advisory_xact_lock(hashtextextended('sales-offer:'||id::text,0));
 select * into o from public.store_offers where store_offers.id=id for update;
 if (o.id is null and p_revision<>0) or (o.id is not null and o.revision is distinct from p_revision) then raise exception 'revision_conflict' using errcode='PT409';end if;
 if jsonb_typeof(p_data->'choices') is distinct from 'array' or (jsonb_array_length(p_data->'choices') not between 1 and 1000 or pg_column_size(p_data->'choices')>262144) then raise exception 'sales_invalid_selection' using errcode='22023';end if;
 choice=p_data->'choices'->0;identity=public._sales_identity((choice->>'variant_id')::uuid,choice->>'finish_id');
 if identity is null then raise exception 'sales_identity_mismatch' using errcode='22023';end if;
 sale_condition=coalesce(p_data->>'item_condition',o.item_condition,(select case when c.category in ('frame','fork','shock') then 'used' else 'new' end from public.components c where c.id=(identity->>'component_id')::uuid));
 if sale_condition not in ('new','used') then raise exception 'sales_invalid_condition' using errcode='22023';end if;
 if o.id is not null then
  if identity is distinct from o.commercial_identity or p_data->>'sku' is distinct from o.sku or p_data->>'unit_of_sale' is distinct from o.unit_of_sale then raise exception 'sales_identity_in_use' using errcode='22023';end if;
  if stock<o.stock_total-public._sales_available(o.id,clock_timestamp()) then raise exception 'sales_reserved_stock' using errcode='PT409';end if;
  update public.store_offers set item_condition=sale_condition,label=p_data->>'label',base_price_cents=(p_data->>'base_price_cents')::bigint,stock_total=stock,active=(p_data->>'active')::boolean,revision=revision+1,updated_at=clock_timestamp(),updated_by=owner where store_offers.id=id;
 else
  if exists(select 1 from public.store_offers where commercial_identity=identity and unit_of_sale=p_data->>'unit_of_sale') then raise exception 'sales_identity_in_use' using errcode='22023';end if;
  insert into public.store_offers(id,sku,component_id,label,commercial_identity,unit_of_sale,base_price_cents,stock_total,active,updated_by,item_condition)
  values(id,p_data->>'sku',(identity->>'component_id')::uuid,p_data->>'label',identity,p_data->>'unit_of_sale',(p_data->>'base_price_cents')::bigint,stock,(p_data->>'active')::boolean,owner,sale_condition);
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

create or replace function public.sales_create_order(p_key uuid,p_hash text,p_lines jsonb,p_contact jsonb,p_delivery text,p_address jsonb,p_cart_revision integer default null,p_quote_id uuid default null) returns uuid language plpgsql security definer set search_path='' as $$
declare owner uuid=public._sales_account(); request_digest text; previous public.orders; cart public.carts; q public.sales_quotes; summary jsonb; item jsonb; result uuid; offer_id uuid; at_time timestamptz;
begin
 if p_key is null then raise exception 'sales_idempotency_required' using errcode='22023';end if;
 request_digest=public._sales_hash(jsonb_build_object('hash',p_hash,'lines',p_lines,'contact',p_contact,'delivery',p_delivery,'address',p_address,'cart_revision',p_cart_revision,'quote_id',p_quote_id));
 perform pg_advisory_xact_lock(hashtextextended('sales-order:'||owner::text||':'||p_key::text,0));
 select * into previous from public.orders where user_id=owner and idempotency_key=p_key;
 if found then if previous.request_hash is distinct from request_digest then raise exception 'sales_idempotency_conflict' using errcode='PT409';end if;return previous.id;end if;
 if p_quote_id is not null then
  select * into q from public.sales_quotes where id=p_quote_id and user_id=owner;
  if not found then raise exception 'sales_quote_unavailable' using errcode='42501';end if;
  perform pg_advisory_xact_lock(hashtextextended('sales-quote:'||q.series_id::text,0));
  select * into strict q from public.sales_quotes where id=p_quote_id for update;
 end if;
 if p_cart_revision is not null or p_quote_id is null then
  select * into cart from public.carts where user_id=owner for update;
  if not found or p_cart_revision is null or cart.revision is distinct from p_cart_revision then raise exception 'revision_conflict' using errcode='PT409';end if;
  if (select coalesce(jsonb_agg(jsonb_build_object('offer_id',i.offer_id,'quantity',i.quantity) order by i.offer_id),'[]') from public.cart_items i where i.cart_id=cart.id) is distinct from (select coalesce(jsonb_agg(x order by x->>'offer_id'),'[]') from jsonb_array_elements(p_lines) x) then raise exception 'sales_cart_changed' using errcode='PT409';end if;
 end if;
 if p_quote_id is not null then
  if cart.id is not null and (select jsonb_agg(jsonb_build_object('offer_id',x->'offer_id','quantity',x->'quantity') order by x->>'offer_id') from jsonb_array_elements(q.merchandise_snapshot) x) is distinct from (select jsonb_agg(x order by x->>'offer_id') from jsonb_array_elements(p_lines) x) then raise exception 'sales_cart_changed' using errcode='PT409';end if;
  for offer_id in select (x->>'offer_id')::uuid from jsonb_array_elements(q.merchandise_snapshot) x order by x->>'offer_id' loop perform 1 from public.store_offers where id=offer_id for update;end loop;
 else
  for offer_id in select (x->>'offer_id')::uuid from jsonb_array_elements(p_lines) x order by x->>'offer_id' loop perform 1 from public.store_offers where id=offer_id for update;end loop;
 end if;
 at_time=clock_timestamp();
 summary=public.sales_summary(p_lines,p_contact,p_delivery,p_address,p_quote_id);
 if summary->>'hash' is distinct from p_hash then raise exception 'sales_price_changed' using errcode='PT409';end if;
 for item in select x from jsonb_array_elements(summary->'lines') x loop
  if not exists(select 1 from public.store_offers where id=(item->>'offer_id')::uuid and active) or public._sales_available((item->>'offer_id')::uuid,at_time)<(item->>'quantity')::integer then raise exception 'sales_insufficient_stock' using errcode='PT409';end if;
 end loop;
 insert into public.orders(user_id,quote_id,assembly_fee_cents,delivery_fee_cents,total_cents,delivery_method,delivery_snapshot,contact_snapshot,accepted_summary_hash,reservation_expires_at,idempotency_key,request_hash)
 values(owner,p_quote_id,(summary->>'assembly_fee_cents')::bigint,(summary->>'delivery_fee_cents')::bigint,(summary->>'total_cents')::bigint,p_delivery,p_address,p_contact,p_hash,at_time+make_interval(mins=>greatest(1,least(1440,(public.sales_policy()->>'reservation_minutes')::integer))),p_key,request_digest) returning id into result;
 for item in select x from jsonb_array_elements(summary->'lines') x loop
  insert into public.order_items(order_id,offer_id,quantity,sku_snapshot,label_snapshot,finish_snapshot,unit_of_sale_snapshot,commercial_identity_snapshot,base_unit_price_cents,unit_discount_cents,promotion_id,promotion_snapshot,item_condition_snapshot)
  values(result,(item->>'offer_id')::uuid,(item->>'quantity')::integer,item->>'sku',item->>'label',item->'identity'->>'finish',item->>'unit',item->'identity',(item->>'base_cents')::bigint,(item->>'discount_cents')::bigint,(item->>'promotion_id')::uuid,item->'promotion',item->>'item_condition');
 end loop;
 if cart.id is not null then delete from public.cart_items where cart_id=cart.id;update public.carts set revision=revision+1,updated_at=at_time where id=cart.id;end if;
 if p_quote_id is not null then update public.sales_quotes set status='consumed',revision=revision+1,updated_at=at_time where id=p_quote_id;end if;
 insert into public.order_events(order_id,event_type,actor_id,actor_kind,to_status) values(result,'created',owner,'customer','pending');return result;
end$$;

-- One-time correction of untouched seeded prices only. Preserve staff edits,
-- existing accepted quotes/orders, stock, finishes and visual resources.
with prices(name,cents) as (values
 ('CAPRA MK3 Carbon MX',380000),
 ('CHERRY BOMB 29',220000),
 ('Force Carbon · High Pivot',320000),
 ('FRS V3 · Pure White',280000),
 ('Furious V3 · 2021',230000),
 ('Fury Carbon · High Pivot',380000),
 ('META SX V5',350000),
 ('Nomad 7 CC',650000),
 ('Ransom RC HMX',550000),
 ('S-Works Enduro',580000),
 ('Sender CFR',480000),
 ('Slash AL Gen 6',360000),
 ('SUPREME DH V5',520000),
 ('TUES MK4 Carbon',460000),
 ('V10 8 CC · MY27',750000),
 ('38 Factory · MY27',280000),
 ('40 Factory · MY27',350000),
 ('Bomber 58',220000),
 ('Bomber Z1 RAIL',150000),
 ('BoXXer Select · D2',240000),
 ('BoXXer Ultimate · D2',310000),
 ('DH38 m.2',380000),
 ('RXF38 m.3',320000),
 ('ZEB Ultimate',240000),
 ('Bomber CR',65000),
 ('FLOAT X2 Factory',130000),
 ('TTX22m.2',180000),
 ('Vivid Coil Ultimate',160000)
)
update public.store_offers o set base_price_cents=p.cents,revision=revision+1,updated_at=clock_timestamp()
from public.components c join prices p on p.name=c.name
where c.id=o.component_id and c.category in ('frame','fork','shock')
and o.sku like 'DEMO-%' and o.updated_by is null
and o.base_price_cents=case c.category when 'frame' then 900000 when 'fork' then 550000 when 'shock' then 240000 end
and not exists(select 1 from public.promotion_offers l join public.promotions d on d.id=l.promotion_id where l.offer_id=o.id and d.active and d.ends_at>clock_timestamp());
