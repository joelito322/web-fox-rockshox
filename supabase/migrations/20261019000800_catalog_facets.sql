-- Read-only facets respect the same RLS as the public catalogue; no privileged bypass.
create function public.catalog_facets(p_category text default null) returns jsonb
language sql stable security invoker set search_path='' as $$
 with available as (
  select c.id,c.brand_id,c.disciplines,v.specs from public.components c
  join public.component_variants v on v.component_id=c.id
  where c.published and v.published and v.selectable and (p_category is null or c.category=p_category)
 ), values_by_key as (
  select distinct e.key,case when jsonb_typeof(e.value)='array' then a.value else e.value end value
  from available c cross join lateral jsonb_each(c.specs) e
  left join lateral jsonb_array_elements(case when jsonb_typeof(e.value)='array' then e.value else '[]'::jsonb end) a on true
  where e.key in('size_label','wheel_bsd_mm','spring_type','crown_type','piston_count','terrain_tags','casing','compound','speed_count','etrto','travel_mm','eye_to_eye_mm','stroke_mm','rotor_diameter_mm','rotor_mount','freehub_standard','shell_standard','spindle_standard','pedal_type','commercial_size')
 ), facets as (
  select key,jsonb_agg(value order by value) options from values_by_key where jsonb_typeof(value) in('string','number','boolean') group by key
 )
 select jsonb_build_object(
  'brands',coalesce((select jsonb_agg(to_jsonb(b) order by b.name) from(select distinct b.id,b.name from public.brands b join available c on c.brand_id=b.id)b),'[]'::jsonb),
  'disciplines',coalesce((select jsonb_agg(d order by d) from(select distinct unnest(disciplines) d from available)t),'[]'::jsonb),
  'specs',coalesce((select jsonb_object_agg(key,options) from facets),'{}'::jsonb)
 );
$$;
revoke all on function public.catalog_facets(text) from public;
grant execute on function public.catalog_facets(text) to anon,authenticated;
