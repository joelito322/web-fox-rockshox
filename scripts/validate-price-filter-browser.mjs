// Read-only catalog/editor scenarios. The disposable Auth account is removed afterwards.
import { chromium, devices, expect as baseExpect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { readProjectEnvironment, postgresEnvironment } from './lib/environment.mjs';
const env = readProjectEnvironment();
const expect = baseExpect.configure({ timeout: 45000 });
const origin = process.env.ATLAS_EVIDENCE_ORIGIN ?? 'http://127.0.0.1:5174';
const output = 'models/local/validation/price-filter';
mkdirSync(output, { recursive: true });
const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const publicClient = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const result = { origin, checked_at: new Date().toISOString(), scenarios: [], cleanup: false };
let userId, browser, lastPage;
try {
  const expected = await publicClient.rpc('catalog_price_matches', { p_category: 'fork', p_min_cents: null, p_max_cents: 250000 });
  if (expected.error || !expected.data?.length) throw Error('Price discovery unavailable or no fork fixtures');
  const ids = expected.data.map(row => row.variant_id);
  const variants = await publicClient.from('component_variants').select('id,component_id').in('id', ids);
  if (variants.error) throw Error('Cannot resolve expected catalog coverage');
  const count = new Set(variants.data.map(row => row.component_id)).size;
  const email = `validation-price-filter-${randomUUID()}@example.invalid`;
  const password = randomBytes(30).toString('base64url');
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error) throw Error('Cannot create disposable account');
  userId = created.data.user.id;
  browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const mobile of [false, true]) {
    const context = await browser.newContext(mobile ? { ...devices['Pixel 7'], reducedMotion: 'reduce' } : { viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    lastPage = page;
    page.setDefaultTimeout(45000);
    const name = mobile ? 'mobile' : 'desktop';
    const calls = { prices: 0, components: 0, models: 0 };
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.pathname.endsWith('/rpc/catalog_price_matches')) calls.prices++;
      if (url.pathname.endsWith('/rest/v1/components')) calls.components++;
      if (url.pathname.includes('/storage/v1/object/public/models/')) calls.models++;
    });
    const filter = () => page.locator('.price-filter');
    async function apply(min = '', max = '') {
      await filter().getByLabel('Filtrar por precio').click();
      await expect(filter().locator('details')).toHaveAttribute('open');
      await filter().getByLabel('Desde S/', { exact: true }).fill(min);
      await filter().getByLabel('Hasta S/', { exact: true }).fill(max);
      await filter().getByRole('button', { name: 'Aplicar', exact: true }).click();
    }
    async function withinViewport(locator) {
      const bounds = await locator.boundingBox();
      const width = page.viewportSize().width;
      if (!bounds || bounds.x < -1 || bounds.x + bounds.width > width + 1) throw Error('Price panel exceeds viewport');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
    await page.goto(origin + '/componentes?category=fork');
    await page.locator('.product-card').first().waitFor();
    expect(calls.prices).toBe(0);
    await filter().getByLabel('Filtrar por precio').click();
    await withinViewport(filter().locator('form'));
    await filter().getByLabel('Desde S/', { exact: true }).fill('3000');
    await filter().getByLabel('Hasta S/', { exact: true }).fill('500');
    await expect(filter().getByRole('button', { name: 'Aplicar', exact: true })).toBeDisabled();
    expect(calls.prices).toBe(0);
    await filter().getByLabel('Desde S/', { exact: true }).fill('');
    await filter().getByLabel('Hasta S/', { exact: true }).fill('2500');
    await filter().getByRole('button', { name: 'Aplicar', exact: true }).click();
    await expect(page.locator('.results-count')).toHaveText(`${count} modelos`);
    await expect(page.locator('.product-card')).toHaveCount(Math.min(24, count));
    expect(calls.prices).toBe(1);
    await page.locator('.product-card').first().click();
    const drawer = page.getByRole('dialog', { name: 'Detalle de la pieza' });
    await expect(drawer.getByRole('combobox').first()).toBeVisible();
    const choices = await drawer.getByRole('combobox').first().locator('option').evaluateAll(options => options.map(option => option.value));
    expect(choices.length).toBeGreaterThan(0);
    expect(choices.every(id => ids.includes(id))).toBe(true);
    await expect(drawer.locator('.sales-detail-price strong')).toBeVisible();
    const price = Number((await drawer.locator('.sales-detail-price strong').innerText()).replace(/[^\d.]/g, ''));
    expect(price).toBeLessThanOrEqual(2500);
    await drawer.getByRole('button', { name: 'Cerrar detalle', exact: true }).click();
    await page.screenshot({ path: `${output}/${name}-catalog.png`, fullPage: true });
    await filter().getByRole('button', { name: /Quitar filtro de precio/ }).click();
    await expect(page).not.toHaveURL(/price_max/);
    await apply('', '0');
    await expect(page.locator('.results-count')).toHaveText('0 modelos');
    await expect(page.getByText('Sin piezas en esta selección', { exact: true })).toBeVisible();
    if (mobile) await page.getByRole('button', { name: 'Categorías', exact: true }).click();
    await page.getByRole('complementary', { name: 'Categorías', exact: true }).getByRole('button', { name: 'Amortiguadores', exact: true }).click();
    await expect(page).not.toHaveURL(/price_max/);
    await expect(filter().locator('.price-filter-chip')).toHaveCount(0);
    console.log(`${name}: catalog, detail, empty range and category reset passed`);

    await page.goto(origin + '/entrar');
    await page.getByLabel('Correo electrónico', { exact: true }).fill(email);
    await page.getByLabel('Contraseña', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page).toHaveURL(/mis-bicicletas/);
    await page.goto(origin + '/configurador');
    await page.locator('.piece-options button').first().waitFor();
    async function slot(label) {
      const index = page.getByRole('complementary', { name: 'Piezas del montaje', exact: true });
      if (!(await index.locator('details').evaluate(node => node.open))) await index.locator('summary').click();
      await index.getByRole('button', { name: label, exact: true }).click();
    }
    await slot('Horquilla');
    await page.locator('.piece-options button').first().waitFor();
    await page.mouse.move(0, 0);
    const modelsBefore = calls.models;
    await apply('', '2500');
    await page.mouse.move(0, 0);
    await expect(page.locator('.piece-options button')).toHaveCount(variants.data.length);
    await expect(page.locator('.piece-option-price')).toHaveCount(variants.data.length);
    expect(calls.models).toBe(modelsBefore);
    await filter().getByLabel('Filtrar por precio').click();
    await withinViewport(filter().locator('form'));
    await filter().getByLabel('Hasta S/', { exact: true }).press('Escape');
    await expect(filter().locator('details')).not.toHaveAttribute('open');
    await page.screenshot({ path: `${output}/${name}-configurator.png`, fullPage: true });
    await slot('Amortiguador');
    await expect(filter().locator('.price-filter-chip')).toHaveCount(0);
    await expect(page.locator('.piece-options button').first()).toBeVisible();
    expect(errors).toEqual([]);
    result.scenarios.push({ name, expectedModels: count, expectedVariants: variants.data.length, calls, errors });
    console.log(`${name}: configurator and viewport checks passed`);
    await context.close();
  }
  result.completed = true;
} catch (error) {
  if (lastPage) await lastPage.screenshot({ path: `${output}/failure.png`, fullPage: true }).catch(() => {});
  result.failure = error.message;
  console.error(error.stack);
  if (lastPage) result.layout = await lastPage.locator('.price-filter, .price-filter-chip, .price-filter summary').evaluateAll(elements => elements.map(element => ({ className: element.className, rect: element.getBoundingClientRect().toJSON(), position: getComputedStyle(element).position, top: getComputedStyle(element).top, padding: getComputedStyle(element).padding }))).catch(() => []);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (userId) {
    try {
      const cleanup = spawnSync('psql', ['-X', '-q', '-v', 'ON_ERROR_STOP=1', '-v', `user_id=${userId}`, '-f', 'supabase/tests/commerce-browser-cleanup.sql'], { env: postgresEnvironment(env), encoding: 'utf8', timeout: 60000 });
      if (cleanup.status !== 0) throw Error('Disposable cart cleanup failed');
      const removed = await admin.auth.admin.deleteUser(userId);
      if (removed.error) throw Error('Disposable identity cleanup failed');
      result.cleanup = true;
    } catch { process.exitCode = 1; }
  }
  writeFileSync(`${output}/browser.json`, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ completed: result.completed ?? false, scenarios: result.scenarios.length, cleanup: result.cleanup }));
}
