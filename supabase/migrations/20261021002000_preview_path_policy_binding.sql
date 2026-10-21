-- Bind path predicates to the Storage object, not the preset/build name inside subqueries.
alter policy public_preset_preview_read on storage.objects using(
 bucket_id='bike-previews'
 and name ~ '^presets/[0-9a-f-]{36}/[0-9a-f]{64}-v1[.]webp$'
 and exists(select 1 from public.bike_presets p where p.id::text=(storage.foldername(storage.objects.name))[2] and p.published and p.selectable));

alter policy own_build_preview_read on storage.objects using(
 bucket_id='bike-previews'
 and name ~ '^builds/[0-9a-f-]{36}/[0-9a-f-]{36}/[1-9][0-9]*-v1[.]webp$'
 and (storage.foldername(name))[2]=auth.uid()::text
 and public.has_permission('builds.read_own')
 and exists(select 1 from public.builds b where b.id::text=(storage.foldername(storage.objects.name))[3]
   and b.user_id=auth.uid() and storage.filename(storage.objects.name)=b.revision::text||'-v1.webp'
   and exists(select 1 from public.build_items i where i.build_id=b.id)));

alter policy own_build_preview_insert on storage.objects with check(
 bucket_id='bike-previews'
 and name ~ '^builds/[0-9a-f-]{36}/[0-9a-f-]{36}/[1-9][0-9]*-v1[.]webp$'
 and (storage.foldername(name))[2]=auth.uid()::text
 and public.has_permission('builds.read_own') and public.has_permission('builds.write_own')
 and exists(select 1 from public.builds b where b.id::text=(storage.foldername(storage.objects.name))[3]
   and b.user_id=auth.uid() and storage.filename(storage.objects.name)=b.revision::text||'-v1.webp'
   and exists(select 1 from public.build_items i where i.build_id=b.id)));

alter policy managed_preset_preview_insert on storage.objects with check(
 bucket_id='bike-previews'
 and name ~ '^presets/[0-9a-f-]{36}/[0-9a-f]{64}-v1[.]webp$'
 and public.has_permission('presets.manage') and public.has_permission('presets.publish')
 and exists(select 1 from public.bike_presets p where p.id::text=(storage.foldername(storage.objects.name))[2] and p.published and p.selectable));
