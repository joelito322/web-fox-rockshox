-- Native Auth owns identity; this private schema owns application authorization.
create schema if not exists iam;
revoke all on schema iam from public, anon, authenticated;
create table iam.roles (
 id uuid primary key default gen_random_uuid(), key text not null unique check(length(key) between 1 and 80), name text not null check(length(btrim(name)) between 1 and 80), description text, is_system boolean not null default false, active boolean not null default true, revision integer not null default 1 check(revision>0), created_by uuid references auth.users(id) on delete set null, updated_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table iam.permissions(code text primary key, name text not null, description text not null, area text not null);
create table iam.role_permissions(role_id uuid not null references iam.roles(id) on delete cascade, permission_code text not null references iam.permissions(code), primary key(role_id,permission_code));
create table iam.user_roles(user_id uuid primary key references auth.users(id) on delete cascade, role_id uuid not null references iam.roles(id) on delete restrict, assigned_by uuid references auth.users(id) on delete set null, assigned_at timestamptz not null default now(), revision integer not null default 1 check(revision>0));
create index user_roles_role_idx on iam.user_roles(role_id);
alter table iam.roles enable row level security;
alter table iam.permissions enable row level security;
alter table iam.role_permissions enable row level security;
alter table iam.user_roles enable row level security;
revoke all on all tables in schema iam from public,anon,authenticated;
insert into iam.roles(key,name,is_system) values('user','Usuario',true),('admin','Administrador',true);
insert into iam.permissions values
('configurator.use','Crear y editar montajes','Usar el configurador visual','Montajes'),('builds.read_own','Ver mis bicicletas','Leer montajes propios','Montajes'),('builds.write_own','Guardar mis bicicletas','Guardar montajes propios','Montajes'),('builds.delete_own','Eliminar mis bicicletas','Eliminar montajes propios','Montajes'),
('catalog.manage','Editar catálogo','Gestionar borradores del catálogo','Catálogo'),('catalog.publish','Publicar catálogo','Modificar contenido visible del catálogo','Catálogo'),('presets.manage','Editar bicicletas de referencia','Gestionar composiciones de referencia','Bicicletas de referencia'),('presets.publish','Publicar bicicletas de referencia','Publicar composiciones verificadas','Bicicletas de referencia'),
('users.read','Ver usuarios','Consultar cuentas y roles asignados','Usuarios'),('users.invite','Invitar usuarios','Invitar cuentas con acceso autorizado','Usuarios'),('users.assign_role','Asignar roles','Cambiar el rol de otras cuentas','Usuarios'),('roles.manage','Crear y configurar roles','Administrar roles personalizados y su matriz','Roles');
insert into iam.role_permissions select r.id,p.code from iam.roles r cross join iam.permissions p where r.key='admin' or (r.key='user' and p.code in('configurator.use','builds.read_own','builds.write_own','builds.delete_own'));

create function iam.has_permission(p_code text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from iam.user_roles ur join iam.roles r on r.id=ur.role_id join iam.role_permissions rp on rp.role_id=r.id join auth.users u on u.id=ur.user_id where ur.user_id=auth.uid() and r.active and rp.permission_code=p_code and u.email_confirmed_at is not null and (u.banned_until is null or u.banned_until<now()));
$$;
create function public.has_permission(p_code text) returns boolean language sql stable security definer set search_path='' as $$select iam.has_permission(p_code)$$;
revoke all on function public.has_permission(text) from public,anon; grant execute on function public.has_permission(text) to authenticated;
create function iam.require_permission(p_code text) returns void language plpgsql stable security definer set search_path='' as $$begin if not iam.has_permission(p_code) then raise exception 'permission_denied' using errcode='42501'; end if;end$$;
create function public.get_my_access() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce((select jsonb_build_object('role',jsonb_build_object('id',r.id,'key',r.key,'name',r.name,'revision',r.revision),'permissions',coalesce((select jsonb_agg(rp.permission_code order by rp.permission_code) from iam.role_permissions rp where rp.role_id=r.id),'[]'::jsonb)) from iam.user_roles ur join iam.roles r on r.id=ur.role_id join auth.users u on u.id=ur.user_id where ur.user_id=auth.uid() and r.active and u.email_confirmed_at is not null and(u.banned_until is null or u.banned_until<now())),jsonb_build_object('role',null,'permissions','[]'::jsonb));
$$;
revoke all on function public.get_my_access() from public,anon; grant execute on function public.get_my_access() to authenticated;
create function iam.provision_user() returns trigger language plpgsql security definer set search_path='' as $$begin
 insert into iam.user_roles(user_id,role_id) select new.id,id from iam.roles where key='user';
 if not found then raise exception 'base_role_missing';end if;
 return new;
end$$;
create trigger atlas_provision_user after insert on auth.users for each row execute function iam.provision_user();

create function iam.protect_system_roles() returns trigger language plpgsql security definer set search_path='' as $$declare system_role boolean;begin
 if session_user='postgres' then if tg_op='DELETE' then return old;else return new;end if;end if;
 if tg_table_name='roles' then system_role=old.is_system;else select is_system into system_role from iam.roles where id=old.role_id;end if;
 if system_role then raise exception 'system_role_read_only' using errcode='42501';end if;
 if tg_op='DELETE' then return old;else return new;end if;
end$$;
create trigger atlas_protect_roles before update or delete on iam.roles for each row execute function iam.protect_system_roles();
create trigger atlas_protect_role_permissions before update or delete on iam.role_permissions for each row execute function iam.protect_system_roles();
create function iam.lock_authorization() returns void language plpgsql security definer set search_path='' as $$begin perform 1 from iam.roles where key='admin' for update;end$$;
create function iam.validate_permissions(p_codes text[]) returns void language plpgsql security definer set search_path='' as $$declare code text;required text;begin
 if cardinality(p_codes)>100 then raise exception 'invalid_permissions' using errcode='22023';end if;
 foreach code in array p_codes loop
  if not exists(select 1 from iam.permissions where permissions.code=code) then raise exception 'invalid_permission' using errcode='22023';end if;
  if not iam.has_permission(code) then raise exception 'permission_not_grantable' using errcode='42501';end if;
 end loop;
 for code,required in select * from(values('builds.write_own','builds.read_own'),('builds.delete_own','builds.read_own'),('catalog.publish','catalog.manage'),('presets.publish','presets.manage'),('users.assign_role','users.read'),('users.invite','users.read'),('users.invite','configurator.use'),('users.invite','builds.read_own'),('users.invite','builds.write_own'),('users.invite','builds.delete_own')) d(code,required) loop
  if code=any(p_codes) and not(required=any(p_codes)) then raise exception 'permission_dependency_missing' using errcode='22023';end if;
 end loop;
end$$;
create function public.list_grantable_roles() returns jsonb language plpgsql stable security definer set search_path='' as $$begin
 if not(iam.has_permission('users.assign_role') or iam.has_permission('users.invite') or iam.has_permission('roles.manage')) then raise exception 'permission_denied' using errcode='42501';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'name',r.name) order by r.name) from iam.roles r where r.active and not exists(select 1 from iam.role_permissions rp where rp.role_id=r.id and not iam.has_permission(rp.permission_code))),'[]'::jsonb);
