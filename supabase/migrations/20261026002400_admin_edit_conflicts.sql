-- Keep published resources unchanged; add relation navigation and optimistic edit checks.
create or replace function public.admin_catalog_detail(p_kind text,p_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 perform iam.require_permission('catalog.manage');
 if p_kind='component' then
  select to_jsonb(c)||jsonb_build_object('brands',jsonb_build_object('name',b.name),'component_variants',coalesce((select jsonb_agg(to_jsonb(v) order by v.label,v.id) from public.component_variants v where v.component_id=c.id),'[]')) into result from public.components c join public.brands b on b.id=c.brand_id where c.id=p_id;
 elsif p_kind='brand' then select to_jsonb(b) into result from public.brands b where b.id=p_id;
 elsif p_kind='asset' then
  select to_jsonb(a)||jsonb_build_object('variants',coalesce((select jsonb_agg(to_jsonb(t)) from(select v.id,v.label,v.component_id,c.name component_name from public.component_variants v join public.components c on c.id=v.component_id where v.visual_asset_id=a.id order by c.name,v.label limit 25)t),'[]')) into result from public.visual_assets a where a.id=p_id;
 else raise exception 'invalid_kind' using errcode='22023';end if;
 if result is null then raise exception 'record_missing' using errcode='P0002';end if;
 return result;
end $$;
revoke all on function public.admin_catalog_detail(text,uuid) from public,anon;
grant execute on function public.admin_catalog_detail(text,uuid) to authenticated;


create function public.save_admin_catalog(p_kind text,p_data jsonb,p_expected jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare current_row jsonb; expected_row jsonb; target uuid;
begin
 perform iam.lock_authorization(); perform iam.require_permission('catalog.manage');
 target=(p_data->>'id')::uuid;
 if target is null then raise exception 'invalid_record' using errcode='22023'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('admin_catalog:'||target::text,0));
 if p_kind='brand' then select to_jsonb(b) into current_row from public.brands b where id=target for update;
 elsif p_kind='component' then select to_jsonb(c) into current_row from public.components c where id=target for update;
 elsif p_kind='variant' then select to_jsonb(v) into current_row from public.component_variants v where id=target for update;
 else raise exception 'invalid_kind' using errcode='22023'; end if;
 if p_expected is null then
  if current_row is not null then raise exception 'revision_conflict' using errcode='PT409';end if;
 else
  if current_row is null or jsonb_typeof(p_expected)<>'object' then raise exception 'revision_conflict' using errcode='PT409';end if;
  select jsonb_object_agg(e.key,current_row->e.key) into expected_row from jsonb_each(p_expected)e;
  if expected_row is distinct from p_expected then raise exception 'revision_conflict' using errcode='PT409';end if;
 end if;
 return public.save_catalog(p_kind,p_data);
end $$;
revoke all on function public.save_admin_catalog(text,jsonb,jsonb) from public,anon;
grant execute on function public.save_admin_catalog(text,jsonb,jsonb) to authenticated;
