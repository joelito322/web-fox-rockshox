-- Configurable assembly tariff, immutable quote snapshots and account notices.
create table public.sales_service_settings (
 singleton boolean primary key default true check(singleton),
 assembly_fee_cents bigint not null check(assembly_fee_cents between 0 and 100000000),
 revision integer not null default 1 check(revision>0),
 updated_by uuid references auth.users on delete set null,
 updated_at timestamptz not null default now()
);
alter table public.sales_service_settings enable row level security;
revoke all on public.sales_service_settings from public,anon,authenticated;
insert into public.sales_service_settings(singleton,assembly_fee_cents) values(true,15000);

alter table public.sales_quotes add column assembly_base_fee_cents bigint check(assembly_base_fee_cents between 0 and 100000000);
alter table public.sales_quotes add column notification_seen_revision integer not null default 0 check(notification_seen_revision>=0);
alter table public.orders add column preferred_payment_method text check(preferred_payment_method in ('yape_demo','plin_demo','transfer_demo','card_demo','bcp_demo','interbank_demo','bbva_demo','scotiabank_demo'));

create or replace function public.sales_policy() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('mode','demo','currency','PEN','reservation_minutes',coalesce(nullif(current_setting('app.sales.reservation_minutes',true),''),'30')::integer,
 'quote_hours',coalesce(nullif(current_setting('app.sales.quote_hours',true),''),'48')::integer,'pickup_fee_cents',0,'max_quantity',99,
 'assembly_fee_cents',s.assembly_fee_cents,'service_revision',s.revision) from public.sales_service_settings s where singleton
$$;

create function public.sales_save_assembly_tariff(p_revision integer,p_fee bigint) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid=public._sales_account(); s public.sales_service_settings;
begin
 perform iam.lock_authorization(); perform iam.require_permission('sales.offers.manage');
 select * into s from public.sales_service_settings where singleton for update;
 if p_revision is null or s.revision<>p_revision then raise exception 'revision_conflict' using errcode='PT409';end if;
 if p_fee is null or p_fee not between 0 and 100000000 then raise exception 'sales_invalid_price' using errcode='22023';end if;
 update public.sales_service_settings set assembly_fee_cents=p_fee,revision=revision+1,updated_by=actor,updated_at=clock_timestamp() where singleton;
 return public.sales_policy();
end$$;

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
 insert into public.sales_quotes(id,user_id,series_id,version,request_hash,source_build_id,selection_snapshot,selection_hash,assembly_requested,technical_review,merchandise_snapshot,delivery_method,delivery_snapshot,contact_snapshot,assembly_base_fee_cents,assembly_fee_cents,delivery_fee_cents)
 values(p_id,owner,series,version_no,digest,p_build_id,case when p_assembly then public._sales_selection_snapshot(p_selection) else '[]'::jsonb end,public._sales_hash(case when p_assembly then public._sales_selection_snapshot(p_selection) else '[]'::jsonb end),p_assembly,case when p_assembly then 'pending' else 'not_required' end,lines,p_delivery,p_address,p_contact,case when p_assembly then (public.sales_policy()->>'assembly_fee_cents')::bigint else 0 end,case when p_assembly then (public.sales_policy()->>'assembly_fee_cents')::bigint else 0 end,case when p_delivery='pickup' then 0 else null end);return p_id;
end$$;

-- Preserve original atomic checkout; the wrapper stores the chosen channel in the same transaction.
create function public.sales_create_order_with_payment(p_key uuid,p_hash text,p_lines jsonb,p_contact jsonb,p_delivery text,p_address jsonb,p_cart_revision integer,p_quote_id uuid,p_method text) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid=public._sales_account(); result uuid; chosen text;
begin
 if p_method is null or p_method not in ('yape_demo','plin_demo','transfer_demo','card_demo','bcp_demo','interbank_demo','bbva_demo','scotiabank_demo') then raise exception 'sales_invalid_payment' using errcode='22023';end if;
 result=public.sales_create_order(p_key,p_hash,p_lines,p_contact,p_delivery,p_address,p_cart_revision,p_quote_id);
 select preferred_payment_method into chosen from public.orders where id=result and user_id=actor for update;
 if chosen is not null and chosen<>p_method then raise exception 'sales_idempotency_conflict' using errcode='PT409';end if;
 update public.orders set preferred_payment_method=p_method where id=result and preferred_payment_method is null;
 return result;
end$$;

-- Notices derive from reviewed quotes, without a second notification queue/table.
create function public.sales_quote_notices(p_id uuid default null,p_revision integer default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid=public._sales_account();
begin
 if p_id is not null then
  if p_revision is null then raise exception 'revision_conflict' using errcode='PT409';end if;
  update public.sales_quotes set notification_seen_revision=greatest(notification_seen_revision,p_revision)
   where id=p_id and user_id=actor and revision=p_revision and status in ('quoted','rejected');
 end if;
 return jsonb_build_object('count',(select count(*) from public.sales_quotes where user_id=actor and status in ('quoted','rejected') and revision>notification_seen_revision and (expires_at is null or expires_at>clock_timestamp())),
 'items',(select coalesce(jsonb_agg(to_jsonb(n) order by n.quoted_at desc,n.id),'[]') from
  (select id,revision,version,status,assembly_requested,assembly_base_fee_cents,assembly_fee_cents,quoted_at,review_notes from public.sales_quotes
   where user_id=actor and status in ('quoted','rejected') and revision>notification_seen_revision and (expires_at is null or expires_at>clock_timestamp()) order by quoted_at desc,id limit 20)n));
end$$;
revoke all on function public.sales_save_assembly_tariff(integer,bigint),public.sales_create_order_with_payment(uuid,text,jsonb,jsonb,text,jsonb,integer,uuid,text),public.sales_quote_notices(uuid,integer) from public,anon,authenticated;
grant execute on function public.sales_save_assembly_tariff(integer,bigint),public.sales_create_order_with_payment(uuid,text,jsonb,jsonb,text,jsonb,integer,uuid,text),public.sales_quote_notices(uuid,integer) to authenticated;