end$$;
revoke all on function public.list_grantable_roles() from public,anon;grant execute on function public.list_grantable_roles() to authenticated;
create function public.get_roles_matrix() returns jsonb language plpgsql stable security definer set search_path='' as $$begin
 perform iam.require_permission('roles.manage');return jsonb_build_object('roles',coalesce((select jsonb_agg(to_jsonb(r)||jsonb_build_object('permissions',coalesce((select jsonb_agg(permission_code order by permission_code) from iam.role_permissions where role_id=r.id),'[]'::jsonb)) order by r.is_system desc,r.name) from iam.roles r),'[]'::jsonb),'permissions',(select jsonb_agg(to_jsonb(p) order by p.area,p.code) from iam.permissions p));
end$$;
revoke all on function public.get_roles_matrix() from public,anon;grant execute on function public.get_roles_matrix() to authenticated;
create function public.save_roles(p_roles jsonb) returns jsonb language plpgsql security definer set search_path='' as $$declare item jsonb;target iam.roles;codes text[];v_role_id uuid;begin
 perform iam.lock_authorization();perform iam.require_permission('roles.manage');
 if coalesce(jsonb_typeof(p_roles),'null')<>'array' or jsonb_array_length(p_roles) not between 1 and 100 then raise exception 'invalid_roles' using errcode='22023';end if;
 for item in select value from jsonb_array_elements(p_roles) loop
  codes=array(select jsonb_array_elements_text(coalesce(item->'permissions','[]'::jsonb)));perform iam.validate_permissions(codes);
  if nullif(item->>'id','') is null then
   v_role_id=gen_random_uuid();insert into iam.roles(id,key,name,description,created_by,updated_by) values(v_role_id,'role_'||replace(v_role_id::text,'-',''),btrim(item->>'name'),item->>'description',auth.uid(),auth.uid());
  else
   v_role_id=(item->>'id')::uuid;select * into strict target from iam.roles where id=v_role_id for update;
   if target.is_system or exists(select 1 from iam.user_roles where user_id=auth.uid() and user_roles.role_id=target.id) then raise exception 'role_protected' using errcode='42501';end if;
   if target.revision<>(item->>'revision')::integer then raise exception 'revision_conflict' using errcode='40001';end if;
   if exists(select 1 from iam.role_permissions where role_permissions.role_id=target.id and not iam.has_permission(permission_code)) then raise exception 'role_not_grantable' using errcode='42501';end if;
   if not coalesce((item->>'active')::boolean,true) and exists(select 1 from iam.user_roles where user_roles.role_id=target.id) then raise exception 'role_in_use' using errcode='23503';end if;
   update iam.roles set name=btrim(coalesce(item->>'name',target.name)),description=coalesce(item->>'description',target.description),active=coalesce((item->>'active')::boolean,target.active),revision=revision+1,updated_at=now(),updated_by=auth.uid() where id=v_role_id;
  end if;
  delete from iam.role_permissions where role_permissions.role_id=v_role_id;
  insert into iam.role_permissions select v_role_id,code from(select distinct unnest(codes) code) p;
 end loop;
 return public.get_roles_matrix();
