create function public.admin_preset_page(p_search text default '',p_page integer default 0) returns jsonb language plpgsql stable security definer set search_path='' as $$begin
 perform iam.require_permission('presets.manage');
 if p_page<0 or p_page>100000 or length(p_search)>150 then raise exception 'invalid_filter' using errcode='22023';end if;
 return jsonb_build_object('count',(select count(*) from public.bike_presets p where strpos(lower(p.name||' '||p.label),lower(p_search))>0),'items',coalesce((select jsonb_agg(to_jsonb(t)) from(select p.id,p.name,p.label,p.kind,p.published,p.selectable from public.bike_presets p where strpos(lower(p.name||' '||p.label),lower(p_search))>0 order by p.name,p.id limit 25 offset p_page*25)t),'[]'));
end$$;
create function public.admin_preset_detail(p_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$declare result jsonb;begin
 perform iam.require_permission('presets.manage');
 select to_jsonb(p)||jsonb_build_object('items',coalesce((select jsonb_agg(jsonb_build_object('slot',slot,'variantId',variant_id,'finishId',finish_id,'customColor',custom_color) order by slot) from public.bike_preset_items where preset_id=p.id),'[]')) into result from public.bike_presets p where p.id=p_id;
 if result is null then raise exception 'record_missing' using errcode='P0002';end if;
 return result;
end$$;
create function public.save_admin_preset(p_data jsonb,p_items jsonb,p_expected jsonb) returns uuid language plpgsql security definer set search_path='' as $$declare current_row jsonb;target uuid;begin
 perform iam.lock_authorization();perform iam.require_permission('presets.manage');target=(p_data->>'id')::uuid;
 if target is null then raise exception 'invalid_record' using errcode='22023';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('admin_preset:'||target::text,0));
 perform 1 from public.bike_presets where id=target for update;
 if found then
  current_row=public.admin_preset_detail(target);
  if p_expected is null or current_row is distinct from p_expected then raise exception 'revision_conflict' using errcode='PT409';end if;
 elsif p_expected is not null then raise exception 'revision_conflict' using errcode='PT409';end if;
 return public.save_preset(p_data,p_items);
end$$;
create function public.admin_user_detail(p_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$declare result jsonb;begin
 perform iam.require_permission('users.read');
 select jsonb_build_object('id',u.id,'email',u.email,'created_at',u.created_at,'last_sign_in_at',u.last_sign_in_at,'confirmed',u.email_confirmed_at is not null,'role_id',ur.role_id,'revision',ur.revision,'role_name',r.name) into result from auth.users u left join iam.user_roles ur on ur.user_id=u.id left join iam.roles r on r.id=ur.role_id where u.id=p_id;
 if result is null then raise exception 'record_missing' using errcode='P0002';end if;
 return result;
end$$;
revoke all on function public.admin_preset_page(text,integer),public.admin_preset_detail(uuid),public.save_admin_preset(jsonb,jsonb,jsonb),public.admin_user_detail(uuid) from public,anon;
grant execute on function public.admin_preset_page(text,integer),public.admin_preset_detail(uuid),public.save_admin_preset(jsonb,jsonb,jsonb),public.admin_user_detail(uuid) to authenticated;
