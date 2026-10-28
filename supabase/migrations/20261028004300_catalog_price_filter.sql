-- Price discovery uses the same discount authority as checkout, before pagination.
-- No stock lookup or private order data is needed for a price filter.
create function public.catalog_price_matches(
  p_category text default null,
  p_min_cents bigint default null,
  p_max_cents bigint default null
) returns table(variant_id uuid, unit_cents bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if (p_min_cents is null and p_max_cents is null)
    or p_min_cents < 0 or p_max_cents < 0
    or p_min_cents > 1000000000000 or p_max_cents > 1000000000000
    or p_min_cents > p_max_cents then
    raise exception 'catalog_invalid_price_range' using errcode='22023';
  end if;
  return query
    with prices as materialized (
      select o.id, o.component_id, o.base_price_cents - coalesce((
        select public._sales_discount(o.base_price_cents, p)
        from public.promotions p
        join public.promotion_offers po on po.promotion_id=p.id
        where po.offer_id=o.id and p.active
          and p.starts_at<=statement_timestamp() and p.ends_at>statement_timestamp()
        order by public._sales_discount(o.base_price_cents,p) desc,p.id limit 1
      ),0) as amount
      from public.store_offers o
      join public.components c on c.id=o.component_id and c.published
      join public.brands b on b.id=c.brand_id and b.published
      where o.active and o.currency='PEN'
        and (p_category is null or c.category::text=p_category)
    )
    select v.id, min(pr.amount)::bigint
    from prices pr
    join public.store_offer_variants l on l.offer_id=pr.id
    join public.component_variants v on v.id=l.variant_id
      and v.component_id=pr.component_id and v.published and v.selectable
    where pr.amount>0
      and (p_min_cents is null or pr.amount>=p_min_cents)
      and (p_max_cents is null or pr.amount<=p_max_cents)
    group by v.id order by v.id;
end;
$$;
revoke all on function public.catalog_price_matches(text,bigint,bigint) from public;
grant execute on function public.catalog_price_matches(text,bigint,bigint) to anon,authenticated;
