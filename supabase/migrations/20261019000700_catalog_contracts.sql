-- Structural validation is enforced remotely, including direct RPC clients.
create function iam.validate_sources(p_sources jsonb) returns void language plpgsql immutable set search_path='' as $$begin
 if p_sources is null or pg_column_size(p_sources)>32768 or not extensions.jsonb_matches_schema($schema${"$schema":"http://json-schema.org/draft-07/schema#","maxItems":50,"type":"array","items":{"type":"object","properties":{"url":{"type":"string","maxLength":2048,"pattern":"^https?:\\/\\/[^\\s]+$"},"consulted_at":{"type":"string","format":"date","pattern":"^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))$"},"note":{"type":["string","null"]},"fields":{"type":"array","items":{"type":"string"}}},"required":["url","consulted_at"],"additionalProperties":false}}$schema$::json,p_sources) then raise exception 'invalid_sources' using errcode='22023';end if;
end$$;
create or replace function iam.validate_variant(p_variant public.component_variants) returns void language plpgsql security definer set search_path='' as $$declare category text;option jsonb;finish_ids text[];begin
 select c.category into strict category from public.components c where c.id=p_variant.component_id;
 perform iam.validate_specs(category,p_variant.specs);
 perform iam.validate_sources(p_variant.sources);
 if not extensions.jsonb_matches_schema($schema${"$schema":"http://json-schema.org/draft-07/schema#","type":"object","properties":{"default_finish_id":{"type":"string"},"custom_color_enabled":{"type":"boolean"},"options":{"minItems":1,"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"label":{"type":"string"},"image_key":{"type":["string","null"]},"material":{"type":"object","properties":{"color":{"type":"string","pattern":"^#[0-9a-f]{6}$"},"metalness":{"type":"number","minimum":0,"maximum":1},"roughness":{"type":"number","minimum":0,"maximum":1}},"required":["color"],"additionalProperties":false}},"required":["id","label","material"],"additionalProperties":false}}},"required":["default_finish_id","custom_color_enabled","options"],"additionalProperties":false}$schema$::json,p_variant.allowed_finishes) then raise exception 'invalid_finishes' using errcode='22023';end if;
 if p_variant.price_reference is not null then
  if jsonb_typeof(p_variant.price_reference)<>'object' or coalesce((p_variant.price_reference->>'amount')::numeric,0)<=0 or coalesce(p_variant.price_reference->>'currency','')!~'^[A-Z]{3}$' or nullif(p_variant.price_reference->>'market','') is null or coalesce(p_variant.price_reference->>'source_url','')!~'^https?://' or nullif(p_variant.price_reference->>'as_of','') is null then raise exception 'invalid_price_reference' using errcode='22023';end if;
  perform (p_variant.price_reference->>'as_of')::date;
 end if;
 if jsonb_typeof(p_variant.allowed_finishes)<>'object' or jsonb_typeof(p_variant.allowed_finishes->'options')<>'array' or jsonb_array_length(p_variant.allowed_finishes->'options') not between 1 and 30 or jsonb_typeof(p_variant.allowed_finishes->'custom_color_enabled')<>'boolean' then raise exception 'invalid_finishes' using errcode='22023';end if;
 finish_ids='{}';
 for option in select value from jsonb_array_elements(p_variant.allowed_finishes->'options') loop
  if nullif(option->>'id','') is null or option->>'id'=any(finish_ids) or nullif(option->>'label','') is null or coalesce(option->'material'->>'color','')!~'^#[0-9A-Fa-f]{6}$' then raise exception 'invalid_finish' using errcode='22023';end if;
  finish_ids=array_append(finish_ids,option->>'id');
 end loop;
 if not coalesce(p_variant.allowed_finishes->>'default_finish_id'=any(finish_ids),false) then raise exception 'invalid_default_finish' using errcode='22023';end if;
 if p_variant.published and p_variant.selectable then
  if not exists(select 1 from public.components c join public.brands b on b.id=c.brand_id where c.id=p_variant.component_id and c.published and b.published) or not exists(select 1 from public.visual_assets a where a.id=p_variant.visual_asset_id and a.published) then raise exception 'publication_dependencies_missing' using errcode='23514';end if;
 end if;
end$$;

create function iam.enforce_sources() returns trigger language plpgsql security definer set search_path='' as $$begin perform iam.validate_sources(new.sources);return new;end$$;
create trigger atlas_component_sources before insert or update on public.components for each row execute function iam.enforce_sources();
create trigger atlas_preset_sources before insert or update on public.bike_presets for each row execute function iam.enforce_sources();
revoke all on function iam.validate_sources(jsonb),iam.enforce_sources() from public,anon,authenticated;
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
   if target.revision<>(item->>'revision')::integer then raise exception 'revision_conflict' using errcode='PT409';end if;
   if exists(select 1 from iam.role_permissions where role_permissions.role_id=target.id and not iam.has_permission(permission_code)) then raise exception 'role_not_grantable' using errcode='42501';end if;
   if not coalesce((item->>'active')::boolean,true) and exists(select 1 from iam.user_roles where user_roles.role_id=target.id) then raise exception 'role_in_use' using errcode='23503';end if;
   update iam.roles set name=btrim(coalesce(item->>'name',target.name)),description=coalesce(item->>'description',target.description),active=coalesce((item->>'active')::boolean,target.active),revision=revision+1,updated_at=now(),updated_by=auth.uid() where id=v_role_id;
  end if;
  delete from iam.role_permissions where role_permissions.role_id=v_role_id;
  insert into iam.role_permissions select v_role_id,code from(select distinct unnest(codes) code) p;
 end loop;
 return public.get_roles_matrix();
end$$;

