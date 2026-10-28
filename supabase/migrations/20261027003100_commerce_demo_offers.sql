-- Deliberately illustrative PEN prices/quantities, never market quotations.
-- Stable identities: reruns must not overwrite staff price/stock edits.
insert into public.store_offers(id,sku,component_id,label,commercial_identity,unit_of_sale,base_price_cents,stock_total,active)
select distinct on (identity) md5('atlas-demo-offer-v1:'||identity::text)::uuid,'DEMO-'||upper(left(md5(identity::text),20)),component_id,label,identity,unit,
 case category when 'frame' then 900000 when 'fork' then 550000 when 'shock' then 240000 when 'brake' then 90000 when 'rim' then 40000 when 'hub' then 65000 when 'tire' then 22000 when 'rotor' then 18000 when 'cassette' then 55000 when 'rear_derailleur' then 80000 when 'crankset' then 60000 when 'bottom_bracket' then 15000 when 'pedals' then 20000 when 'handlebar' then 30000 when 'stem' then 25000 when 'seatpost' then 50000 when 'saddle' then 18000 else 10000 end,
 12,true
from (select v.component_id,b.name||' '||c.name||' · '||v.label||' · '||(f->>'label') label,c.category,public._sales_identity(v.id,f->>'id') identity,
 case when c.category='pedals' then 'pair' when c.category in ('crankset','rear_derailleur') then 'set' else 'unit' end unit
 from public.component_variants v join public.components c on c.id=v.component_id join public.brands b on b.id=c.brand_id cross join lateral jsonb_array_elements(v.allowed_finishes->'options') f
 where v.published and v.selectable and c.published and b.published and v.representation<>'generic') s
where identity is not null order by identity,label on conflict do nothing;
insert into public.store_offer_variants(variant_id,finish_id,offer_id)
 select v.id,f->>'id',md5('atlas-demo-offer-v1:'||public._sales_identity(v.id,f->>'id')::text)::uuid
 from public.component_variants v cross join lateral jsonb_array_elements(v.allowed_finishes->'options') f
 join public.store_offers o on o.id=md5('atlas-demo-offer-v1:'||public._sales_identity(v.id,f->>'id')::text)::uuid
 where v.published and v.selectable and v.representation<>'generic' on conflict do nothing;
