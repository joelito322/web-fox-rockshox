-- NULL revisions must conflict, including direct RPC clients; preserve existing IAM contracts.
create or replace function public.save_roles(p_roles jsonb) returns jsonb language plpgsql security definer set search_path='' as $$declare item jsonb;target iam.roles;codes text[];v_role_id uuid;begin
 perform iam.lock_authorization();perform iam.require_permission('roles.manage');
 if coalesce(jsonb_typeof(p_roles),'null')<>'array' or jsonb_array_length(p_roles) not between 1 and 100 then raise exception 'invalid_roles' using errcode='22023';end if;
 for item in select value from jsonb_array_elements(p_roles) loop
  codes=array(select jsonb_array_elements_text(coalesce(item->'permissions','[]'::jsonb)));perform iam.validate_permissions(codes);
  if nullif(item->>'id','') is null then
   v_role_id=gen_random_uuid();insert into iam.roles(id,key,name,description,active,created_by,updated_by) values(v_role_id,'role_'||replace(v_role_id::text,'-',''),btrim(item->>'name'),item->>'description',coalesce((item->>'active')::boolean,true),auth.uid(),auth.uid());
  else
   v_role_id=(item->>'id')::uuid;select * into strict target from iam.roles where id=v_role_id for update;
   if target.is_system or exists(select 1 from iam.user_roles where user_id=auth.uid() and user_roles.role_id=target.id) then raise exception 'role_protected' using errcode='42501';end if;
   if target.revision is distinct from (item->>'revision')::integer then raise exception 'revision_conflict' using errcode='PT409';end if;
   if exists(select 1 from iam.role_permissions where role_permissions.role_id=target.id and not iam.has_permission(permission_code)) then raise exception 'role_not_grantable' using errcode='42501';end if;
   if not coalesce((item->>'active')::boolean,true) and exists(select 1 from iam.user_roles where user_roles.role_id=target.id) then raise exception 'role_in_use' using errcode='23503';end if;
   update iam.roles set name=btrim(coalesce(item->>'name',target.name)),description=coalesce(item->>'description',target.description),active=coalesce((item->>'active')::boolean,target.active),revision=revision+1,updated_at=now(),updated_by=auth.uid() where id=v_role_id;
  end if;
  delete from iam.role_permissions where role_permissions.role_id=v_role_id;
  insert into iam.role_permissions select v_role_id,code from(select distinct unnest(codes) code) p;
 end loop;
 return public.get_roles_matrix();
end$$;


create or replace function public.delete_role(p_id uuid,p_revision integer) returns void language plpgsql security definer set search_path='' as $$declare target iam.roles;begin
 perform iam.lock_authorization();perform iam.require_permission('roles.manage');select * into strict target from iam.roles where id=p_id for update;
 if target.is_system or target.revision is distinct from p_revision then raise exception 'role_protected_or_changed' using errcode='PT409';end if;
 if exists(select 1 from iam.user_roles where role_id=p_id) then raise exception 'role_in_use' using errcode='23503';end if;
 if exists(select 1 from iam.role_permissions where role_id=p_id and not iam.has_permission(permission_code)) then raise exception 'role_not_grantable' using errcode='42501';end if;
 delete from iam.roles where id=p_id;
end$$;

create or replace function public.assign_user_role(p_user_id uuid,p_role_id uuid,p_expected_revision integer) returns jsonb language plpgsql security definer set search_path='' as $$declare old_role iam.user_roles;begin
 perform iam.lock_authorization();perform iam.require_permission('users.assign_role');
 if p_user_id=auth.uid() then raise exception 'self_assignment_forbidden' using errcode='42501';end if;
 select * into strict old_role from iam.user_roles where user_id=p_user_id for update;
 if old_role.revision is distinct from p_expected_revision then raise exception 'revision_conflict' using errcode='PT409';end if;
 if not exists(select 1 from iam.roles where id=p_role_id and active) or exists(select 1 from iam.role_permissions where role_id=p_role_id and not iam.has_permission(permission_code)) or exists(select 1 from iam.role_permissions where role_id=old_role.role_id and not iam.has_permission(permission_code)) then raise exception 'role_not_grantable' using errcode='42501';end if;
 update iam.user_roles set role_id=p_role_id,revision=revision+1,assigned_by=auth.uid(),assigned_at=now() where user_id=p_user_id;
 if not exists(select 1 from iam.user_roles ur join iam.roles r on r.id=ur.role_id join auth.users u on u.id=ur.user_id where r.key='admin' and r.active and u.email_confirmed_at is not null and(u.banned_until is null or u.banned_until<now())) then raise exception 'last_administrator_required' using errcode='23514';end if;
 return jsonb_build_object('user_id',p_user_id,'role_id',p_role_id,'revision',old_role.revision+1);
end$$;

