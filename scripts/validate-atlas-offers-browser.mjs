// Documentary captures of the current local build. Only a disposable account and its own records are written.
import { chromium, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { readProjectEnvironment, postgresEnvironment } from './lib/environment.mjs';
const env = readProjectEnvironment();
const origin = process.env.ATLAS_EVIDENCE_ORIGIN ?? 'http://127.0.0.1:5174';
const out = 'models/local/validation/pricing';
const evidence = 'models/local/validation/entregables';
mkdirSync(evidence, { recursive: true });
const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const run = 'validation-atlas-offers-' + randomUUID().slice(0, 8);
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
 const email=`${run}@example.invalid`, password=randomBytes(30).toString('base64url');
 const created=await admin.auth.admin.createUser({email,password,email_confirm:true});if(created.error)throw Error('Temporary identity failed');id=created.data.user.id;
 sql([],"update iam.user_roles set role_id=(select id from iam.roles where key='admin') where user_id=:'user_id'::uuid;");
 browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});page.setDefaultTimeout(35000);
 await page.goto(origin+'/entrar');await page.getByLabel('Correo electrónico').fill(email);await page.getByLabel('Contraseña',{exact:true}).fill(password);await page.getByRole('button',{name:'Entrar',exact:true}).click();await expect(page).toHaveURL(/mis-bicicletas/);
 const review=JSON.parse(readFileSync('supabase/catalog/atlas-commercial-offers.json','utf8'));
 for(const offer of review.offers){
  await page.goto(origin+'/componentes/'+offer.slug+'?variant='+offer.variant_id);const panel=page.getByRole('dialog',{name:'Detalle de la pieza',exact:true});
  await expect(panel.locator('.sales-detail-price strong')).toContainText((offer.price_cents/100).toFixed(2),{timeout:35000});
  await panel.getByRole('button',{name:'Añadir al carrito',exact:true}).click();await expect(panel.locator('.sales-add-button')).toHaveClass(/is-added/);
  result.captures.push(offer.sku);console.log(offer.sku+' priced and added');
 }
 await page.goto(origin+'/comprar');await expect(page.locator('.feedback')).toHaveCount(0,{timeout:35000});
 await expect(page.locator('.sales-cart-line')).toHaveCount(6,{timeout:35000});
 await page.getByLabel('Destinatario',{exact:true}).fill('Cliente ATLAS');await page.getByLabel('Correo o teléfono de contacto').fill('cliente@example.invalid');
 await page.getByRole('button',{name:'Ver resumen',exact:true}).click();await expect(page.locator('.sales-summary')).toContainText('525.00',{timeout:35000});
 await page.screenshot({path:out+'/atlas-checkout.png'});
 await page.goto(origin+'/administracion/ofertas');await page.getByRole('textbox',{name:'Buscar',exact:true}).fill('ATLAS');await expect(page.locator('table tbody tr')).toHaveCount(6,{timeout:35000});
 await page.locator('table tbody tr').filter({hasText:'Manillar ATLAS'}).getByRole('button').click();const panel=page.getByRole('dialog',{name:'Editar oferta'});
 await expect(panel.getByLabel('Precio (S/)',{exact:true})).toHaveValue('80');await expect(panel.getByLabel('Stock disponible',{exact:true})).toHaveValue('12');
 await page.screenshot({path:out+'/atlas-admin-offer.png'});
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
 writeFileSync(`${evidence}/atlas-prices-browser.json`, JSON.stringify(result, null, 2) + '\n');
 console.log(JSON.stringify({ completed: result.completed ?? false, captures: result.captures.length, cleanup: result.cleanup }));
}
