-- Standalone remote regression: all identities, roles and changes roll back.
-- Run as the database owner using ON_ERROR_STOP; no pre-existing user is modified.
begin;
do $$declare actor uuid=gen_random_uuid();target uuid=gen_random_uuid();editor uuid=gen_random_uuid();begin
 insert into auth.users(id,email,email_confirmed_at) values
 (actor,'atlas-iam-revision-'||actor||'@example.invalid',now()),
 (target,'atlas-iam-revision-'||target||'@example.invalid',now());
 update iam.user_roles set role_id=(select id from iam.roles where key='admin') where user_id=actor;
 insert into iam.roles(id,key,name) values(editor,'test_revision_'||replace(editor::text,'-',''),'Revision regression');
 perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
 perform set_config('atlas.revision_role',editor::text,true);
 perform set_config('atlas.revision_target',target::text,true);
end$$;
set local role authenticated;
do $$declare editor uuid=current_setting('atlas.revision_role')::uuid;target uuid=current_setting('atlas.revision_target')::uuid;role_data jsonb;result jsonb;begin
 role_data=jsonb_build_object('id',editor,'name','Revision regression','permissions','[]'::jsonb);
 -- Missing and explicit NULL revisions must both be terminal conflicts.
 begin perform public.save_roles(jsonb_build_array(role_data));raise exception 'missing_role_revision_accepted';exception when sqlstate 'PT409' then null;end;
 begin perform public.save_roles(jsonb_build_array(role_data||'{"revision":null}'));raise exception 'null_role_revision_accepted';exception when sqlstate 'PT409' then null;end;
 begin perform public.delete_role(editor,null);raise exception 'null_delete_revision_accepted';exception when sqlstate 'PT409' then null;end;
 begin perform public.assign_user_role(target,editor,null);raise exception 'null_assignment_revision_accepted';exception when sqlstate 'PT409' then null;end;
 -- A later NULL revision must roll back earlier changes in the same batch.
 begin perform public.save_roles(jsonb_build_array(role_data||'{"revision":1}',role_data||'{"revision":null}'));raise exception 'null_revision_batch_accepted';exception when sqlstate 'PT409' then null;end;
 result=public.get_roles_matrix();
 if not exists(select 1 from jsonb_array_elements(result->'roles') r where (r->>'id')::uuid=editor and (r->>'revision')::integer=1) then raise exception 'failed_batch_did_not_rollback';end if;
 -- Valid revisions still work; stale ones must not overwrite their successors.
 result=public.save_roles(jsonb_build_array(role_data||'{"revision":1}'));
 if not exists(select 1 from jsonb_array_elements(result->'roles') r where (r->>'id')::uuid=editor and (r->>'revision')::integer=2) then raise exception 'valid_role_save_failed';end if;
 begin perform public.save_roles(jsonb_build_array(role_data||'{"revision":1}'));raise exception 'stale_role_revision_accepted';exception when sqlstate 'PT409' then null;end;
 result=public.assign_user_role(target,editor,1);
 if (result->>'revision')::integer<>2 then raise exception 'valid_assignment_failed';end if;
 begin perform public.assign_user_role(target,editor,1);raise exception 'stale_assignment_revision_accepted';exception when sqlstate 'PT409' then null;end;
 begin perform public.delete_role(editor,1);raise exception 'stale_delete_revision_accepted';exception when sqlstate 'PT409' then null;end;
 -- A role in use remains protected even with a valid revision.
 begin perform public.delete_role(editor,2);raise exception 'used_role_deleted';exception when foreign_key_violation then null;end;
end$$;
reset role;
do $$begin
 update iam.user_roles set role_id=(select id from iam.roles where key='user') where user_id=current_setting('atlas.revision_target')::uuid;
end$$;
set local role authenticated;
select public.delete_role(current_setting('atlas.revision_role')::uuid,2);
reset role;
do $$begin
 if exists(select 1 from iam.roles where id=current_setting('atlas.revision_role')::uuid) then raise exception 'valid_delete_failed';end if;
 raise notice 'PASS IAM revision NULL/missing/stale rejection, valid save/assign/delete and role-in-use protection';
end$$;
rollback;
