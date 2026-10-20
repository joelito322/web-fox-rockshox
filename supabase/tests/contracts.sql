begin;
select set_config('atlas.test_a', :'user_a', true),set_config('atlas.test_b', :'user_b', true);
-- Fixtures are rolled back; no test component is published outside this transaction.
insert into public.brands(id,name,slug,published) values('80000000-0000-4000-8000-000000000001','PRUEBA TEMPORAL','atlas-test',true);
insert into public.components(id,brand_id,name,slug,category,published) values('80000000-0000-4000-8000-000000000002','80000000-0000-4000-8000-000000000001','PRUEBA TEMPORAL','atlas-test-fork','fork',true);
insert into public.visual_assets(id,kind,generator_key,manifest,published) values('80000000-0000-4000-8000-000000000003','procedural','atlas-bike-v1','{"manifest_version":1,"units":"meters","origin":"bottom_bracket","parameters":{},"anchors":{},"paintable_nodes":[],"selectable_nodes":[]}',true);
insert into public.component_variants(id,component_id,label,specs,allowed_finishes,visual_asset_id,representation,published) values('80000000-0000-4000-8000-000000000004','80000000-0000-4000-8000-000000000002','Test','{"travel_mm":170}','{"default_finish_id":"black","custom_color_enabled":true,"options":[{"id":"black","label":"Negro","material":{"color":"#111111"}}]}','80000000-0000-4000-8000-000000000003','generic',true);
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('atlas.test_a'),'role','authenticated')::text,true);
select public.save_build('80000000-0000-4000-8000-000000000005',0,'{"schemaVersion":1,"name":"Test","items":[{"slot":"fork","variantId":"80000000-0000-4000-8000-000000000004","finishId":"black","customColor":"#aabbcc"}]}');
do $$begin
 if not exists(select 1 from public.build_items where build_id='80000000-0000-4000-8000-000000000005' and custom_color='#AABBCC') then raise exception 'color_not_normalized';end if;
 begin perform public.save_build('80000000-0000-4000-8000-000000000005',1,'{"schemaVersion":1,"name":"Test","items":[{"slot":"frame","variantId":"80000000-0000-4000-8000-000000000004","finishId":"black","customColor":null}]}');raise exception 'category_bypass';exception when invalid_parameter_value then null;end;
 begin insert into public.build_items(build_id,slot,variant_id,finish_id) values('80000000-0000-4000-8000-000000000005','fork','80000000-0000-4000-8000-000000000004','black');raise exception 'direct_item_bypass';exception when insufficient_privilege then null;end;
end$$;
reset role;
update public.component_variants set selectable=false where id='80000000-0000-4000-8000-000000000004';
set local role authenticated;
select public.save_build('80000000-0000-4000-8000-000000000005',1,'{"schemaVersion":1,"name":"Conservar retirada","items":[{"slot":"fork","variantId":"80000000-0000-4000-8000-000000000004","finishId":"black","customColor":"#AABBCC"}]}');
do $$begin
 begin perform public.save_build('80000000-0000-4000-8000-000000000006',0,'{"schemaVersion":1,"name":"Copia no permitida","items":[{"slot":"fork","variantId":"80000000-0000-4000-8000-000000000004","finishId":"black","customColor":null}]}');raise exception 'retired_copy_bypass';exception when check_violation then null;end;
end$$;
reset role;
-- Test a coherent custom role that can rename but cannot create/edit a configuration.
insert into iam.roles(id,key,name) values('80000000-0000-4000-8000-000000000007','test_rename','Prueba renombrado');
insert into iam.role_permissions values('80000000-0000-4000-8000-000000000007','builds.read_own'),('80000000-0000-4000-8000-000000000007','builds.write_own');
update iam.user_roles set role_id='80000000-0000-4000-8000-000000000007' where user_id=current_setting('atlas.test_a')::uuid;
set local role authenticated;
select public.save_build('80000000-0000-4000-8000-000000000005',2,'{"schemaVersion":1,"name":"Solo renombrada","items":[{"slot":"fork","variantId":"80000000-0000-4000-8000-000000000004","finishId":"black","customColor":"#AABBCC"}]}');
do $$begin
 begin perform public.save_build('80000000-0000-4000-8000-000000000008',0,'{"schemaVersion":1,"name":"Sin permiso","items":[]}');raise exception 'create_permission_bypass';exception when insufficient_privilege then null;end;
 begin perform public.save_build('80000000-0000-4000-8000-000000000005',3,'{"schemaVersion":1,"name":"Cambio no permitido","items":[]}');raise exception 'item_permission_bypass';exception when insufficient_privilege then null;end;
end$$;
reset role;
update iam.user_roles set role_id=(select id from iam.roles where key='admin') where user_id=current_setting('atlas.test_a')::uuid;
set local role authenticated;
do $$begin
 begin perform public.save_roles('[{"name":"Invitador inválido","permissions":["users.invite"]}]');raise exception 'permission_dependency_bypass';exception when invalid_parameter_value then null;end;
 begin perform public.save_roles(jsonb_build_array(jsonb_build_object('id',(public.get_my_access()->'role'->>'id'),'revision',1,'name','Modificar sistema','permissions','[]'::jsonb)));raise exception 'system_role_bypass';exception when insufficient_privilege then null;end;
