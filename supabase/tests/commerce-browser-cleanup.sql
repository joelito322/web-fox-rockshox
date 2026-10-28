-- Only disposable validation accounts; never general-purpose customer deletion.
begin;
select set_config('atlas.cleanup_user',:'user_id',true);
do $$begin
 if exists(select 1 from auth.users where id=current_setting('atlas.cleanup_user')::uuid and email not like 'validation-%@example.invalid') then raise exception 'refusing_non_fixture_cleanup';end if;
end$$;
update public.store_offers o set stock_total=stock_total+t.quantity,revision=revision+1,updated_at=clock_timestamp() from (select i.offer_id,sum(i.quantity)::integer quantity from public.order_items i join public.orders h on h.id=i.order_id where h.user_id=:'user_id'::uuid and h.status in ('confirmed','preparing','ready','delivered') group by i.offer_id)t where o.id=t.offer_id;
delete from public.order_events where order_id in(select id from public.orders where user_id=:'user_id'::uuid);
delete from public.payment_attempts where order_id in(select id from public.orders where user_id=:'user_id'::uuid);
delete from public.order_items where order_id in(select id from public.orders where user_id=:'user_id'::uuid);
delete from public.orders where user_id=:'user_id'::uuid;
delete from public.sales_quotes where user_id=:'user_id'::uuid;
delete from public.promotion_offers where promotion_id in(select id from public.promotions where updated_by=:'user_id'::uuid and name like 'validation-%');
delete from public.promotions where updated_by=:'user_id'::uuid and name like 'validation-%';
delete from public.store_offer_variants where offer_id in(select id from public.store_offers where updated_by=:'user_id'::uuid and sku like 'BROWSER-validation-%');
delete from public.store_offers where updated_by=:'user_id'::uuid and sku like 'BROWSER-validation-%';
delete from public.carts where user_id=:'user_id'::uuid;
commit;
