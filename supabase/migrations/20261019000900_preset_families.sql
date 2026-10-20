-- Group bicycle versions before paginating: M/L never create duplicated family cards.
-- Invoker privileges preserve public RLS, including each frame used for discipline filters.
create function public.list_preset_families(p_search text default '',p_brand uuid default null,p_discipline text default null,p_page integer default 0) returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb;
begin
 if p_page<0 or length(p_search)>150 or(p_discipline is not null and p_discipline not in('enduro','downhill')) then raise exception 'invalid_filter' using errcode='22023';end if;
 with available as (
  select p.*,b.name brand_name from public.bike_presets p join public.brands b on b.id=p.brand_id
  where p.published and p.selectable
  and(p_brand is null or p.brand_id=p_brand)
  and(strpos(lower(p.name||' '||b.name),lower(p_search))>0)
  and(p_discipline is null or exists(select 1 from public.bike_preset_items i join public.component_variants v on v.id=i.variant_id join public.components c on c.id=v.component_id where i.preset_id=p.id and i.slot='frame' and p_discipline=any(c.disciplines)))
 ), families as (
  select brand_id,brand_name,family_key,kind,min(name) name,min(image_key) image_key,
  jsonb_agg(jsonb_build_object('id',id,'label',label,'model_year',model_year) order by label,id) versions
  from available group by brand_id,brand_name,family_key,kind
 ), page as(select * from families order by name,brand_id,family_key,kind limit 24 offset p_page*24)
 select jsonb_build_object('count',(select count(*) from families),'families',coalesce((select jsonb_agg(to_jsonb(page) order by name,brand_id,family_key,kind) from page),'[]'::jsonb)) into result;
 return result;
end$$;
revoke all on function public.list_preset_families(text,uuid,text,integer) from public;
grant execute on function public.list_preset_families(text,uuid,text,integer) to anon,authenticated;
