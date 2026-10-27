-- Bounded administration reads. Existing IAM and write contracts remain authoritative.
create function public.admin_catalog_page(p_kind text default 'component',p_search text default '',p_category text default null,p_brand uuid default null,p_status text default '',p_page integer default 0) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare items jsonb; total bigint;
begin
 perform iam.require_permission('catalog.manage');
 if p_kind not in ('component','brand','asset') or p_page<0 or p_page>100000 or length(p_search)>150 or p_status not in ('','published','draft') then raise exception 'invalid_filter' using errcode='22023';end if;
 if p_kind='component' then
  select count(*) into total from public.components c where (p_category is null or c.category=p_category) and (p_brand is null or c.brand_id=p_brand) and (p_status='' or c.published=(p_status='published')) and strpos(lower(c.name),lower(p_search))>0;
  select coalesce(jsonb_agg(to_jsonb(t)),'[]') into items from (select c.*,jsonb_build_object('name',b.name) brands,'[]'::jsonb component_variants,(select count(*) from public.component_variants v where v.component_id=c.id) variant_count from public.components c join public.brands b on b.id=c.brand_id where (p_category is null or c.category=p_category) and (p_brand is null or c.brand_id=p_brand) and (p_status='' or c.published=(p_status='published')) and strpos(lower(c.name),lower(p_search))>0 order by c.name,c.id limit 25 offset p_page*25)t;
 elsif p_kind='brand' then
  select count(*) into total from public.brands b where (p_status='' or b.published=(p_status='published')) and strpos(lower(b.name),lower(p_search))>0;
  select coalesce(jsonb_agg(to_jsonb(t)),'[]') into items from(select b.* from public.brands b where (p_status='' or b.published=(p_status='published')) and strpos(lower(b.name),lower(p_search))>0 order by b.name,b.id limit 25 offset p_page*25)t;
 else
  select count(*) into total from public.visual_assets a where (p_status='' or a.published=(p_status='published')) and strpos(lower(coalesce(a.reference_notes,'')||' '||coalesce(a.generator_key,'')||' '||coalesce(a.storage_path,'')),lower(p_search))>0;
  select coalesce(jsonb_agg(to_jsonb(t)),'[]') into items from(select a.id,a.kind,a.reference_notes,a.published,(select count(*) from public.component_variants v where v.visual_asset_id=a.id) variant_count from public.visual_assets a where (p_status='' or a.published=(p_status='published')) and strpos(lower(coalesce(a.reference_notes,'')||' '||coalesce(a.generator_key,'')||' '||coalesce(a.storage_path,'')),lower(p_search))>0 order by a.reference_notes nulls last,a.id limit 25 offset p_page*25)t;
 end if;
 return jsonb_build_object('items',items,'count',total,'brands',coalesce((select jsonb_agg(to_jsonb(b) order by b.name,b.id) from public.brands b),'[]'));
end $$;
revoke all on function public.admin_catalog_page(text,text,text,uuid,text,integer) from public,anon;
grant execute on function public.admin_catalog_page(text,text,text,uuid,text,integer) to authenticated;

create function public.admin_catalog_detail(p_kind text,p_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 perform iam.require_permission('catalog.manage');
 if p_kind='component' then
  select to_jsonb(c)||jsonb_build_object('brands',jsonb_build_object('name',b.name),'component_variants',coalesce((select jsonb_agg(to_jsonb(v) order by v.label,v.id) from public.component_variants v where v.component_id=c.id),'[]')) into result from public.components c join public.brands b on b.id=c.brand_id where c.id=p_id;
 elsif p_kind='brand' then select to_jsonb(b) into result from public.brands b where b.id=p_id;
 elsif p_kind='asset' then
  select to_jsonb(a)||jsonb_build_object('variants',coalesce((select jsonb_agg(to_jsonb(t)) from(select v.id,v.label,c.name component_name from public.component_variants v join public.components c on c.id=v.component_id where v.visual_asset_id=a.id order by c.name,v.label limit 25)t),'[]')) into result from public.visual_assets a where a.id=p_id;
 else raise exception 'invalid_kind' using errcode='22023';end if;
 if result is null then raise exception 'record_missing' using errcode='P0002';end if;
 return result;
end $$;
revoke all on function public.admin_catalog_detail(text,uuid) from public,anon;
grant execute on function public.admin_catalog_detail(text,uuid) to authenticated;

create function public.admin_user_page(p_search text default '',p_role uuid default null,p_page integer default 0) returns jsonb language plpgsql stable security definer set search_path='' as $$begin
 perform iam.require_permission('users.read');
 if p_page<0 or p_page>100000 or length(p_search)>254 then raise exception 'invalid_filter' using errcode='22023';end if;
 return jsonb_build_object('count',(select count(*) from auth.users u left join iam.user_roles ur on ur.user_id=u.id where strpos(lower(coalesce(u.email,'')),lower(p_search))>0 and (p_role is null or ur.role_id=p_role)),
 'users',coalesce((select jsonb_agg(to_jsonb(t)) from(select u.id,u.email,u.created_at,u.last_sign_in_at,u.email_confirmed_at is not null confirmed,ur.role_id,ur.revision,r.name role_name from auth.users u left join iam.user_roles ur on ur.user_id=u.id left join iam.roles r on r.id=ur.role_id where strpos(lower(coalesce(u.email,'')),lower(p_search))>0 and (p_role is null or ur.role_id=p_role) order by u.created_at desc,u.id limit 25 offset p_page*25)t),'[]'),
 'roles',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'name',r.name) order by r.name,r.id) from iam.roles r),'[]'));
end $$;
revoke all on function public.admin_user_page(text,uuid,integer) from public,anon;
grant execute on function public.admin_user_page(text,uuid,integer) to authenticated;
