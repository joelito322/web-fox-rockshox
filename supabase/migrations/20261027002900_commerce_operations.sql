-- One server authority for prices, stock and accepted summaries.
create function public._sales_hash(p_data jsonb) returns text language sql immutable set search_path='' as $$select encode(sha256(convert_to(p_data::text,'UTF8')),'hex')$$;
create function public._sales_available(p_offer uuid,p_at timestamptz) returns bigint language sql volatile security definer set search_path='' as $$
 select o.stock_total-coalesce((select sum(i.quantity) from public.order_items i join public.orders h on h.id=i.order_id where i.offer_id=o.id and h.status='pending' and h.reservation_expires_at>p_at),0) from public.store_offers o where o.id=p_offer
$$;
create function public._sales_discount(p_base bigint,p_promotion public.promotions) returns bigint language sql immutable set search_path='' as $$
 select case when p_promotion.discount_type='fixed' then p_promotion.fixed_discount_cents else floor((p_base::numeric*p_promotion.percentage_bps+5000)/10000)::bigint end
$$;
create function public._sales_snapshot(p_lines jsonb,p_at timestamptz) returns jsonb language plpgsql security definer set search_path='' as $$
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
  result=result||jsonb_build_array(jsonb_build_object('offer_id',o.id,'component_id',o.component_id,'sku',o.sku,'label',o.label,'image_key',(select c.image_key from public.components c where c.id=o.component_id),'identity',o.commercial_identity,'unit',o.unit_of_sale,'quantity',qty,'currency',o.currency,'base_cents',o.base_price_cents,'discount_cents',discount,'unit_cents',o.base_price_cents-discount,'subtotal_cents',(o.base_price_cents-discount)*qty,'promotion_id',promo.id,'promotion',case when promo.id is null then null else jsonb_build_object('id',promo.id,'name',promo.name,'type',promo.discount_type,'percentage_bps',promo.percentage_bps,'fixed_discount_cents',promo.fixed_discount_cents,'currency',promo.currency) end,'available',available));
 end loop;
 return result;
end$$;
-- Availability is a live hint, excluded from the accepted financial fingerprint.
create function public._sales_price_lines(p_lines jsonb) returns jsonb language sql immutable set search_path='' as $$select coalesce(jsonb_agg(x-'available' order by x->>'offer_id'),'[]') from jsonb_array_elements(p_lines) x$$;
create function public._sales_contact(p_contact jsonb,p_delivery text,p_address jsonb) returns void language plpgsql set search_path='' as $$
begin
 if p_delivery not in ('pickup','shipping') or p_delivery is null or jsonb_typeof(p_contact) is distinct from 'object' or pg_column_size(p_contact)>8192 or length(btrim(coalesce(p_contact->>'name',''))) not between 2 and 150 or length(btrim(coalesce(p_contact->>'contact',''))) not between 5 and 200 then raise exception 'sales_contact_required' using errcode='22023';end if;
 if jsonb_typeof(p_address) is distinct from 'object' or pg_column_size(p_address)>8192 then raise exception 'sales_address_required' using errcode='22023';end if;
 if p_delivery='shipping' and (length(btrim(coalesce(p_address->>'address','')))<5 or length(btrim(coalesce(p_address->>'city','')))<2 or length(btrim(coalesce(p_address->>'region','')))<2) then raise exception 'sales_address_required' using errcode='22023';end if;
