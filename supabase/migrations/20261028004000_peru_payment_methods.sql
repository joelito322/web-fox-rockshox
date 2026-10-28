-- Payment channel identities only; all outcomes remain simulated.
-- Historical transfer_demo attempts retain their original identity.
alter table public.payment_attempts drop constraint payment_attempts_method_check;
alter table public.payment_attempts add constraint payment_attempts_method_check
 check(method in ('yape_demo','plin_demo','transfer_demo','card_demo','bcp_demo','interbank_demo','bbva_demo','scotiabank_demo'));

create or replace function public.sales_pay_demo(p_order uuid,p_key uuid,p_method text,p_result text) returns jsonb language plpgsql security definer set search_path='' as $$
declare owner uuid=public._sales_account(); h public.orders; attempt public.payment_attempts; item record; at_time timestamptz;
begin
 if p_key is null or p_method not in ('yape_demo','plin_demo','transfer_demo','card_demo','bcp_demo','interbank_demo','bbva_demo','scotiabank_demo') or p_result not in ('approved','rejected','cancelled') or p_method is null or p_result is null then raise exception 'sales_invalid_payment' using errcode='22023';end if;
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
