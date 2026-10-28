create function public._sales_validate_promotions(p_offer uuid) returns void language plpgsql security definer set search_path='' as $$
declare o public.store_offers;
begin
 select * into strict o from public.store_offers where id=p_offer;
 if exists(select 1 from public.promotions p join public.promotion_offers l on l.promotion_id=p.id where l.offer_id=o.id and p.active and p.ends_at>clock_timestamp() and (public._sales_discount(o.base_price_cents,p)>=o.base_price_cents or (p.discount_type='fixed' and p.currency<>o.currency))) then raise exception 'sales_invalid_discount' using errcode='22023';end if;
end$$;
create function public.sales_admin_offers(p_search text default '',p_page integer default 0) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 perform public._sales_account();perform iam.require_permission('sales.offers.manage');
 return jsonb_build_object('count',(select count(*) from public.store_offers o where o.label ilike '%'||left(p_search,100)||'%' or o.sku ilike '%'||left(p_search,100)||'%'),
 'items',(select coalesce(jsonb_agg(to_jsonb(t) order by t.label,t.id),'[]') from (select o.*,(select jsonb_agg(jsonb_build_object('variant_id',l.variant_id,'finish_id',l.finish_id)) from public.store_offer_variants l where l.offer_id=o.id) choices,public._sales_available(o.id,clock_timestamp()) available from public.store_offers o where o.label ilike '%'||left(p_search,100)||'%' or o.sku ilike '%'||left(p_search,100)||'%' order by o.label,o.id limit 25 offset greatest(0,least(100000,p_page))*25)t));
end$$;
create function public.sales_admin_choices(p_search text default '') returns jsonb language plpgsql security definer set search_path='' as $$
begin
 perform public._sales_account();perform iam.require_permission('sales.offers.manage');
 return (select coalesce(jsonb_agg(to_jsonb(t)),'[]') from (select v.id variant_id,c.id component_id,b.name||' '||c.name||' · '||v.label label,v.allowed_finishes,v.generation,v.model_year from public.component_variants v join public.components c on c.id=v.component_id join public.brands b on b.id=c.brand_id where v.published and v.selectable and v.representation<>'generic' and (c.name||' '||b.name||' '||v.label) ilike '%'||left(p_search,100)||'%' order by c.name,v.label limit 100)t);
end$$;
create function public.sales_save_offer(p_data jsonb,p_revision integer) returns uuid language plpgsql security definer set search_path='' as $$
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
create function public.sales_promotions(p_page integer default 0) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 perform public._sales_account();perform iam.require_permission('sales.promotions.manage');
 return jsonb_build_object('count',(select count(*) from public.promotions),'items',(select coalesce(jsonb_agg(to_jsonb(p)||jsonb_build_object('offer_ids',(select coalesce(jsonb_agg(l.offer_id),'[]') from public.promotion_offers l where l.promotion_id=p.id)) order by p.created_at desc,p.id),'[]') from (select * from public.promotions order by created_at desc,id limit 25 offset greatest(0,least(100000,p_page))*25)p));
end$$;
create function public.sales_save_promotion(p_data jsonb,p_revision integer) returns uuid language plpgsql security definer set search_path='' as $$
#variable_conflict use_variable
declare owner uuid=public._sales_account(); existing public.promotions; id uuid=(p_data->>'id')::uuid; offer uuid;
begin
 perform iam.lock_authorization();perform iam.require_permission('sales.promotions.manage');
 if id is null or p_revision is null then raise exception 'revision_conflict' using errcode='PT409';end if;
 select * into existing from public.promotions where promotions.id=id for update;
 if (existing.id is null and p_revision<>0) or (existing.id is not null and existing.revision is distinct from p_revision) then raise exception 'revision_conflict' using errcode='PT409';end if;
 if jsonb_typeof(p_data->'offer_ids') is distinct from 'array' or jsonb_array_length(p_data->'offer_ids') not between 1 and 1000 then raise exception 'sales_invalid_selection' using errcode='22023';end if;
 for offer in select distinct value::uuid from jsonb_array_elements_text(p_data->'offer_ids') union select offer_id from public.promotion_offers where promotion_id=id order by 1 loop perform 1 from public.store_offers where store_offers.id=offer for update;end loop;
 insert into public.promotions(id,name,discount_type,percentage_bps,fixed_discount_cents,currency,starts_at,ends_at,active,updated_by)
 values(id,p_data->>'name',p_data->>'discount_type',(p_data->>'percentage_bps')::integer,(p_data->>'fixed_discount_cents')::bigint,case when p_data->>'discount_type'='fixed' then 'PEN' else null end,(p_data->>'starts_at')::timestamptz,(p_data->>'ends_at')::timestamptz,(p_data->>'active')::boolean,owner)
 on conflict on constraint promotions_pkey do update set name=excluded.name,discount_type=excluded.discount_type,percentage_bps=excluded.percentage_bps,fixed_discount_cents=excluded.fixed_discount_cents,currency=excluded.currency,starts_at=excluded.starts_at,ends_at=excluded.ends_at,active=excluded.active,updated_by=owner,updated_at=clock_timestamp(),revision=promotions.revision+1;
 delete from public.promotion_offers where promotion_id=id;
 for offer in select distinct value::uuid from jsonb_array_elements_text(p_data->'offer_ids') loop
  insert into public.promotion_offers values(id,offer);perform public._sales_validate_promotions(offer);
 end loop;return id;
