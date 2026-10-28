// Academic evidence: real public frontend, isolated temporary accounts, no catalogue writes.
import { chromium, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { randomBytes, randomUUID } from 'node:crypto';
import { writeFileSync, mkdirSync } from 'node:fs';
import { readProjectEnvironment } from './lib/environment.mjs';
const e=readProjectEnvironment(), origin=process.env.ATLAS_EVIDENCE_ORIGIN??'http://127.0.0.1:5174';
const out='entregables/02_Informe_Tecnico/recursos';mkdirSync(out,{recursive:true});
const opts={auth:{persistSession:false,autoRefreshToken:false}};
const admin=createClient(e.SUPABASE_URL,e.SUPABASE_SECRET_KEY,opts);
const accounts=[], buildIds=[];let browser;
const result={context:'Versión actual local + Supabase Cloud; cuentas temporales creadas y confirmadas por API para la prueba, sin entrega de correo',checks:{},cleanup:false};
const must=(value,name)=>{if(!value)throw Error(name);result.checks[name]=true;};
try {
 browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 let errors=0;page.on('pageerror',()=>errors++);
 await page.goto(origin);await page.locator('.campaign-photo.is-active').first().waitFor({timeout:25000});await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:out+'/01-portada.png',fullPage:false});must(await page.locator('.campaign-photo.is-active img').first().evaluate(i=>i.complete&&i.naturalWidth>0),'portada_publica');
 await page.goto(origin+'/componentes');await page.locator('.product-card').first().waitFor({timeout:25000});
 await page.getByRole('complementary',{name:'Categorías'}).screenshot({path:out+'/02-categorias.png'});
 must(await page.locator('.product-card').count()>0,'catalogo_publico');
 await page.getByRole('textbox',{name:'Buscar componentes'}).fill('xyzsinresultados');await expect(page.getByRole('heading',{name:'Sin piezas en esta selección'})).toBeVisible();must(true,'busqueda_sin_resultados_controlada');
 for(let i=0;i<2;i++){
 const email=`report-${randomUUID()}@example.invalid`,password=randomBytes(30).toString('base64url');
 const created=await admin.auth.admin.createUser({email,password,email_confirm:true});if(created.error)throw Error('Temporary account creation failed');
 accounts.push({id:created.data.user.id,email,password,client:createClient(e.SUPABASE_URL,e.SUPABASE_PUBLISHABLE_KEY,opts)});
 const login=await accounts[i].client.auth.signInWithPassword({email,password});if(login.error)throw Error('Temporary login failed');
 }
 await page.goto(origin+'/entrar');await page.getByLabel('Correo electrónico').fill(accounts[0].email);await page.getByLabel('Contraseña',{exact:true}).fill(accounts[0].password);await page.getByRole('button',{name:'Entrar',exact:true}).click();
 await expect(page).toHaveURL(/mis-bicicletas/);must(true,'entrada_con_cuenta_temporal');
 await page.goto(origin+'/bicicletas');await page.locator('.preset-card').first().getByRole('link',{name:'Personalizar',exact:false}).click();
 await expect(page.locator('.slot-complete')).toHaveCount(23,{timeout:45000});await page.locator('canvas').first().waitFor({timeout:45000});
 await page.getByLabel('Nombre del montaje').fill('Montaje de demostración');
 await page.getByRole('button',{name:'Frontal',exact:true}).click();
 await page.locator('canvas').first().evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 await page.locator('.viewer').screenshot({path:out+'/03-montaje-3d.png'});must(true,'configuracion_23_posiciones');
 await page.getByRole('button',{name:'Guardar',exact:true}).click();await expect(page.locator('.save-status')).toContainText('Guardado',{timeout:30000});must(true,'guardado_publico');
 const read=await accounts[0].client.from('builds').select('id,name,revision,build_items(slot,variant_id,finish_id,custom_color)').eq('user_id',accounts[0].id);if(read.error||read.data.length!==1)throw Error('Build read failed');const build=read.data[0];buildIds.push(build.id);must(build.build_items.length===23,'persistencia_23_posiciones');
 const other=await accounts[1].client.from('builds').select('id').eq('id',build.id);must(!other.error&&other.data.length===0,'aislamiento_entre_cuentas');
 const config={schemaVersion:1,name:build.name,items:build.build_items.map(x=>({slot:x.slot,variantId:x.variant_id,finishId:x.finish_id,customColor:x.custom_color}))};
 const conflict=await accounts[0].client.rpc('save_build',{p_build_id:build.id,p_expected_revision:0,p_configuration:config});must(conflict.error?.code==='PT409','rechazo_revision_obsoleta');
 await page.goto(origin+'/mis-bicicletas');await page.getByRole('button',{name:'Montaje de demostración',exact:true}).click();await expect(page.getByRole('dialog',{name:'Mi bicicleta',exact:true})).toBeVisible();must(true,'reapertura_publica');
 await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Mi cuenta',exact:true}).click();await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click();await expect(page.getByRole('link',{name:'Entrar',exact:true})).toBeVisible();must(true,'cierre_sesion_publico');
 must(errors===0,'sin_errores_javascript');
 const mobile=await browser.newPage({viewport:{width:393,height:851},isMobile:true,hasTouch:true,reducedMotion:'reduce'});await mobile.goto(origin+'/componentes');await mobile.locator('.product-card').first().waitFor({timeout:20000});await mobile.getByRole('button',{name:'Categorías',exact:true}).click();await mobile.getByRole('complementary',{name:'Categorías'}).scrollIntoViewIfNeeded();
 await mobile.getByRole('complementary',{name:'Categorías'}).screenshot({path:out+'/04-categorias-movil.png'});must(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'adaptacion_movil_emulada');
 console.log('Public evidence checks completed');
} catch(error){ result.failure=error.message;console.log('Evidence run failed: '+error.message);process.exitCode=1; }
finally {
 if(browser)await browser.close();let cleaned=true;
 for(const a of accounts){
 const builds=await admin.from('builds').select('id').eq('user_id',a.id);
 for(const b of builds.data??[]){const folder=`builds/${a.id}/${b.id}`;const list=await admin.storage.from('bike-previews').list(folder,{limit:1000});if(list.data?.length){const removed=await admin.storage.from('bike-previews').remove(list.data.map(o=>`${folder}/${o.name}`));if(removed.error)cleaned=false;}}
 const deleted=await admin.auth.admin.deleteUser(a.id);if(deleted.error)cleaned=false;
 }
 result.cleanup=cleaned;writeFileSync('models/local/validation/entregables/report-run.json',JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({checks:Object.keys(result.checks).length,cleanup:cleaned,failed:Boolean(result.failure)}));if(!cleaned)process.exitCode=1;
}
