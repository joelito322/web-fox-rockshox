-- Read-only plans under Data API roles. Existing catalogue cardinality only.
begin read only;
select set_config('request.jwt.claims',json_build_object('sub', :'user_id', 'role','authenticated')::text,true) as claims \gset
set local role anon;
explain(analyze,buffers,format json)
select c.id,c.name,v.id variant_id
from public.components c
join public.brands b on b.id=c.brand_id
join public.component_variants v on v.component_id=c.id
join public.visual_assets a on a.id=v.visual_asset_id
where c.category='fork' and c.published and b.published
 and v.published and v.selectable and a.published
 and v.specs->>'wheel_bsd_mm'='622' and v.specs->>'spring_type'='air'
order by c.name,c.id,v.id limit 24;
explain(analyze,buffers,format json) select public.catalog_facets('fork');
explain(analyze,buffers,format json) select public.list_preset_families('',null,'downhill',0);
reset role;
set local role authenticated;
explain(analyze,buffers,format json)
select id,name,revision,updated_at from public.builds
where user_id=auth.uid() order by updated_at desc,id limit 24;
reset role;
rollback;