end$$;
revoke all on function public.save_roles(jsonb) from public,anon;grant execute on function public.save_roles(jsonb) to authenticated;
create function public.delete_role(p_id uuid,p_revision integer) returns void language plpgsql security definer set search_path='' as $$declare target iam.roles;begin
 perform iam.lock_authorization();perform iam.require_permission('roles.manage');select * into strict target from iam.roles where id=p_id for update;
 if target.is_system or target.revision<>p_revision then raise exception 'role_protected_or_changed' using errcode='40001';end if;
 if exists(select 1 from iam.user_roles where role_id=p_id) then raise exception 'role_in_use' using errcode='23503';end if;
 if exists(select 1 from iam.role_permissions where role_id=p_id and not iam.has_permission(permission_code)) then raise exception 'role_not_grantable' using errcode='42501';end if;
 delete from iam.roles where id=p_id;
end$$;
revoke all on function public.delete_role(uuid,integer) from public,anon;grant execute on function public.delete_role(uuid,integer) to authenticated;
create function public.assign_user_role(p_user_id uuid,p_role_id uuid,p_expected_revision integer) returns jsonb language plpgsql security definer set search_path='' as $$declare old_role iam.user_roles;begin
 perform iam.lock_authorization();perform iam.require_permission('users.assign_role');
 if p_user_id=auth.uid() then raise exception 'self_assignment_forbidden' using errcode='42501';end if;
 select * into strict old_role from iam.user_roles where user_id=p_user_id for update;
 if old_role.revision<>p_expected_revision then raise exception 'revision_conflict' using errcode='40001';end if;
 if not exists(select 1 from iam.roles where id=p_role_id and active) or exists(select 1 from iam.role_permissions where role_id=p_role_id and not iam.has_permission(permission_code)) or exists(select 1 from iam.role_permissions where role_id=old_role.role_id and not iam.has_permission(permission_code)) then raise exception 'role_not_grantable' using errcode='42501';end if;
 update iam.user_roles set role_id=p_role_id,revision=revision+1,assigned_by=auth.uid(),assigned_at=now() where user_id=p_user_id;
 if not exists(select 1 from iam.user_roles ur join iam.roles r on r.id=ur.role_id join auth.users u on u.id=ur.user_id where r.key='admin' and r.active and u.email_confirmed_at is not null and(u.banned_until is null or u.banned_until<now())) then raise exception 'last_administrator_required' using errcode='23514';end if;
 return jsonb_build_object('user_id',p_user_id,'role_id',p_role_id,'revision',old_role.revision+1);
end$$;
revoke all on function public.assign_user_role(uuid,uuid,integer) from public,anon;grant execute on function public.assign_user_role(uuid,uuid,integer) to authenticated;
create function public.admin_list_users(p_search text default '',p_page integer default 0) returns jsonb language plpgsql stable security definer set search_path='' as $$begin
 perform iam.require_permission('users.read');if length(p_search)>254 or p_page<0 then raise exception 'invalid_filter' using errcode='22023';end if;
 return jsonb_build_object('count',(select count(*) from auth.users u where strpos(lower(coalesce(u.email,'')),lower(p_search))>0),'users',coalesce((select jsonb_agg(to_jsonb(t)) from(select u.id,u.email,u.created_at,u.last_sign_in_at,(u.email_confirmed_at is not null) confirmed,ur.role_id,ur.revision,r.name role_name from auth.users u left join iam.user_roles ur on ur.user_id=u.id left join iam.roles r on r.id=ur.role_id where strpos(lower(coalesce(u.email,'')),lower(p_search))>0 order by u.created_at desc,u.id limit 25 offset p_page*25)t),'[]'::jsonb));
end$$;
revoke all on function public.admin_list_users(text,integer) from public,anon;grant execute on function public.admin_list_users(text,integer) to authenticated;
create function public.check_invitation(p_role_id uuid) returns void language plpgsql stable security definer set search_path='' as $$begin
 perform iam.require_permission('users.invite');
 if exists(select 1 from iam.role_permissions rp join iam.roles r on r.id=rp.role_id where r.key='user' and not iam.has_permission(rp.permission_code)) then raise exception 'base_permissions_required' using errcode='42501';end if;
 if not exists(select 1 from iam.roles where id=p_role_id and active) or exists(select 1 from iam.role_permissions where role_id=p_role_id and not iam.has_permission(permission_code)) then raise exception 'role_not_grantable' using errcode='42501';end if;
 if not exists(select 1 from iam.roles where id=p_role_id and key='user') then perform iam.require_permission('users.assign_role');end if;
end$$;
revoke all on function public.check_invitation(uuid) from public,anon;grant execute on function public.check_invitation(uuid) to authenticated;
revoke all on all functions in schema iam from public,anon,authenticated;