end$$;
create function public.sales_offers(p_component_ids uuid[] default null,p_variant_ids uuid[] default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare ids uuid[]; result jsonb; at_time timestamptz=clock_timestamp();
begin
 if coalesce(cardinality(p_component_ids),0)>100 or coalesce(cardinality(p_variant_ids),0)>200 or (p_component_ids is null and p_variant_ids is null) then raise exception 'sales_query_limit' using errcode='22023';end if;
 select array_agg(distinct o.id) into ids from public.store_offers o join public.store_offer_variants l on l.offer_id=o.id join public.component_variants v on v.id=l.variant_id join public.components c on c.id=v.component_id join public.brands b on b.id=c.brand_id where o.active and c.published and b.published and v.published and v.selectable and (p_component_ids is null or o.component_id=any(p_component_ids)) and (p_variant_ids is null or v.id=any(p_variant_ids));
 if ids is null then return '[]';end if;
 select coalesce(jsonb_agg(x||jsonb_build_object('choices',(select jsonb_agg(jsonb_build_object('variant_id',l.variant_id,'finish_id',l.finish_id)) from public.store_offer_variants l join public.component_variants v on v.id=l.variant_id where l.offer_id=(x->>'offer_id')::uuid and v.published and v.selectable))),'[]') into result from jsonb_array_elements(public._sales_snapshot((select jsonb_agg(jsonb_build_object('offer_id',id,'quantity',1)) from unnest(ids) id),at_time)) x;
 return result;
end$$;
create function public.sales_cart() returns jsonb language plpgsql security definer set search_path='' as $$
declare owner uuid=public._sales_account(); cart public.carts; lines jsonb;
begin
 insert into public.carts(user_id) values(owner) on conflict(user_id) do nothing;
 select * into cart from public.carts where user_id=owner;
 -- Retain unavailable lines instead of hiding or deleting a stale cart.
 select coalesce(jsonb_agg(jsonb_build_object('offer_id',o.id,'component_id',o.component_id,'label',o.label,'identity',o.commercial_identity,'quantity',i.quantity,'active',o.active,'unit',o.unit_of_sale,'currency',o.currency,'base_cents',o.base_price_cents,'available',public._sales_available(o.id,clock_timestamp())) order by o.label),'[]') into lines from public.cart_items i join public.store_offers o on o.id=i.offer_id where cart_id=cart.id;
 return jsonb_build_object('id',cart.id,'revision',cart.revision,'items',lines);
end$$;
create function public.sales_save_cart(p_revision integer,p_lines jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare owner uuid=public._sales_account(); cart public.carts; item jsonb; snapshot jsonb; old_quantity integer; next_quantity integer; o public.store_offers;
begin
 insert into public.carts(user_id) values(owner) on conflict(user_id) do nothing;
 select * into strict cart from public.carts where user_id=owner for update;
 if p_revision is null or p_revision is distinct from cart.revision then raise exception 'revision_conflict' using errcode='PT409';end if;
 if jsonb_typeof(p_lines) is distinct from 'array' or jsonb_array_length(p_lines)>100 then raise exception 'sales_invalid_selection' using errcode='22023';end if;
 if exists(select 1 from jsonb_array_elements(p_lines) x group by x->>'offer_id' having count(*)>1) then raise exception 'sales_duplicate_offer' using errcode='22023';end if;
 for item in select x from jsonb_array_elements(p_lines) x loop
  if (item->>'quantity') !~ '^[1-9][0-9]?$' or item->>'quantity' is null then raise exception 'sales_invalid_quantity' using errcode='22023';end if;next_quantity=(item->>'quantity')::integer;
  select * into o from public.store_offers where id=(item->>'offer_id')::uuid;
  if not found then raise exception 'sales_offer_unavailable' using errcode='22023';end if;
  select quantity into old_quantity from public.cart_items where cart_id=cart.id and offer_id=o.id;
  if next_quantity>coalesce(old_quantity,0) and (not o.active or public._sales_available(o.id,clock_timestamp())<next_quantity) then raise exception 'sales_insufficient_stock' using errcode='PT409';end if;
 end loop;
 delete from public.cart_items where cart_id=cart.id;
 for item in select x from jsonb_array_elements(p_lines) x loop
  insert into public.cart_items(cart_id,offer_id,quantity) values(cart.id,(item->>'offer_id')::uuid,(item->>'quantity')::integer);
 end loop;
 update public.carts set revision=revision+1,updated_at=clock_timestamp() where id=cart.id;
 return public.sales_cart();
end$$;
create function public.sales_summary(p_lines jsonb,p_contact jsonb,p_delivery text,p_address jsonb,p_quote_id uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare owner uuid=public._sales_account(); lines jsonb; quote public.sales_quotes; result jsonb; fee bigint=0; assembly bigint=0; total bigint;
begin
 perform public._sales_contact(p_contact,p_delivery,p_address);
 if p_quote_id is not null then
  select * into quote from public.sales_quotes where id=p_quote_id and user_id=owner;
  if not found or quote.status<>'quoted' or quote.expires_at<=clock_timestamp() then raise exception 'sales_quote_expired' using errcode='PT409';end if;
  if quote.contact_snapshot is distinct from p_contact or quote.delivery_snapshot is distinct from p_address or quote.delivery_method<>p_delivery then raise exception 'sales_quote_changed' using errcode='PT409';end if;
  lines=quote.merchandise_snapshot;fee=quote.delivery_fee_cents;assembly=quote.assembly_fee_cents;
 else
  if p_delivery<>'pickup' then raise exception 'sales_quote_required' using errcode='22023';end if;
  lines=public._sales_price_lines(public._sales_snapshot(p_lines,clock_timestamp()));
 end if;
 select sum((x->>'subtotal_cents')::bigint) into total from jsonb_array_elements(lines) x;
 result=jsonb_build_object('lines',lines,'currency','PEN','assembly_fee_cents',assembly,'delivery_fee_cents',fee,'total_cents',total+assembly+fee,'contact',p_contact,'delivery',p_delivery,'address',p_address,'quote_id',p_quote_id);
 return result||jsonb_build_object('hash',public._sales_hash(result));
end$$;
create function public.sales_create_order(p_key uuid,p_hash text,p_lines jsonb,p_contact jsonb,p_delivery text,p_address jsonb,p_cart_revision integer default null,p_quote_id uuid default null) returns uuid language plpgsql security definer set search_path='' as $$
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
  insert into public.order_items(order_id,offer_id,quantity,sku_snapshot,label_snapshot,finish_snapshot,unit_of_sale_snapshot,commercial_identity_snapshot,base_unit_price_cents,unit_discount_cents,promotion_id,promotion_snapshot)
  values(result,(item->>'offer_id')::uuid,(item->>'quantity')::integer,item->>'sku',item->>'label',item->'identity'->>'finish',item->>'unit',item->'identity',(item->>'base_cents')::bigint,(item->>'discount_cents')::bigint,(item->>'promotion_id')::uuid,item->'promotion');
 end loop;
 if cart.id is not null then delete from public.cart_items where cart_id=cart.id;update public.carts set revision=revision+1,updated_at=at_time where id=cart.id;end if;
 if p_quote_id is not null then update public.sales_quotes set status='consumed',revision=revision+1,updated_at=at_time where id=p_quote_id;end if;
 insert into public.order_events(order_id,event_type,actor_id,actor_kind,to_status) values(result,'created',owner,'customer','pending');return result;
end$$;
create function public.sales_order(p_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare owner uuid=public._sales_account(); h public.orders; result jsonb;
begin
 select * into h from public.orders where id=p_id;
 if not found or (h.user_id<>owner and not iam.has_permission('sales.orders.manage')) then raise exception 'sales_order_unavailable' using errcode='42501';end if;
 result=to_jsonb(h)-'request_hash'-'idempotency_key';
 if h.status='pending' and h.reservation_expires_at<=clock_timestamp() then result=result||jsonb_build_object('status','expired');end if;
 return result||jsonb_build_object('items',(select coalesce(jsonb_agg(to_jsonb(i) order by i.label_snapshot),'[]') from public.order_items i where order_id=h.id),'payments',(select coalesce(jsonb_agg(to_jsonb(p)-'idempotency_key' order by p.created_at desc),'[]') from public.payment_attempts p where order_id=h.id),'events',(select coalesce(jsonb_agg(jsonb_build_object('id',e.id,'event_type',e.event_type,'from_status',e.from_status,'to_status',e.to_status,'created_at',e.created_at) order by e.created_at),'[]') from public.order_events e where order_id=h.id));
end$$;
create function public.sales_orders(p_admin boolean default false,p_page integer default 0) returns jsonb language plpgsql security definer set search_path='' as $$
declare owner uuid=public._sales_account(); result jsonb;
begin
 if p_admin then perform iam.require_permission('sales.orders.manage');end if;
 select jsonb_build_object('count',(select count(*) from public.orders h where p_admin or h.user_id=owner),'items',coalesce(jsonb_agg(to_jsonb(t) order by t.created_at desc,t.id),'[]')) into result from (select h.id,h.user_id,h.total_cents,h.currency,case when h.status='pending' and h.reservation_expires_at<=clock_timestamp() then 'expired' else h.status end status,h.delivery_method,h.revision,h.created_at from public.orders h where p_admin or h.user_id=owner order by h.created_at desc,h.id limit 25 offset least(100000,greatest(0,p_page))*25)t;
 return result;
end$$;
create function public.sales_pay_demo(p_order uuid,p_key uuid,p_method text,p_result text) returns jsonb language plpgsql security definer set search_path='' as $$
declare owner uuid=public._sales_account(); h public.orders; attempt public.payment_attempts; item record; at_time timestamptz;
begin
 if p_key is null or p_method not in ('yape_demo','transfer_demo','card_demo') or p_result not in ('approved','rejected','cancelled') or p_method is null or p_result is null then raise exception 'sales_invalid_payment' using errcode='22023';end if;
 select * into h from public.orders where id=p_order for update;
 if not found or h.user_id<>owner or h.mode<>'demo' then raise exception 'sales_order_unavailable' using errcode='42501';end if;
 select * into attempt from public.payment_attempts where order_id=h.id and idempotency_key=p_key;
 if found then
  if attempt.method<>p_method or attempt.status<>p_result then raise exception 'sales_idempotency_conflict' using errcode='PT409';end if;return public.sales_order(h.id);
 end if;
 for item in select offer_id from public.order_items where order_id=h.id order by offer_id loop perform 1 from public.store_offers where id=item.offer_id for update;end loop;
 at_time=clock_timestamp();
 if h.status<>'pending' or h.reservation_expires_at<=at_time then raise exception 'sales_order_expired_or_closed' using errcode='PT409';end if;
 insert into public.payment_attempts(order_id,method,status,amount_cents,currency,idempotency_key,resolved_at) values(h.id,p_method,p_result,h.total_cents,h.currency,p_key,at_time);
 if p_result='approved' then
  for item in select offer_id,quantity from public.order_items where order_id=h.id order by offer_id loop
   update public.store_offers set stock_total=stock_total-item.quantity,revision=revision+1,updated_at=at_time where id=item.offer_id;
  end loop;
  update public.orders set status='confirmed',confirmed_at=at_time,updated_at=at_time,revision=revision+1 where id=h.id;
  insert into public.order_events(order_id,event_type,actor_id,actor_kind,from_status,to_status) values(h.id,'payment_demo_approved',owner,'customer','pending','confirmed');
 end if;return public.sales_order(h.id);
end$$;
create function public.sales_transition(p_order uuid,p_revision integer,p_status text,p_reason text default '') returns jsonb language plpgsql security definer set search_path='' as $$
declare owner uuid=public._sales_account(); h public.orders; staff boolean=iam.has_permission('sales.orders.manage'); item record; at_time timestamptz;
begin
 select * into h from public.orders where id=p_order for update;
 if not found or (h.user_id<>owner and not staff) then raise exception 'sales_order_unavailable' using errcode='42501';end if;
 if p_revision is null or h.revision is distinct from p_revision then raise exception 'revision_conflict' using errcode='PT409';end if;
 if p_status='cancelled' then
  if h.status not in ('pending','confirmed') or (h.status='confirmed' and not staff) or length(btrim(coalesce(p_reason,''))) not between 3 and 2000 then raise exception 'sales_transition_denied' using errcode='42501';end if;
 elsif not staff or (h.status,p_status) not in (('confirmed','preparing'),('preparing','ready'),('ready','delivered')) then raise exception 'sales_transition_denied' using errcode='42501';end if;
 for item in select offer_id from public.order_items where order_id=h.id order by offer_id loop perform 1 from public.store_offers where id=item.offer_id for update;end loop;
 at_time=clock_timestamp();
 if h.status='pending' and h.reservation_expires_at<=at_time then raise exception 'sales_order_expired_or_closed' using errcode='PT409';end if;
 if h.status='confirmed' and p_status='cancelled' then
  for item in select offer_id,quantity from public.order_items where order_id=h.id order by offer_id loop update public.store_offers set stock_total=stock_total+item.quantity,revision=revision+1,updated_at=at_time where id=item.offer_id;end loop;
 end if;
 update public.orders set status=p_status,revision=revision+1,updated_at=at_time,cancelled_at=case when p_status='cancelled' then at_time else null end,cancellation_reason=nullif(btrim(p_reason),'') where id=h.id;
 insert into public.order_events(order_id,event_type,actor_id,actor_kind,from_status,to_status,reason) values(h.id,'transition',owner,case when staff then 'staff' else 'customer' end,h.status,p_status,nullif(btrim(p_reason),''));return public.sales_order(h.id);
end$$;
-- Restrict internal helpers, then expose only authenticated contracts.
do $$declare f record;begin
 for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and (p.proname like '\_sales\_%' escape '\' or p.proname in ('sales_cart','sales_save_cart','sales_summary','sales_create_order','sales_order','sales_orders','sales_pay_demo','sales_transition','sales_offers')) loop
  execute format('revoke all on function %s from public,anon,authenticated',f.signature);
 end loop;
end$$;
grant execute on function public.sales_offers(uuid[],uuid[]) to anon,authenticated;
grant execute on function public.sales_cart(), public.sales_save_cart(integer,jsonb), public.sales_summary(jsonb,jsonb,text,jsonb,uuid), public.sales_create_order(uuid,text,jsonb,jsonb,text,jsonb,integer,uuid), public.sales_order(uuid), public.sales_orders(boolean,integer), public.sales_pay_demo(uuid,uuid,text,text), public.sales_transition(uuid,integer,text,text) to authenticated;