end$$;
reset role;
do $$begin
 begin update public.component_variants set specs='{"travel_mm":180}' where id='80000000-0000-4000-8000-000000000004';raise exception 'immutable_variant_bypass';exception when check_violation then null;end;
 begin update public.components set category='frame' where id='80000000-0000-4000-8000-000000000002';raise exception 'immutable_category_bypass';exception when check_violation then null;end;
 raise notice 'PASS color, slots, atomicity, retired variants, role dependencies, rename-only access and immutable references';
end$$;
do $$begin
 begin perform iam.validate_specs('frame','{"geometry":{"reach_mm":"450"}}');raise exception 'Numeric strings accepted';exception when invalid_parameter_value then null;end;
 begin perform iam.validate_specs('shock','{"mount_standard":{"upper":{"unexpected":1}}}');raise exception 'Unknown nested fields accepted';exception when invalid_parameter_value then null;end;
 begin perform iam.validate_specs('brake','{"piston_count":2.5}');raise exception 'Fractional piston count accepted';exception when invalid_parameter_value then null;end;
 begin perform iam.validate_specs('tire','{"tubeless":"true"}');raise exception 'String boolean accepted';exception when invalid_parameter_value then null;end;
 begin perform iam.validate_specs('cassette','{"sprocket_teeth":[10,12,11]}');raise exception 'Unordered cassette accepted';exception when invalid_parameter_value then null;end;
 begin perform iam.validate_specs('fork','{"maintenance":{"tasks":[{"source_url":"javascript:alert(1)"}]}}');raise exception 'Unsafe source accepted';exception when invalid_parameter_value then null;end;
 perform iam.validate_specs('frame','{"size_label":"M","geometry":{"reach_mm":450,"bb_drop_mm":-10}}');
 raise notice 'PASS strict category contracts, nested keys, integer counts, booleans, cassette sequence and safe links';
end$$;
do $$declare valid jsonb='{"manifest_version":1,"units":"meters","origin":"bottom_bracket","parameters":{},"anchors":{},"paintable_nodes":[],"selectable_nodes":[]}';begin
 if not iam.valid_visual_manifest(valid) then raise exception 'valid_manifest_rejected';end if;
 if iam.valid_visual_manifest(valid||'{"units":"millimeters"}') then raise exception 'wrong_visual_units_accepted';end if;
 if iam.valid_visual_manifest(valid||'{"anchors":{"rear_axle":{"position":["0",0,0],"rotation":[0,0,0],"estimated":true}}}') then raise exception 'string_visual_coordinate_accepted';end if;
 if iam.valid_visual_manifest(valid||'{"parameters":{"unknown_code":"alert(1)"}}') then raise exception 'unknown_generator_parameter_accepted';end if;
 begin insert into public.visual_assets(kind,generator_key,manifest) values('procedural','atlas-bike-v1',valid||'{"parameters":{"size_scale":500}}');raise exception 'visual_manifest_check_bypass';exception when check_violation then null;end;
 begin insert into public.visual_assets(kind,generator_key,manifest,published) values('procedural','not-installed',valid,true);raise exception 'unsupported_generator_published';exception when check_violation then null;end;
 insert into public.visual_assets(kind,generator_key,manifest,published) values('procedural','not-installed',valid,false);
 insert into public.visual_assets(kind,generator_key,manifest,published) values('procedural','atlas-bike-v2',valid,true);
 raise notice 'PASS visual manifest units, transforms, parameter whitelist, supported generators and database enforcement';
end$$;
-- Full bicycle references, family grouping and public filters run against rolled-back fixtures.
create temporary table preset_test_variants(category text primary key,variant_id uuid not null) on commit drop;
do $$declare category_name text;component_id uuid;variant_id uuid;begin
 foreach category_name in array array['frame','fork','shock','rim','tire','hub','brake','rotor','cassette','chain','rear_derailleur','bottom_bracket','crankset','pedals','handlebar','stem','seatpost','saddle'] loop
  component_id=gen_random_uuid();variant_id=gen_random_uuid();
  insert into public.components(id,brand_id,name,slug,category,disciplines,published) values(component_id,'80000000-0000-4000-8000-000000000001','Test '||category_name,'test-'||replace(category_name,'_','-'),category_name,array['enduro'],true);
  insert into public.component_variants(id,component_id,label,specs,allowed_finishes,visual_asset_id,representation,published) values(variant_id,component_id,'Test','{}','{"default_finish_id":"black","custom_color_enabled":false,"options":[{"id":"black","label":"Negro","material":{"color":"#111111"}}]}','80000000-0000-4000-8000-000000000003','generic',true);
  insert into preset_test_variants values(category_name,variant_id);
 end loop;