end$$;
create function public.sales_convert_selection(p_selection jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare item jsonb; mapped uuid; lines jsonb; unresolved jsonb='[]'; slots text[]='{}'; position_lines jsonb='[]'; cat text;
begin
 perform public._sales_account();
 if jsonb_typeof(p_selection) is distinct from 'array' or jsonb_array_length(p_selection) not between 1 and 23 or pg_column_size(p_selection)>131072 then raise exception 'sales_invalid_selection' using errcode='22023';end if;
 for item in select x from jsonb_array_elements(p_selection) x loop
  cat=iam.slot_category(item->>'slot');
  if cat is null or item->>'slot'=any(slots) then raise exception 'sales_invalid_selection' using errcode='22023';end if;slots=array_append(slots,item->>'slot');
  select l.offer_id into mapped from public.store_offer_variants l join public.component_variants v on v.id=l.variant_id join public.components c on c.id=v.component_id join public.store_offers o on o.id=l.offer_id where l.variant_id=(item->>'variantId')::uuid and l.finish_id=item->>'finishId' and c.category=cat and o.active and (item->>'customColor' is null);
  if mapped is null then unresolved=unresolved||jsonb_build_array(item->>'slot');else position_lines=position_lines||jsonb_build_array(jsonb_build_object('slot',item->>'slot','offer_id',mapped,'quantity',1));end if;
 end loop;
 select coalesce(jsonb_agg(jsonb_build_object('offer_id',offer_id,'quantity',quantity) order by offer_id),'[]') into lines from (select (x->>'offer_id')::uuid offer_id,count(*) quantity from jsonb_array_elements(position_lines) x group by x->>'offer_id')t;
 return jsonb_build_object('lines',lines,'positions',position_lines,'unresolved',unresolved);
end$$;
create function public.sales_request_quote(p_id uuid,p_lines jsonb,p_contact jsonb,p_delivery text,p_address jsonb,p_assembly boolean,p_selection jsonb default '[]',p_build_id uuid default null,p_previous uuid default null,p_revision integer default null) returns uuid language plpgsql security definer set search_path='' as $$
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
 values(p_id,owner,series,version_no,digest,p_build_id,p_selection,public._sales_hash(p_selection),p_assembly,case when p_assembly then 'pending' else 'not_required' end,lines,p_delivery,p_address,p_contact);return p_id;
end$$;
create function public.sales_quotes(p_admin boolean default false,p_page integer default 0) returns jsonb language plpgsql security definer set search_path='' as $$
declare owner uuid=public._sales_account();begin
 if p_admin then perform iam.require_permission('sales.quotes.manage');end if;
 return jsonb_build_object('count',(select count(*) from public.sales_quotes q where p_admin or q.user_id=owner),'items',(select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at desc,t.id),'[]') from (select id,version,status,revision,assembly_requested,technical_review,delivery_method,expires_at,created_at from public.sales_quotes q where p_admin or q.user_id=owner order by created_at desc,id limit 25 offset greatest(0,least(100000,p_page))*25)t));
