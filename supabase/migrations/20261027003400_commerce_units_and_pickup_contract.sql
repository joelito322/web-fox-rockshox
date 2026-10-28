-- Scope supports individual items, pedal pairs and documented included assemblies only.
create function public._sales_unit_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare category text; expected text;
begin
 select c.category into strict category from public.components c where c.id=new.component_id;
 expected=case when category='pedals' then 'pair' when category in ('crankset','rear_derailleur') then 'set' else 'unit' end;
 if new.unit_of_sale<>expected then raise exception 'sales_unit_mismatch' using errcode='22023';end if;
 if tg_op='UPDATE' and (new.commercial_identity is distinct from old.commercial_identity or new.component_id<>old.component_id or new.sku<>old.sku or new.unit_of_sale<>old.unit_of_sale) and exists(select 1 from public.store_offer_variants where offer_id=old.id) then raise exception 'sales_identity_in_use' using errcode='22023';end if;
 return new;
end$$;
revoke all on function public._sales_unit_guard() from public,anon,authenticated;
create trigger sales_unit_guard before insert or update of component_id,commercial_identity,sku,unit_of_sale on public.store_offers for each row execute function public._sales_unit_guard();

create or replace function public.sales_summary(p_lines jsonb,p_contact jsonb,p_delivery text,p_address jsonb,p_quote_id uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare owner uuid=public._sales_account(); lines jsonb; quote public.sales_quotes; result jsonb; fee bigint=0; assembly bigint=0; total bigint;
begin
 perform public._sales_contact(p_contact,p_delivery,p_address);
 if p_quote_id is not null then
  select * into quote from public.sales_quotes where id=p_quote_id and user_id=owner;
  if not found or quote.status<>'quoted' or quote.expires_at<=clock_timestamp() then raise exception 'sales_quote_expired' using errcode='PT409';end if;
  if quote.contact_snapshot is distinct from p_contact or quote.delivery_snapshot is distinct from p_address or quote.delivery_method<>p_delivery then raise exception 'sales_quote_changed' using errcode='PT409';end if;
  lines=quote.merchandise_snapshot;fee=quote.delivery_fee_cents;assembly=quote.assembly_fee_cents;
 else
  if p_delivery<>'pickup' then raise exception 'sales_quote_required' using errcode='22023';end if;fee=(public.sales_policy()->>'pickup_fee_cents')::bigint;
  lines=public._sales_price_lines(public._sales_snapshot(p_lines,clock_timestamp()));
 end if;
 select sum((x->>'subtotal_cents')::bigint) into total from jsonb_array_elements(lines) x;
 result=jsonb_build_object('lines',lines,'currency','PEN','assembly_fee_cents',assembly,'delivery_fee_cents',fee,'total_cents',total+assembly+fee,'contact',p_contact,'delivery',p_delivery,'address',p_address,'quote_id',p_quote_id);
 return result||jsonb_build_object('hash',public._sales_hash(result));
end$$;
