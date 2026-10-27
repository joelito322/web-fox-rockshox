import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
const presets = JSON.parse(readFileSync("supabase/catalog/motion-v2-examples.json", "utf8")) as { presets: { id: string }[] };

test.use({ launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });
test("existing views fit mobile, tablet and wide desktop viewports", async ({ page }, info) => {
  test.skip(!process.env.ATLAS_RESPONSIVE_EMAIL, "Run scripts/validate-responsive.mjs");
  test.setTimeout(240000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const widths = [320, 360, 390, 719, 721, 759, 761, 768, 1024, 1049, 1051, 1366, 1449, 1451, 1820, 1920];
  const routes = ["/", "/componentes", "/bicicletas", "/mis-bicicletas", "/configurador",
    `/configurador?preset=${presets.presets[0].id}`, "/administracion/catalogo", "/administracion/marcas", "/administracion/recursos", "/administracion/bicicletas", "/administracion/usuarios", "/administracion/roles", "/administracion/permisos"];
  const results: { route: string; width: number; scrollWidth: number; offenders: string[] }[] = [];
  await page.goto("/entrar");
  await expect(page.getByLabel("Correo electrónico")).toBeVisible();
  for (const width of widths) {
    await page.setViewportSize({ width, height: 844 });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    results.push({ route: "/entrar", width, scrollWidth: await page.evaluate(() => document.documentElement.scrollWidth), offenders: [] });
  }
  await page.getByLabel("Correo electrónico").fill(process.env.ATLAS_RESPONSIVE_EMAIL!);
  await page.getByLabel("Contraseña", { exact: true }).fill(process.env.ATLAS_RESPONSIVE_PASSWORD!);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/mis-bicicletas/);
  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
    if (route.startsWith("/administracion/")) await expect(page.locator(".admin-table").first()).toBeVisible();
    else if (route === "/componentes") await expect(page.locator(".product-card").first()).toBeVisible();
    else if (route === "/bicicletas") await expect(page.locator(".preset-card").first()).toBeVisible();
    else if (route === "/configurador") await expect(page.getByRole("heading", { name: "Elige tu cuadro" })).toBeVisible();
    else if (route.startsWith("/configurador?")) await expect(page.locator("canvas")).toBeVisible({ timeout: 30000 });
    for (const width of widths) {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const measurement = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        offenders: Array.from(document.querySelectorAll("main *, header, footer")).filter(el => {
          const box = el.getBoundingClientRect();
          // Tables, tab strips and similar containers intentionally scroll internally.
          let parent = el.parentElement;
          while (parent && parent !== document.documentElement) {
            if (["auto", "scroll", "hidden", "clip"].includes(getComputedStyle(parent).overflowX)) return false;
            parent = parent.parentElement;
          }
          return box.width > 0 && (box.right > innerWidth + 1 || box.left < -1);
        }).slice(0, 8).map(el => `${el.tagName.toLowerCase()}.${el.className}`),
      }));
      results.push({ route, width, ...measurement });
    }
  }
  const output = "models/local/validation/responsive";
  mkdirSync(output, { recursive: true });
  writeFileSync(`${output}/results-${info.project.name}.json`, JSON.stringify({ results, errors }, null, 2));
  // Empty create dialogs exercise real shared panels without saving business data.
  for (const [route, action] of [["/administracion/usuarios", "Crear usuario"], ["/administracion/roles", "Crear rol"], ["/administracion/catalogo", "Crear marca"]]) {
    await page.goto(route);
    await page.getByRole("button", { name: action, exact: true }).click();
    const dialog = page.getByRole("dialog").last();
    await expect(dialog).toBeVisible();
    for (const width of [320, 390, 768, 1820]) {
      await page.setViewportSize({ width, height: 844 });
      await dialog.evaluate(el => Promise.all(el.getAnimations().map(animation => animation.finished.catch(() => {}))));
      const box = await dialog.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(-1);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
    }
    await dialog.getByRole("button", { name: "Cerrar detalle" }).click();
    await expect(dialog).not.toBeVisible();
  }
  expect(errors).toEqual([]);
  expect(results.filter(row => row.scrollWidth > row.width + 1)).toEqual([]);
});
