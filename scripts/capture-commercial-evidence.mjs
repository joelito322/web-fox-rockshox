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
const run = 'validation-docs-' + randomUUID().slice(0, 8);
let id, browser;
const result = { origin, checked_at: new Date().toISOString(), captures: [], cleanup: false };
function sql(args, input) {
 const value = spawnSync('psql', ['-X', '-q', '-v', 'ON_ERROR_STOP=1', '-v', `user_id=${id}`, '-v', `run=${run}`, ...args], { env: postgresEnvironment(env), input, encoding: 'utf8', timeout: 60000 });
 if (value.status !== 0) throw Error('Documentary fixture SQL failed');
}
async function shot(locator, name) {
 await locator.screenshot({ path: `${out}/${name}` });
 result.captures.push(name);
}
async function panelShot(page, panel, name) {
 const box = await panel.boundingBox();
 const footer = name === '20-notificacion.png'
  ? await panel.locator('article').last().boundingBox()
  : await panel.locator('.drawer-footer').boundingBox();
 const height = footer ? Math.min(box.height, footer.y + footer.height - box.y + 12) : box.height;
 await page.screenshot({ path: `${out}/${name}`, clip: { x: box.x, y: box.y, width: box.width, height } });
 result.captures.push(name);
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
 const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: 'Usuario de práctica' } });
 if (created.error) throw Error('Temporary documentary account creation failed');
 id = created.data.user.id;
 sql([], "update iam.user_roles set role_id=(select id from iam.roles where key='admin') where user_id=:'user_id'::uuid;");
 browser = await chromium.launch();
 const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
 page.setDefaultTimeout(30000);
 await page.goto(origin + '/entrar');
 await page.getByLabel('Correo electrónico').fill(email);
 await page.getByLabel('Contraseña', { exact: true }).fill(password);
 await page.getByRole('button', { name: 'Entrar', exact: true }).click();
 await expect(page).toHaveURL(/mis-bicicletas/);
 // Capture a real recommendation without modifying a public preset.
 await page.goto(origin + '/bicicletas?q=META');
 await page.locator('.preset-card').filter({ hasText: 'META SX V5' }).getByRole('link', { name: /Personalizar/ }).click();
 await expect(page.locator('.slot-complete')).toHaveCount(23, { timeout: 60000 });
 await page.getByRole('complementary', { name: 'Piezas del montaje', exact: true }).getByRole('button', { name: 'Aro delantero', exact: true }).click();
 await page.getByLabel('Buscar alternativa').fill('E 593');
 await page.locator('.piece-options button').filter({ hasText: '27.5' }).click();
 await page.getByRole('region', { name: 'Estado de compatibilidad' }).getByRole('button', { name: 'Ver detalles', exact: true }).click();
 const problem = page.getByRole('dialog', { name: 'Compatibilidad', exact: true }).locator('.compatibility-card').filter({ hasText: 'El aro y el neumático delanteros tienen diámetros distintos.' });
 await problem.getByRole('button', { name: 'Ver alternativas', exact: true }).click();
 await expect(problem.locator('.compatibility-option-price').first()).toContainText('S/');
 await shot(problem, '15-alternativas.png');
 // A fresh route discards only this never-saved disposable browser draft.
 await page.goto(origin + '/componentes?category=tire');
 await page.locator('.product-card').first().click();
 let panel = page.getByRole('dialog');
 await panel.getByRole('button', { name: 'Añadir al carrito', exact: true }).click();
 await expect(panel.locator('.sales-add-button')).toHaveClass(/is-added/);
 await shot(panel.locator('.sales-purchase'), '19-confirmacion-carrito.png');
 await panel.getByRole('button', { name: 'Cerrar detalle', exact: true }).click();
 await page.getByRole('button', { name: 'Carrito · 1', exact: true }).click();
 panel = page.getByRole('dialog', { name: 'Tu carrito', exact: true });
 await expect(panel.locator('.sales-total')).toContainText('S/');
 await panelShot(page, panel, '16-carrito.png');
 await panel.getByRole('button', { name: 'Cerrar detalle', exact: true }).click();
 await page.goto(origin + '/comprar');
 await page.getByLabel('Destinatario', { exact: true }).fill('Cliente de práctica');
 await page.getByLabel('Correo o teléfono de contacto').fill('practica@example.invalid');
 await page.getByRole('button', { name: 'Transferencia', exact: true }).click();
 await page.getByRole('button', { name: 'Interbank', exact: true }).click();
 await page.getByRole('button', { name: 'Ver resumen', exact: true }).click();
 await expect(page.getByRole('button', { name: 'Crear pedido', exact: true })).toBeVisible();
 await shot(page.locator('.sales-payment'), '17-revisar-pedido.png');
 await shot(page.locator('.sales-summary'), '21-resumen.png');
 // Quote an intentionally partial saved montage, without paying or consuming stock.
 const client = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
 const found = await client.from('components').select('id,component_variants!inner(id)').ilike('name', 'Nomad%').eq('published', true).eq('component_variants.selectable', true).limit(1).single();
 if (found.error) throw Error('Documentary frame lookup failed');
 await page.goto(origin + '/configurador?variant=' + found.data.component_variants[0].id);
 await page.getByLabel('Nombre del montaje').fill('Mi montaje de práctica');
 const buy = page.getByRole('button', { name: 'Comprar componentes', exact: true });
 await expect(buy).toBeEnabled({ timeout: 60000 });await buy.click();
 panel = page.getByRole('dialog', { name: 'Componentes de tu montaje' });
 await panel.getByRole('button', { name: 'Reemplazar carrito completo', exact: true }).click();
 await page.getByRole('button', { name: 'Guardar y salir', exact: true }).click();
 await expect(page).toHaveURL(/comprar/);
 await page.getByLabel('Destinatario', { exact: true }).fill('Cliente de práctica');
 await page.getByLabel('Correo o teléfono de contacto').fill('practica@example.invalid');
 await page.getByRole('checkbox', { name: /Solicitar armado con revisión técnica/ }).check();
 await page.getByLabel('Montaje que quieres armar').selectOption({ index: 1 });
 await page.getByRole('button', { name: 'Solicitar cotización', exact: true }).click();
 await expect(page).toHaveURL(/quote=/);
 const quote = new URL(page.url()).searchParams.get('quote');
 await page.goto(origin + '/administracion/pedidos?tab=cotizaciones&quote=' + quote);
 panel = page.getByRole('dialog', { name: 'Cotización', exact: true });
 await panel.getByRole('checkbox', { name: 'Armado sin coste', exact: true }).check();
 await panel.getByLabel('Revisión técnica y condiciones').fill('Solicitud de práctica: armado sin coste sujeto a la revisión del taller.');
 await panelShot(page, panel, '18-cotizacion.png');
 await panel.getByRole('button', { name: 'Publicar cotización', exact: true }).click();
 await expect(panel).toContainText('Pendiente de aceptación');
 await panel.getByRole('button', { name: 'Cerrar detalle', exact: true }).click();
 await page.getByRole('button', { name: /Notificaciones ·/ }).click();
 panel = page.getByRole('dialog', { name: 'Notificaciones', exact: true });
 await expect(panel).toContainText('Tu armado va sin coste');
 await panelShot(page, panel, '20-notificacion.png');
 // No order was created, no payment approved, no global tariff/catalogue changed.
 result.completed = true;
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
 writeFileSync(`${evidence}/commercial-run.json`, JSON.stringify(result, null, 2) + '\n');
 console.log(JSON.stringify({ completed: result.completed ?? false, captures: result.captures.length, cleanup: result.cleanup }));
}
