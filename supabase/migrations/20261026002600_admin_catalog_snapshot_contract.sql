-- Require a complete record snapshot for optimistic administrative edits.
create or replace function public.save_admin_catalog(p_kind text,p_data jsonb,p_expected jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare current_row jsonb; target uuid;
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
  if current_row is distinct from p_expected then raise exception 'revision_conflict' using errcode='PT409';end if;
 end if;
 return public.save_catalog(p_kind,p_data);
end $$;
revoke all on function public.save_admin_catalog(text,jsonb,jsonb) from public,anon;
grant execute on function public.save_admin_catalog(text,jsonb,jsonb) to authenticated;
