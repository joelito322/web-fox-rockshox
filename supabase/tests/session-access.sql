-- Temporary API-test identity only. This is not an application bootstrap operation.
begin;
select set_config('atlas.test_session_user', :'user_id', true);
do $$begin
 if not exists(select 1 from auth.users where id=current_setting('atlas.test_session_user')::uuid and email like 'atlas-%@example.invalid') then
  raise exception 'temporary_test_identity_required';
 end if;
end$$;
update iam.user_roles set role_id=(select id from iam.roles where key=:'target_role'), revision=revision+1, assigned_at=now()
where user_id=:'user_id'::uuid;
commit;
