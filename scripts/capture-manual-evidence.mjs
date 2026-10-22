// Manual: public controls and disposable private montage; no catalogue/role changes.
import { chromium, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { readProjectEnvironment } from './lib/environment.mjs';
const env=readProjectEnvironment(), origin='https://atlasmtb.netlify.app';
const out='entregables/03_Manual_Usuario/recursos';mkdirSync(out,{recursive:true});
const admin=createClient(env.SUPABASE_URL,env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const result={context:'Web pública; cuenta temporal confirmada por API para capturar recorridos; no prueba entrega de correo ni consentimiento Google',checks:[],cleanup:false};
let browser,account;
const check=name=>{result.checks.push(name);console.log(name);};
try{
 browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:2,reducedMotion:'reduce'});
 page.setDefaultTimeout(25000);
 await page.goto(origin+'/entrar');await page.locator('.auth-form form').screenshot({path:out+'/01-entrada-correo.png'});
 await page.goto(origin+'/registro');await page.locator('.auth-form form').screenshot({path:out+'/02-registro.png'});check('formularios_entrada_registro');
 await page.goto(origin+'/componentes');await page.locator('.product-card').first().waitFor();
 const tabs=page.getByRole('navigation',{name:'Espacio de trabajo'});const first=await tabs.locator('a').first().boundingBox(),last=await tabs.locator('a').last().boundingBox();await page.screenshot({path:out+'/03-navegacion.png',clip:{x:first.x,y:first.y,width:last.x+last.width-first.x,height:first.height}});
 await page.locator('.catalog-toolbar .search-input').screenshot({path:out+'/04-busqueda.png'});
 await page.getByRole('complementary',{name:'Categorías'}).screenshot({path:out+'/05-categorias.png'});
 await page.getByRole('textbox',{name:'Buscar componentes'}).fill('zzsinopcionesmanual');await expect(page.getByRole('heading',{name:'Sin piezas en esta selección'})).toBeVisible();check('busqueda_sin_resultados');
 // Compare two variants of the same category through their actual detail controls.
 await page.getByRole('textbox',{name:'Buscar componentes'}).fill('');await page.locator('.product-card').first().waitFor();
 await page.locator('.product-card').first().click();await page.getByRole('dialog',{name:'Detalle de la pieza',exact:true}).waitFor();
 const versions=page.getByLabel('Versión',{exact:true});const options=await versions.locator('option').evaluateAll(os=>os.map(o=>o.value));
 await page.getByRole('dialog').getByRole('button',{name:'Comparar',exact:true}).click();
 if(options.length>1){await versions.selectOption(options[1]);await page.getByRole('dialog').getByRole('button',{name:'Comparar',exact:true}).click();}
 await page.getByRole('button',{name:'Cerrar detalle',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
 await page.getByRole('link',{name:/Comparar/}).click();await page.locator('.comparison-table').waitFor();check('comparacion_desde_ficha');
 const email=`manual-${randomUUID()}@example.invalid`,password=randomBytes(30).toString('base64url');
 const created=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:'Usuario de demostración'}});
 if(created.error)throw Error('No se pudo crear cuenta temporal');account={id:created.data.user.id,email,password};
 await page.goto(origin+'/entrar');await page.getByLabel('Correo electrónico').fill(email);await page.getByLabel('Contraseña',{exact:true}).fill(password);await page.getByRole('button',{name:'Entrar',exact:true}).click();await expect(page).toHaveURL(/mis-bicicletas/);check('entrada_cuenta_temporal');
 await page.goto(origin+'/bicicletas');await page.locator('.preset-card').first().getByRole('link',{name:'Personalizar',exact:false}).click();await expect(page.locator('.slot-complete')).toHaveCount(23,{timeout:60000});
 await page.getByLabel('Nombre del montaje').fill('Mi bicicleta de práctica');
 await page.getByRole('button',{name:'Frontal',exact:true}).click();await page.locator('canvas').first().evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 await page.locator('.viewer').screenshot({path:out+'/06-visor.png'});
 await page.locator('.assembly-navigation').screenshot({path:out+'/07-grupos-talla.png'});
 await page.locator('.finish-palette').screenshot({path:out+'/08-acabados.png'});
 await page.getByRole('navigation',{name:'Grupos de montaje'}).getByRole('button',{name:'Ruedas',exact:true}).click();
 await page.locator('.assembly-navigation').screenshot({path:out+'/09-pares.png'});
 await expect(page.getByLabel('Aplicar a ambos lados')).toBeChecked();check('grupos_pares_filtros');
 await page.locator('.viewer').getByRole('button',{name:'Suspensión',exact:true}).click();await page.getByRole('region',{name:'Suspensión',exact:true}).screenshot({path:out+'/10-suspension.png'});check('controles_suspension_movimiento_reducido');
 await page.getByRole('button',{name:'Guardar',exact:true}).click();await expect(page.locator('.save-status')).toContainText('Guardado',{timeout:30000});
 await page.setViewportSize({width:740,height:1000});await page.locator('.editor-toolbar').screenshot({path:out+'/11-guardado.png'});await page.setViewportSize({width:1440,height:1000});check('guardado_montaje');
 await page.getByLabel('Nombre del montaje').fill('Cambio pendiente');await page.getByRole('link',{name:'Mis bicicletas',exact:true}).last().click();
 await page.getByRole('alertdialog',{name:'Hay cambios sin guardar',exact:true}).screenshot({path:out+'/12-cambios-pendientes.png'});
 await page.getByRole('button',{name:'Seguir editando',exact:true}).click();await expect(page.getByLabel('Nombre del montaje')).toHaveValue('Cambio pendiente');check('proteccion_cambios_pendientes');
 await page.getByRole('link',{name:'Mis bicicletas',exact:true}).last().click();await page.getByRole('button',{name:'Guardar y salir',exact:true}).click();await expect(page).toHaveURL(/mis-bicicletas/);
 await page.getByRole('button',{name:'Cambio pendiente',exact:true}).click();await page.getByRole('dialog',{name:'Mi bicicleta',exact:true}).waitFor();
 await page.getByLabel('Nombre',{exact:true}).fill('Mi bicicleta revisada');await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();await expect(page.getByRole('status')).toContainText('Nombre actualizado.');
 await page.getByRole('dialog').locator('form').screenshot({path:out+'/13-renombrar.png'});check('renombrado_desde_detalle');
 await page.getByRole('button',{name:'Cerrar detalle',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
 await page.getByRole('link',{name:/Continuar/}).first().click();await expect(page.getByLabel('Nombre del montaje')).toHaveValue('Mi bicicleta revisada');check('continuar_montaje_guardado');
 await page.getByRole('link',{name:'Mis bicicletas',exact:true}).last().click();await page.getByRole('button',{name:'Opciones de Mi bicicleta revisada',exact:true}).click();
 page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Eliminar',exact:true}).click();await expect(page.getByRole('heading',{name:'Tu primer montaje empieza con un cuadro'})).toBeVisible();check('eliminar_montaje_temporal');
 await page.getByRole('button',{name:'Mi cuenta',exact:true}).click();await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click();await expect(page.getByRole('link',{name:'Entrar',exact:true})).toBeVisible();check('cierre_sesion');
 const mobile=await browser.newPage({viewport:{width:393,height:851},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce'});await mobile.goto(origin+'/componentes');await mobile.locator('.product-card').first().waitFor();await mobile.getByRole('button',{name:'Categorías',exact:true}).click();await mobile.getByRole('complementary',{name:'Categorías'}).screenshot({path:out+'/14-categorias-movil.png'});expect(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();check('categorias_movil_emulado');
}catch(error){if(browser){const p=browser.contexts()[0]?.pages()[0];if(p)await p.screenshot({path:'/tmp/atlas-manual-failure.png'}).catch(()=>{});}result.failure=error.message;process.exitCode=1;console.log('Recorrido incompleto: '+error.message);}
finally{
 if(browser)await browser.close();let clean=true;
 if(account){const folders=await admin.storage.from('bike-previews').list(`builds/${account.id}`,{limit:1000});for(const folder of folders.data??[]){const prefix=`builds/${account.id}/${folder.name}`;const listed=await admin.storage.from('bike-previews').list(prefix,{limit:1000});if(listed.data?.length){const removed=await admin.storage.from('bike-previews').remove(listed.data.map(x=>`${prefix}/${x.name}`));if(removed.error)clean=false;}}const builds=await admin.from('builds').select('id').eq('user_id',account.id);for(const b of builds.data??[]){const prefix=`builds/${account.id}/${b.id}`;const listed=await admin.storage.from('bike-previews').list(prefix,{limit:1000});if(listed.data?.length){const removed=await admin.storage.from('bike-previews').remove(listed.data.map(x=>`${prefix}/${x.name}`));if(removed.error)clean=false;}}const deleted=await admin.auth.admin.deleteUser(account.id);if(deleted.error)clean=false;}
 result.cleanup=clean;writeFileSync(out+'/validacion-recorridos.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({checks:result.checks.length,cleanup:clean,failed:Boolean(result.failure)}));if(!clean)process.exitCode=1;
}