end$$;
create function public.sales_quote(p_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare owner uuid=public._sales_account(); q public.sales_quotes;
begin
 select * into q from public.sales_quotes where id=p_id;
 if not found or (q.user_id<>owner and not iam.has_permission('sales.quotes.manage')) then raise exception 'sales_quote_unavailable' using errcode='42501';end if;
 return to_jsonb(q)-'request_hash'||jsonb_build_object('expired',q.expires_at<=clock_timestamp());
end$$;
create function public.sales_review_quote(p_id uuid,p_revision integer,p_status text,p_assembly_fee bigint,p_delivery_fee bigint,p_notes text) returns jsonb language plpgsql security definer set search_path='' as $$
declare owner uuid=public._sales_account(); q public.sales_quotes; lines jsonb; offer uuid;
begin
 perform iam.require_permission('sales.quotes.manage');select * into q from public.sales_quotes where id=p_id;
 if not found then raise exception 'sales_quote_unavailable' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended('sales-quote:'||q.series_id::text,0));select * into q from public.sales_quotes where id=p_id for update;
 if p_revision is not null and q.status=p_status and q.review_notes is not distinct from p_notes and (p_status='rejected' or (q.assembly_fee_cents=p_assembly_fee and q.delivery_fee_cents=p_delivery_fee)) then return public.sales_quote(p_id);end if;
 if p_revision is null or q.revision is distinct from p_revision then raise exception 'revision_conflict' using errcode='PT409';end if;
 if q.status<>'requested' or p_status not in ('quoted','rejected') or p_status is null then raise exception 'sales_transition_denied' using errcode='22023';end if;
 if p_status='quoted' then
  for offer in select (x->>'offer_id')::uuid from jsonb_array_elements(q.merchandise_snapshot) x order by x->>'offer_id' loop perform 1 from public.store_offers where id=offer for update;end loop;
  lines=public._sales_price_lines(public._sales_snapshot((select jsonb_agg(jsonb_build_object('offer_id',x->'offer_id','quantity',x->'quantity')) from jsonb_array_elements(q.merchandise_snapshot) x),clock_timestamp()));
  if p_assembly_fee is null or p_delivery_fee is null or (not q.assembly_requested and p_assembly_fee<>0) then raise exception 'sales_quote_cost_required' using errcode='22023';end if;
 else lines=q.merchandise_snapshot;end if;
 update public.sales_quotes set status=p_status,technical_review=case when not assembly_requested then 'not_required' when p_status='quoted' then 'approved' else 'rejected' end,merchandise_snapshot=lines,assembly_fee_cents=case when p_status='quoted' then p_assembly_fee else null end,delivery_fee_cents=case when p_status='quoted' then p_delivery_fee else null end,review_notes=p_notes,reviewed_by=owner,reviewed_at=clock_timestamp(),quoted_by=owner,quoted_at=clock_timestamp(),expires_at=case when p_status='quoted' then clock_timestamp()+make_interval(hours=>greatest(1,least(720,(public.sales_policy()->>'quote_hours')::integer))) else null end,revision=revision+1,updated_at=clock_timestamp() where id=p_id;
 return public.sales_quote(p_id);
end$$;
do $$declare f record;begin
 for f in select p.oid::regprocedure signature,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and (p.proname in ('sales_admin_offers','sales_admin_choices','sales_save_offer','sales_promotions','sales_save_promotion','sales_convert_selection','sales_request_quote','sales_quotes','sales_quote','sales_review_quote','_sales_validate_promotions')) loop
  execute format('revoke all on function %s from public,anon,authenticated',f.signature);
  if f.proname not like '\_%' escape '\' then execute format('grant execute on function %s to authenticated',f.signature);end if;
 end loop;
end$$;
create function public.sales_cart_prices(p_lines jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare filtered jsonb;
begin
 if jsonb_typeof(p_lines) is distinct from 'array' or jsonb_array_length(p_lines)>100 then raise exception 'sales_query_limit' using errcode='22023';end if;
 select coalesce(jsonb_agg(x),'[]') into filtered from jsonb_array_elements(p_lines) x where exists(select 1 from public.store_offers o join public.store_offer_variants l on l.offer_id=o.id join public.component_variants v on v.id=l.variant_id where o.id=(x->>'offer_id')::uuid and o.active and v.published and v.selectable);
 if jsonb_array_length(filtered)=0 then return '[]';end if;
 return public._sales_snapshot(filtered,clock_timestamp());
end$$;
revoke all on function public.sales_cart_prices(jsonb) from public;
grant execute on function public.sales_cart_prices(jsonb) to anon,authenticated;

create function public.sales_promotion_choices(p_search text default '',p_page integer default 0) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 perform public._sales_account();perform iam.require_permission('sales.promotions.manage');
 return jsonb_build_object('count',(select count(*) from public.store_offers where label ilike '%'||left(p_search,100)||'%'),'items',(select coalesce(jsonb_agg(to_jsonb(t) order by t.label,t.id),'[]') from (select id,label,base_price_cents from public.store_offers where label ilike '%'||left(p_search,100)||'%' order by label,id limit 25 offset greatest(0,least(100000,p_page))*25)t));
end$$;
revoke all on function public.sales_promotion_choices(text,integer) from public,anon;
grant execute on function public.sales_promotion_choices(text,integer) to authenticated;
