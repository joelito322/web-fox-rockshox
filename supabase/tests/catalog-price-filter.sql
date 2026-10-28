-- Transactional fixtures: no persisted changes to prices, stock or campaigns.
begin;
create temp table price_filter_fixture as
 select o.id offer_id,o.component_id,l.variant_id,c.brand_id
 from public.store_offers o
 join public.store_offer_variants l on l.offer_id=o.id
 join public.components c on c.id=o.component_id
 where o.sku='ATLAS-HB-318-780-BK';
grant select on price_filter_fixture to anon,authenticated;
do $$ begin
 if (select count(*) from price_filter_fixture)<>1 then raise exception 'Missing price fixture';end if;
end $$;
update public.store_offers set base_price_cents=10000,stock_total=0 where id=(select offer_id from price_filter_fixture);
delete from public.promotion_offers where offer_id=(select offer_id from price_filter_fixture);
with promos as (
 insert into public.promotions(name,discount_type,percentage_bps,fixed_discount_cents,currency,starts_at,ends_at,active)
 values
 ('Price filter percent','percentage',2000,null,null,now()-interval '1 hour',now()+interval '1 hour',true),
 ('Price filter fixed','fixed',null,1000,'PEN',now()-interval '1 hour',now()+interval '1 hour',true),
 ('Price filter expired','fixed',null,9000,'PEN',now()-interval '2 hour',now()-interval '1 hour',true),
 ('Price filter future','fixed',null,9000,'PEN',now()+interval '1 hour',now()+interval '2 hour',true),
 ('Price filter inactive','fixed',null,9000,'PEN',now()-interval '1 hour',now()+interval '1 hour',false)
 returning id
) insert into public.promotion_offers(promotion_id,offer_id) select p.id,f.offer_id from promos p cross join price_filter_fixture f;
set local role anon;
do $$ declare target uuid=(select variant_id from price_filter_fixture); offers jsonb; begin
 if not exists(select 1 from public.catalog_price_matches('handlebar',8000,8000) where variant_id=target and unit_cents=8000) then raise exception 'Inclusive bounds / strongest valid promotion / zero stock failed';end if;
 if exists(select 1 from public.catalog_price_matches('handlebar',0,7999) where variant_id=target) then raise exception 'Below range or stacked/expired promotion leaked';end if;
 if exists(select 1 from public.catalog_price_matches('fork',0,1000000) where variant_id=target) then raise exception 'Category isolation failed';end if;
 if not exists(select 1 from public.catalog_price_matches(null,null,8000) where variant_id=target) then raise exception 'All categories / open lower bound failed';end if;
 if not exists(select 1 from public.catalog_price_matches('handlebar',8000,null) where variant_id=target) then raise exception 'Open upper bound failed';end if;
 offers=public.sales_offers(null,array[target]);
 if (offers->0->>'unit_cents')::bigint<>8000 then raise exception 'Checkout price parity failed';end if;
 begin perform public.catalog_price_matches('handlebar',null,null);raise exception 'Unbounded query accepted';exception when sqlstate '22023' then null;end;
 begin perform public.catalog_price_matches('handlebar',-1,8000);raise exception 'Negative bound accepted';exception when sqlstate '22023' then null;end;
 begin perform public.catalog_price_matches('handlebar',9000,8000);raise exception 'Reversed bounds accepted';exception when sqlstate '22023' then null;end;
 begin perform public.catalog_price_matches('handlebar',0,1000000000001);raise exception 'Overflow bound accepted';exception when sqlstate '22023' then null;end;
end $$;
reset role;
update public.component_variants set selectable=false where id=(select variant_id from price_filter_fixture);
do $$begin if exists(select 1 from public.catalog_price_matches('handlebar',0,10000) where variant_id=(select variant_id from price_filter_fixture)) then raise exception 'Retired variant leaked';end if;end$$;
update public.component_variants set selectable=true where id=(select variant_id from price_filter_fixture);
update public.store_offers set active=false where id=(select offer_id from price_filter_fixture);
do $$begin if exists(select 1 from public.catalog_price_matches('handlebar',0,10000) where variant_id=(select variant_id from price_filter_fixture)) then raise exception 'Inactive offer leaked';end if;end$$;
update public.store_offers set active=true where id=(select offer_id from price_filter_fixture);
-- Published versions are immutable: do not rewrite them into draft fixtures.
do $$begin if exists(select 1 from public.catalog_price_matches(null,0,1000000000000) m join public.component_variants v on v.id=m.variant_id join public.components c on c.id=v.component_id join public.brands b on b.id=c.brand_id where not b.published or not c.published or not v.published or not v.selectable) then raise exception 'Non-public choice leaked';end if;end$$;
reset role;
rollback;
