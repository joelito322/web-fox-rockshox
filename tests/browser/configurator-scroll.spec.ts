import { selectAssemblySlot } from "./helpers/assembly";
import { expect, test } from "@playwright/test";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
const preset = JSON.parse(readFileSync("supabase/catalog/motion-v2-examples.json", "utf8")).presets[0].id;
test.use({ launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });
test("page ends at its footer with warning labels, varying text and responsive layouts", async ({ page }) => {
  test.skip(!process.env.ATLAS_TEST_EMAIL, "Use authenticated runner");
  test.setTimeout(100000);
  await page.goto("/entrar");
  await page.getByLabel("Correo electrónico").fill(process.env.ATLAS_TEST_EMAIL!);
  await page.getByLabel("Contraseña", { exact: true }).fill(process.env.ATLAS_TEST_PASSWORD!);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/mis-bicicletas/);
  await page.goto(`/configurador?preset=${preset}`);
  await expect(page.locator(".viewer canvas")).toBeVisible();
  await selectAssemblySlot(page, "Manillar");
  await page.getByLabel("Buscar alternativa").fill("Racepoint");
  await page.locator(".piece-options button").filter({ hasText: "DEITY Racepoint 35" }).click();
  await expect(page.locator(".selected-piece")).toContainText("Racepoint");
  const results = [];
  for (const width of [1366, 980, 900, 721, 720, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const suspension of [false, true]) {
      const toggle = page.getByRole("region", { name: "Montaje visual", exact: true }).getByRole("button", { name: "Suspensión", exact: true });
      if ((await toggle.getAttribute("aria-pressed")) !== String(suspension)) await toggle.click();
      const samples = await page.evaluate(async () => {
        const results = [];
        for (let i = 0; i < 12; i++) {
          await new Promise((resolve) => setTimeout(resolve, 150));
          results.push({ footerBottom: document.querySelector(".site-footer")!.getBoundingClientRect().bottom + scrollY, page: document.documentElement.scrollHeight, viewer: document.querySelector(".viewer")!.getBoundingClientRect().height });
        }
        return results;
      });
      const outside = await page.evaluate(() => {
        const bottom = document.querySelector(".site-footer")!.getBoundingClientRect().bottom + scrollY;
        return [...document.querySelectorAll("main *")].filter((el) => getComputedStyle(el).position === "absolute" && el.getBoundingClientRect().bottom + scrollY > bottom + 2).slice(0, 12).map((el) => ({ element: el.tagName + "." + el.className, bottom: el.getBoundingClientRect().bottom + scrollY, parent: (el as HTMLElement).offsetParent?.tagName }));
      });
      results.push({ width, suspension, samples, outside });
    }
  }
  // Increase visible footer text: the end must follow its actual content, not a pixel cap.
  await page.locator(".site-footer").evaluate((node) => {
    node.querySelectorAll("span").forEach((span) => span.append(" Cada pieza define tu camino.".repeat(12)));
  });
  for (const width of [1366, 900, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const bounds = await page.evaluate(() => ({
      end: document.querySelector(".site-footer")!.getBoundingClientRect().bottom + scrollY,
      page: document.documentElement.scrollHeight,
      viewport: innerHeight,
    }));
    expect(bounds.page - Math.max(bounds.end, bounds.viewport), `Footer must grow with its text at ${width}px`).toBeLessThanOrEqual(2);
  }
  mkdirSync("models/local/validation/configurator-scroll", { recursive: true });
  writeFileSync("models/local/validation/configurator-scroll/heights.json", JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results.map(({ width, suspension, samples }) => ({ width, suspension, first: samples[0], last: samples.at(-1) }))));
  for (const result of results) {
    const settled = result.samples.slice(-4);
    expect(Math.max(...settled.map((s) => s.viewer)) - Math.min(...settled.map((s) => s.viewer)), JSON.stringify(result)).toBeLessThanOrEqual(2);
    expect(Math.max(...settled.map((s) => s.page)) - Math.min(...settled.map((s) => s.page)), JSON.stringify(result)).toBeLessThanOrEqual(2);
    expect(settled.at(-1)!.page - settled.at(-1)!.footerBottom, `Blank area after footer: ${JSON.stringify(result)}`).toBeLessThanOrEqual(2);
    expect(result.outside).toEqual([]);
  }
});