end$$;
select set_config('atlas.test_items',(select jsonb_agg(jsonb_build_object('slot',s.slot,'variantId',v.variant_id,'finishId','black','customColor',null))::text from unnest(array['frame','fork','shock','front_rim','rear_rim','front_tire','rear_tire','front_hub','rear_hub','front_brake','rear_brake','front_rotor','rear_rotor','cassette','chain','rear_derailleur','bottom_bracket','crankset','pedals','handlebar','stem','seatpost','saddle'])s(slot) join preset_test_variants v on v.category=regexp_replace(s.slot,'^(front|rear)_','') or v.category=s.slot),true);
set local role authenticated;
do $$declare preset jsonb;items jsonb=current_setting('atlas.test_items')::jsonb;partial jsonb;begin
 preset='{"brand_id":"80000000-0000-4000-8000-000000000001","name":"Bicicleta temporal","slug":"atlas-test-preset-m","family_key":"atlas-test-family","label":"M","kind":"example","sources":[],"published":true}';
 if jsonb_array_length(items)<>23 then raise exception 'invalid_fixture_positions';end if;
 select jsonb_agg(item) into partial from jsonb_array_elements(items)item where item->>'slot'='frame';
 begin perform public.save_preset(preset,partial);raise exception 'partial_preset_published';exception when check_violation then if sqlerrm<>'preset_positions_missing' then raise;end if;end;
 perform public.save_preset(preset,items);
 perform public.save_preset(preset||'{"slug":"atlas-test-preset-l","label":"L"}',items);
 perform public.save_preset(preset||'{"slug":"atlas-test-preset-draft","label":"XL","published":false}',items);
end$$;
reset role;
set local role anon;
do $$declare result jsonb;begin
 result=public.list_preset_families('', '80000000-0000-4000-8000-000000000001','enduro',0);
 if (result->>'count')::integer<>1 or jsonb_array_length(result->'families'->0->'versions')<>2 then raise exception 'preset_family_grouping_or_visibility';end if;
 if (public.list_preset_families('not-a-matching-bicycle','80000000-0000-4000-8000-000000000001',null,0)->>'count')::integer<>0 then raise exception 'preset_search_filter';end if;
 if (public.list_preset_families('', '80000000-0000-4000-8000-000000000001','downhill',0)->>'count')::integer<>0 then raise exception 'preset_discipline_filter';end if;
 if jsonb_array_length(public.list_preset_families('', '80000000-0000-4000-8000-000000000001',null,1)->'families')<>0 then raise exception 'preset_pagination';end if;
 begin perform public.list_preset_families('',null,null,-1);raise exception 'negative_page_accepted';exception when invalid_parameter_value then null;end;
 raise notice 'PASS complete reference publication, public family grouping, draft exclusion, search, discipline and pagination';
end$$;
reset role;
-- A reference editor can prepare a draft; a rider cannot use its unpublished part.
insert into public.components(id,brand_id,name,slug,category,published) values('80000000-0000-4000-8000-000000000020','80000000-0000-4000-8000-000000000001','Draft frame','atlas-draft-frame','frame',false);
insert into public.component_variants(id,component_id,label,specs,allowed_finishes,representation,published) values('80000000-0000-4000-8000-000000000021','80000000-0000-4000-8000-000000000020','Draft','{}','{"default_finish_id":"black","custom_color_enabled":false,"options":[{"id":"black","label":"Negro","material":{"color":"#111111"}}]}','generic',false);
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('atlas.test_b'),'role','authenticated')::text,true);
do $$begin
 begin perform public.preset_options();raise exception 'draft_options_permission_bypass';exception when insufficient_privilege then null;end;
 begin perform public.save_build(gen_random_uuid(),0,'{"schemaVersion":1,"name":"Draft bypass","items":[{"slot":"frame","variantId":"80000000-0000-4000-8000-000000000021","finishId":"black","customColor":null}]}');raise exception 'unpublished_build_bypass';exception when no_data_found then null;end;
end$$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('atlas.test_a'),'role','authenticated')::text,true);
do $$declare header jsonb='{"brand_id":"80000000-0000-4000-8000-000000000001","name":"Draft reference","slug":"atlas-draft-reference","family_key":"atlas-draft-reference","label":"M","kind":"example","sources":[],"published":false}';items jsonb='[{"slot":"frame","variantId":"80000000-0000-4000-8000-000000000021","finishId":"black","customColor":null}]';result jsonb;begin
 perform public.save_preset(header,items);
 result=public.preset_options(null,'',0,array['80000000-0000-4000-8000-000000000021'::uuid]);
 if(result->>'count')::integer<>1 or result->'components'->0->'component_variants'->0->>'published'<>'false' then raise exception 'draft_options_not_visible_to_editor';end if;
 begin perform public.save_preset(header||'{"published":true}',items);raise exception 'draft_reference_publication_bypass';exception when check_violation then null;end;
 raise notice 'PASS draft reference preparation, editor-only options and unchanged public build restrictions';
end$$;
reset role;
rollback;
