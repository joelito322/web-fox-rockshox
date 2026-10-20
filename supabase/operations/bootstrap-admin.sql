-- Controlled one-time operation; never exposed through Data API or public signup.
-- Run only through scripts/bootstrap-admin.mjs with the approved email.
begin;
select set_config('atlas.bootstrap_email', :'email', true);
select iam.lock_authorization();
do $$
declare v_user uuid; v_role uuid;
begin
 select id into v_user from auth.users
 where lower(email)=lower(current_setting('atlas.bootstrap_email'))
 and email_confirmed_at is not null and (banned_until is null or banned_until<now());
 if v_user is null then raise exception 'A confirmed, enabled Auth account is required'; end if;
 select id into strict v_role from iam.roles where key='admin' and active;
 if exists(select 1 from iam.user_roles where role_id=v_role and user_id=v_user) then return; end if;
 if exists(select 1 from iam.user_roles where role_id=v_role) then
  raise exception 'An administrator already exists; use authorized account administration';
 end if;
 update iam.user_roles set role_id=v_role, revision=revision+1, assigned_at=now(), assigned_by=null where user_id=v_user;
 if not found then raise exception 'The account has no provisioned application role'; end if;
end $$;
commit;
