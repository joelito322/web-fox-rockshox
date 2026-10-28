// Documentary captures of the current local build. Only a disposable account and its own records are written.
import { chromium, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { readProjectEnvironment, postgresEnvironment } from './lib/environment.mjs';
const env = readProjectEnvironment();
const origin = process.env.ATLAS_EVIDENCE_ORIGIN ?? 'http://127.0.0.1:5174';
const out = 'entregables/03_Manual_Usuario/recursos';
const evidence = 'models/local/validation/entregables';
mkdirSync(evidence, { recursive: true });
const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const run = 'validation-manual-views-' + randomUUID().slice(0, 8);
let id, browser;
const result = { origin, checked_at: new Date().toISOString(), captures: [], cleanup: false };
function sql(args, input) {
 const value = spawnSync('psql', ['-X', '-q', '-v', 'ON_ERROR_STOP=1', '-v', `user_id=${id}`, '-v', `run=${run}`, ...args], { env: postgresEnvironment(env), input, encoding: 'utf8', timeout: 60000 });
 if (value.status !== 0) throw Error('Documentary fixture SQL failed');
}
async function cleanupFolder(prefix) {
 const storage = admin.storage.from('bike-previews');
 const { data, error } = await storage.list(prefix, { limit: 1000 });
 if (error || data?.length === 1000) throw Error('Documentary preview cleanup failed');
 for (const entry of data ?? []) {
  if (entry.id) { const removed = await storage.remove([`${prefix}/${entry.name}`]); if (removed.error) throw Error('Preview removal failed'); }
  else await cleanupFolder(`${prefix}/${entry.name}`);
 }
}
try {
 const email = `${run}@example.invalid`, password = randomBytes(30).toString('base64url');
 const created = await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:'Cliente ATLAS'}});
 if(created.error)throw Error('Temporary account failed');id=created.data.user.id;
 sql([],"update iam.user_roles set role_id=(select id from iam.roles where key='admin') where user_id=:'user_id'::uuid;");
 browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1.5,reducedMotion:'reduce'});page.setDefaultTimeout(35000);
 async function view(name){await page.evaluate(()=>document.fonts.ready);await expect(page.locator('.feedback')).toHaveCount(0,{timeout:90000});if(name==='24-vista-bicicletas.png'||name==='27-vista-mis-bicicletas.png'){await expect(page.locator('.bike-preview[data-preview-state=ready]').first()).toBeVisible({timeout:120000});}if(name==='26-vista-configurador.png'){await expect(page.locator('.viewer canvas')).toBeVisible({timeout:120000});}await page.waitForLoadState('networkidle',{timeout:60000});await page.evaluate(async()=>{await Promise.all([...document.images].filter(i=>i.getBoundingClientRect().top<innerHeight).map(i=>i.decode().catch(()=>{})));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`${out}/${name}`});result.captures.push(name);console.log(name);}
 await page.goto(origin+'/componentes?category=fork');await page.locator('.product-card').first().waitFor();await view('22-vista-componentes.png');
 await page.locator('.product-card').filter({hasText:'40 Factory'}).click();let panel=page.getByRole('dialog',{name:'Detalle de la pieza',exact:true});await expect(panel.getByRole('combobox').first()).toBeVisible({timeout:35000});await panel.getByRole('combobox').first().scrollIntoViewIfNeeded();await view('23-vista-ficha.png');
 await panel.getByRole('button',{name:'Comparar',exact:true}).click();const versions=panel.getByRole('combobox').first();const options=await versions.locator('option').evaluateAll(os=>os.map(o=>o.value));if(options.length>1){await versions.selectOption(options[1]);await panel.getByRole('button',{name:'Comparar',exact:true}).click();}
 await panel.getByRole('button',{name:'Cerrar detalle',exact:true}).click();await page.getByRole('link',{name:/Comparar/}).click();await page.locator('.comparison-table').waitFor();await view('25-vista-comparacion.png');
 await page.goto(origin+'/bicicletas');await page.locator('.preset-card').first().waitFor();await view('24-vista-bicicletas.png');
 await page.goto(origin+'/entrar');await page.getByLabel('Correo electrónico').fill(email);await page.getByLabel('Contraseña',{exact:true}).fill(password);await page.getByRole('button',{name:'Entrar',exact:true}).click();await expect(page).toHaveURL(/mis-bicicletas/);
 await page.goto(origin+'/bicicletas');await page.locator('.preset-card').first().getByRole('link',{name:/Personalizar/}).click();await expect(page.locator('.slot-complete')).toHaveCount(23,{timeout:60000});
 await page.getByLabel('Nombre del montaje').fill('Mi bicicleta de enduro');await page.getByRole('button',{name:'Guardar',exact:true}).click();await expect(page.locator('.save-status')).toContainText('Guardado',{timeout:45000});await view('26-vista-configurador.png');
 await page.goto(origin+'/mis-bicicletas');await expect(page.locator('.preset-card').first()).toBeVisible();await view('27-vista-mis-bicicletas.png');
 await page.goto(origin+'/componentes?category=tire');await page.locator('.product-card').first().click();panel=page.getByRole('dialog');await panel.getByRole('button',{name:'Añadir al carrito',exact:true}).click();await expect(panel.locator('.sales-add-button')).toHaveClass(/is-added/);await panel.getByRole('button',{name:'Cerrar detalle',exact:true}).click();
 await page.goto(origin+'/comprar');await expect(page.getByLabel('Destinatario',{exact:true})).toBeVisible();await view('28-vista-revisar-pedido.png');
 for(const [route,name] of [['catalogo','29-vista-admin-catalogo.png'],['roles','32-vista-admin-roles.png'],['permisos','33-vista-admin-permisos.png'],['ofertas','34-vista-admin-ofertas.png']]){
  await page.goto(origin+'/administracion/'+route);await page.locator('table tbody tr').first().waitFor();await view(name);
  if(route==='catalogo'){await page.locator('.admin-table tbody tr').first().click();await page.getByRole('dialog').waitFor();await view('30-vista-admin-ficha.png');}
 }
 await page.goto(origin+'/administracion/usuarios');await page.getByRole('textbox',{name:'Buscar usuario'}).fill(email);await expect(page.locator('.admin-table tbody tr')).toHaveCount(1);await expect(page.locator('.admin-table tbody tr')).toContainText(email);await view('31-vista-admin-usuarios.png');
 result.completed=true;
} catch (error) {
 result.failure = error.message;process.exitCode = 1;
} finally {
 if (browser) await browser.close();
 if (id) {
  try {
   await cleanupFolder(`builds/${id}`);
   sql(['-f', 'supabase/tests/commerce-browser-cleanup.sql']);
   sql(['-f', 'supabase/tests/browser-cleanup.sql']);
   const removed = await admin.auth.admin.deleteUser(id);if (removed.error) throw Error('Temporary identity cleanup failed');
   result.cleanup = true;
  } catch { result.cleanup = false; process.exitCode = 1; }
 }
 writeFileSync(`${evidence}/manual-views-run.json`, JSON.stringify(result, null, 2) + '\n');
 console.log(JSON.stringify({ completed: result.completed ?? false, captures: result.captures.length, cleanup: result.cleanup }));
}
