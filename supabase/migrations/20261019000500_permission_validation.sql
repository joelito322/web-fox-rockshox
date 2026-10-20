create or replace function iam.validate_permissions(p_codes text[]) returns void language plpgsql security definer set search_path='' as $$declare v_code text;v_required text;begin
 if cardinality(p_codes)>100 then raise exception 'invalid_permissions' using errcode='22023';end if;
 foreach v_code in array p_codes loop
  if not exists(select 1 from iam.permissions where permissions.code=v_code) then raise exception 'invalid_permission' using errcode='22023';end if;
  if not iam.has_permission(v_code) then raise exception 'permission_not_grantable' using errcode='42501';end if;
 end loop;
 for v_code,v_required in select * from(values('builds.write_own','builds.read_own'),('builds.delete_own','builds.read_own'),('catalog.publish','catalog.manage'),('presets.publish','presets.manage'),('users.assign_role','users.read'),('users.invite','users.read'),('users.invite','configurator.use'),('users.invite','builds.read_own'),('users.invite','builds.write_own'),('users.invite','builds.delete_own')) d(code,required) loop
  if v_code=any(p_codes) and not(v_required=any(p_codes)) then raise exception 'permission_dependency_missing' using errcode='22023';end if;
 end loop;
end$$;
revoke all on function iam.validate_permissions(text[]) from public,anon,authenticated;
