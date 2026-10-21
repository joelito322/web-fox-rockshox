import { selectAssemblySlot } from "./helpers/assembly";
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const source = JSON.parse(readFileSync("supabase/catalog/cockpit-reviewed.json", "utf8")) as {
  components: { id: string; slug: string; name: string }[];
  variants: { id: string; component_id: string }[];
};
const examples = JSON.parse(readFileSync("supabase/catalog/visual-v7-examples.json", "utf8")) as {
  presets: { id: string; slug: string }[];
};
test.use({ launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });
const scenarios = [
  { name: "enduro", preset: "meta", choices: [["Manillar", "renthal-fatbar-35"], ["Potencia", "renthal-apex-35-v2"], ["Tija", "oneup-v3-dropper"], ["Sillín", "wtb-volt"]] },
  { name: "downhill", preset: "supreme", choices: [["Manillar", "deity-racepoint-35"], ["Potencia", "renthal-integra-35"]] },
];
for (const scenario of scenarios) test(`commercial ${scenario.name} components mount, save and reopen their exact resources`, async ({ page }) => {
  test.skip(!process.env.ATLAS_TEST_EMAIL, "Run through scripts/validate-configurator-performance.mjs desktop commercial");
  test.setTimeout(120000);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto("/entrar");
  await page.getByLabel("Correo electrónico").fill(process.env.ATLAS_TEST_EMAIL!);
  await page.getByLabel("Contraseña", { exact: true }).fill(process.env.ATLAS_TEST_PASSWORD!);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/mis-bicicletas/);
  const preset = examples.presets.find(preset => preset.slug.includes(scenario.preset))!;
  await page.goto(`/configurador?preset=${preset.id}`);
  await expect(page.locator(".viewer canvas")).toBeVisible();
  const expected: string[] = [];
  for (const [slot, slug] of scenario.choices) {
    const component = source.components.find(row => row.slug === slug)!;
    const variant = source.variants.find(row => row.component_id === component.id)!;
    expected.push(variant.id);
    await selectAssemblySlot(page, slot);
    const option = page.locator(".piece-options > button").filter({ hasText: component.name }).first();
    await expect(option).toBeVisible(); await option.click();
    await expect(page.locator(".selected-piece h2")).toHaveText(component.name);
    await expect(page.locator(".viewer canvas")).toBeVisible();
  }
  const name = `Commercial ${scenario.name} ${Date.now()}`;
  await page.getByLabel("Nombre del montaje").fill(name);
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.locator(".save-status")).toHaveText("Guardado");
  await page.locator(".editor-toolbar").getByRole("link", { name: "Mis bicicletas", exact: true }).click();
  const card = page.locator(".preset-card").filter({ hasText: name });
  await expect(card).toBeVisible();
  await expect(card.locator(".bike-preview")).toHaveAttribute("data-preview-state", "ready");
  await expect.poll(() => card.locator("img").evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(640);
  await card.getByRole("link", { name: "Continuar", exact: false }).click();
  await expect(page.getByLabel("Nombre del montaje")).toHaveValue(name);
  const saved = page.waitForResponse(response => {
    const url = new URL(response.url());
    return url.pathname.endsWith("/rest/v1/builds") && url.searchParams.get("select")?.includes("build_items(slot") === true;
  });
  await page.reload();
  const response = await saved; expect(response.ok()).toBe(true);
  const rows = await response.json();
  const stored = Array.isArray(rows) ? rows[0] : rows;
  expect(stored.build_items.map((item: { variant_id: string }) => item.variant_id)).toEqual(expect.arrayContaining(expected));
  await expect(page.locator(".viewer canvas")).toBeVisible();
  await expect(page.locator(".slot-complete")).toHaveCount(23);
  for (const [slot, slug] of scenario.choices) {
    await selectAssemblySlot(page, slot);
    await expect(page.locator(".selected-piece h2")).toHaveText(source.components.find(row => row.slug === slug)!.name);
  }
  await expect(page.getByText("Vista 3D no disponible", { exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
  console.log(JSON.stringify({ scope: `commercial-${scenario.name}`, selectedModels: expected.length, persistedExactVariantIds: true, slots: 23, thumbnailWidth: 640 }));
});
