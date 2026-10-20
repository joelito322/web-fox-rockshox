-- This temporary test identity is always deleted by the test runner.
begin;
update iam.user_roles set role_id=(select id from iam.roles where key='admin'),revision=revision+1 where user_id=:'user_id'::uuid;
commit;
begin;
select set_config('atlas.browser_run', :'run', true);
select set_config('request.jwt.claims',jsonb_build_object('sub',:'user_id','role','authenticated')::text,true);
do $$declare brand uuid=gen_random_uuid();asset uuid=gen_random_uuid();model uuid;variant uuid;category_name text;run text=current_setting('atlas.browser_run');items jsonb='[]';part_slot text;presets jsonb;begin
 insert into public.brands(id,name,slug,published) values(brand,run||' scene',run||'-scene',true);
 insert into public.visual_assets(id,kind,generator_key,manifest,reference_notes,published) values(asset,'procedural','atlas-bike-v1','{"manifest_version":1,"units":"meters","origin":"bottom_bracket","parameters":{},"anchors":{},"paintable_nodes":[],"selectable_nodes":[]}',run||'-scene',true);
 foreach category_name in array array['frame','fork','shock','rim','tire','hub','brake','rotor','cassette','chain','rear_derailleur','bottom_bracket','crankset','pedals','handlebar','stem','seatpost','saddle'] loop
  model=gen_random_uuid();variant=gen_random_uuid();
  insert into public.components(id,brand_id,name,slug,category,disciplines,published) values(model,brand,run||' scene '||category_name,run||'-scene-'||replace(category_name,'_','-'),category_name,array['enduro'],true);
  insert into public.component_variants(id,component_id,label,specs,allowed_finishes,visual_asset_id,representation,published) values(variant,model,'Validación temporal','{}','{"default_finish_id":"black","custom_color_enabled":true,"options":[{"id":"black","label":"Negro","material":{"color":"#111111"}}]}',asset,'generic',true);
  foreach part_slot in array case when category_name in('rim','tire','hub','brake','rotor') then array['front_'||category_name,'rear_'||category_name] else array[category_name] end loop
   items=items||jsonb_build_array(jsonb_build_object('slot',part_slot,'variantId',variant,'finishId','black','customColor',null));
  end loop;
 end loop;
 -- Synthetic imported visual exercises delivery without uploading a commercial model.
 model=gen_random_uuid();variant=gen_random_uuid();asset=gen_random_uuid();
 insert into public.components(id,brand_id,name,slug,category,disciplines,published) values(model,brand,'Entrega remota '||right(run,8),run||'-remote-visual','fork',array['enduro'],true);
 insert into public.visual_assets(id,kind,storage_path,manifest,reference_notes,published) values(asset,'glb','validation/fixture.glb','{"manifest_version":1,"units":"meters","origin":"bottom_bracket","parameters":{},"anchors":{},"paintable_nodes":["validation_triangle"],"selectable_nodes":["validation_triangle"]}',run||'-scene-glb',true);
 insert into public.component_variants(id,component_id,label,specs,allowed_finishes,visual_asset_id,representation,published) values(variant,model,'Archivo de validación','{}','{"default_finish_id":"black","custom_color_enabled":true,"options":[{"id":"black","label":"Negro","material":{"color":"#111111"}}]}',asset,'generic',true);
 presets=jsonb_build_object('brand_id',brand,'name',run||' reference','slug',run||'-reference-m','family_key',run||'-reference','label','M','kind','example','sources','[]'::jsonb,'published',true);
 perform public.save_preset(presets,items);
 perform public.save_preset(presets||jsonb_build_object('slug',run||'-reference-l','label','L'),items);
end$$;
commit;
