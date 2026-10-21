-- Derived images only: keep the twelve business/IAM tables and revisioned build contract.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('bike-previews','bike-previews',false,262144,array['image/webp']);

create policy public_preset_preview_read on storage.objects for select to anon,authenticated
using(bucket_id='bike-previews'
 and name ~ '^presets/[0-9a-f-]{36}/[0-9a-f]{64}-v1[.]webp$'
 and exists(select 1 from public.bike_presets p where p.id::text=(storage.foldername(name))[2] and p.published and p.selectable));

create policy own_build_preview_read on storage.objects for select to authenticated
using(bucket_id='bike-previews'
 and name ~ '^builds/[0-9a-f-]{36}/[0-9a-f-]{36}/[1-9][0-9]*-v1[.]webp$'
 and (storage.foldername(name))[2]=auth.uid()::text
 and public.has_permission('builds.read_own')
 and exists(select 1 from public.builds b where b.id::text=(storage.foldername(name))[3]
   and b.user_id=auth.uid() and storage.filename(name)=b.revision::text||'-v1.webp'
   and exists(select 1 from public.build_items i where i.build_id=b.id)));

create policy own_build_preview_insert on storage.objects for insert to authenticated
with check(bucket_id='bike-previews'
 and name ~ '^builds/[0-9a-f-]{36}/[0-9a-f-]{36}/[1-9][0-9]*-v1[.]webp$'
 and (storage.foldername(name))[2]=auth.uid()::text
 and public.has_permission('builds.read_own') and public.has_permission('builds.write_own')
 and exists(select 1 from public.builds b where b.id::text=(storage.foldername(name))[3]
   and b.user_id=auth.uid() and storage.filename(name)=b.revision::text||'-v1.webp'
   and exists(select 1 from public.build_items i where i.build_id=b.id)));

create policy own_build_preview_delete on storage.objects for delete to authenticated
using(bucket_id='bike-previews'
 and (storage.foldername(name))[1]='builds' and (storage.foldername(name))[2]=auth.uid()::text
 and public.has_permission('builds.delete_own'));

create policy managed_preset_preview_insert on storage.objects for insert to authenticated
with check(bucket_id='bike-previews'
 and name ~ '^presets/[0-9a-f-]{36}/[0-9a-f]{64}-v1[.]webp$'
 and public.has_permission('presets.manage') and public.has_permission('presets.publish')
 and exists(select 1 from public.bike_presets p where p.id::text=(storage.foldername(name))[2] and p.published and p.selectable));

create policy managed_preset_preview_delete on storage.objects for delete to authenticated
using(bucket_id='bike-previews' and (storage.foldername(name))[1]='presets'
 and public.has_permission('presets.manage') and public.has_permission('presets.publish'));
