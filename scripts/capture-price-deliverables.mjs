// Update only images used by the deliverables. No orders, saved builds or catalog edits.
import { chromium, devices, expect as baseExpect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { randomUUID, randomBytes } from 'node:crypto';
import { mkdirSync, copyFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { readProjectEnvironment, postgresEnvironment } from './lib/environment.mjs';
const env = readProjectEnvironment();
const origin = process.env.ATLAS_EVIDENCE_ORIGIN ?? 'http://127.0.0.1:5174';
const out = 'entregables/03_Manual_Usuario/recursos';
const local = 'models/local/validation/entregables/price-filter';
mkdirSync(local, { recursive: true });
const expect = baseExpect.configure({ timeout: 60000 });
const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const result = { origin, captured_at: new Date().toISOString(), captures: [], cleanup: false };
let userId, browser, page;
async function capture(name, clip) {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${out}/${name}`, ...(clip ? { clip } : {}) });
  result.captures.push(name);
  console.log(name);
}
async function priceClip() {
  const root = await page.locator('.price-filter').boundingBox();
  const panel = await page.locator('.price-filter-panel').boundingBox();
  return { x: root.x - 10, y: root.y - 10,
    width: Math.max(root.width, panel.width) + 20, height: panel.y + panel.height - root.y + 20 };
}
try {
  browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1.5, reducedMotion: 'reduce' });
  page = await desktop.newPage();
  page.setDefaultTimeout(60000);
  await page.goto(origin + '/componentes?category=fork');
  await page.locator('.product-card').first().waitFor();
  await page.locator('.price-filter').getByLabel('Filtrar por precio').click();
  await page.getByLabel('Desde S/', { exact: true }).fill('1000');
  await page.getByLabel('Hasta S/', { exact: true }).fill('2500');
  await capture('35-filtro-precio.png', await priceClip());
  await page.locator('.price-filter').getByRole('button', { name: 'Aplicar', exact: true }).click();
  await expect(page.locator('.results-count')).toHaveText('4 modelos');
  await expect(page.locator('.sales-card-price')).toHaveCount(4);
  await page.mouse.move(0, 0);
  await capture('22-vista-componentes.png');
  await page.locator('.product-card').first().click();
  const drawer = page.getByRole('dialog', { name: 'Detalle de la pieza' });
  await expect(drawer.getByRole('combobox').first()).toBeVisible();
  await expect(drawer.locator('.sales-detail-price strong')).toBeVisible();
  await page.mouse.move(0, 0);
  await capture('23-vista-ficha.png');
  await drawer.getByRole('button', { name: 'Cerrar detalle', exact: true }).click();

  const email = `validation-delivery-price-${randomUUID()}@example.invalid`;
  const password = randomBytes(30).toString('base64url');
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error) throw Error('Disposable account creation failed');
  userId = created.data.user.id;
  await page.goto(origin + '/entrar');
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(/mis-bicicletas/);
  await page.goto(origin + '/bicicletas');
  await page.locator('.preset-card').first().getByRole('link', { name: /Personalizar/ }).click();
  await expect(page.locator('.slot-complete')).toHaveCount(23);
  await expect(page.locator('.viewer canvas')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle');
  await capture('26-vista-configurador.png');
  await page.getByRole('complementary', { name: 'Piezas del montaje', exact: true }).getByRole('button', { name: 'Horquilla', exact: true }).click();
  const filter = page.locator('.price-filter');
  await filter.getByLabel('Filtrar por precio').click();
  await filter.getByLabel('Hasta S/', { exact: true }).fill('2500');
  await filter.getByRole('button', { name: 'Aplicar', exact: true }).click();
  await expect(page.locator('.piece-option-price').first()).toBeVisible();
  await page.locator('.editor-panel').evaluate(panel => {
    const field = panel.querySelector('.price-filter');
    const navigation = panel.querySelector('.assembly-navigation');
    panel.scrollTop += field.getBoundingClientRect().top - panel.getBoundingClientRect().top - navigation.getBoundingClientRect().height - 20;
  });
  await page.mouse.move(0, 0);
  const root = await filter.boundingBox();
  const navigation = await page.locator('.assembly-navigation').boundingBox();
  expect(root.y).toBeGreaterThanOrEqual(navigation.y + navigation.height);
  const second = await page.locator('.piece-options button').nth(1).boundingBox();
  const panel = await page.locator('.editor-panel').boundingBox();
  await capture('36-precio-configurador.png', { x: panel.x + 4, y: root.y - 10, width: panel.width - 8, height: second.y + second.height - root.y + 20 });
  await desktop.close();

  const mobile = await browser.newContext({ ...devices['Pixel 7'], reducedMotion: 'reduce' });
  page = await mobile.newPage();
  page.setDefaultTimeout(60000);
  await page.goto(origin + '/componentes?category=fork');
  await page.locator('.product-card').first().waitFor();
  await page.locator('.price-filter').getByLabel('Filtrar por precio').click();
  await page.getByLabel('Hasta S/', { exact: true }).fill('2500');
  await capture('37-precio-movil.png', await priceClip());
  await mobile.close();
  copyFileSync(`${out}/35-filtro-precio.png`, 'entregables/02_Informe_Tecnico/recursos/05-filtro-precio.png');
  copyFileSync(`${out}/35-filtro-precio.png`, 'entregables/04_Presentacion/recursos/18-filtro-precio.png');
  result.completed = true;
} catch (error) {
  if (page) await page.screenshot({ path: `${local}/failure.png`, fullPage: true }).catch(() => {});
  result.failure = error.message;
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (userId) {
    const cleaned = spawnSync('psql', ['-X', '-q', '-v', 'ON_ERROR_STOP=1', '-v', `user_id=${userId}`, '-f', 'supabase/tests/commerce-browser-cleanup.sql'], { env: postgresEnvironment(env), encoding: 'utf8', timeout: 60000 });
    const removed = cleaned.status === 0 ? await admin.auth.admin.deleteUser(userId) : { error: true };
    result.cleanup = !removed.error;
    if (!result.cleanup) process.exitCode = 1;
  }
  writeFileSync(`${local}/capture.json`, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ completed: result.completed ?? false, images: result.captures.length, cleanup: result.cleanup }));
}
