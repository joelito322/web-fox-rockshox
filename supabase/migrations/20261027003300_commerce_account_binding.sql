-- Bind asynchronous client intent to its originating account, in addition to JWT/RLS.
create or replace function public._sales_account() returns uuid language plpgsql security definer set search_path='' as $$
declare expected text=coalesce(nullif(current_setting('request.headers',true),''),'{}')::jsonb->>'x-atlas-account';
begin
 if expected is not null and expected is distinct from auth.uid()::text then raise exception 'sales_account_changed' using errcode='42501';end if;
 if not exists(select 1 from auth.users u join iam.user_roles ur on ur.user_id=u.id join iam.roles r on r.id=ur.role_id where u.id=auth.uid() and u.email_confirmed_at is not null and (u.banned_until is null or u.banned_until<clock_timestamp()) and r.active) then
 raise exception 'sales_account_disabled' using errcode='42501';end if;return auth.uid();
end$$;
