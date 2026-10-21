import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { selectAssemblySlot } from "./helpers/assembly";
const examples = JSON.parse(
  readFileSync("supabase/catalog/visual-v7-examples.json", "utf8"),
);
const source = JSON.parse(
  readFileSync("supabase/catalog/visual-v7-reviewed.json", "utf8"),
);
const preset = examples.presets.find((p: any) => p.slug.includes("supreme"));
test.use({
  launchOptions: {
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  },
});
test.beforeEach(async ({ page }) => {
  test.skip(
    !process.env.ATLAS_TEST_EMAIL,
    "Run the guided scenario with the authenticated runner",
  );
  test.setTimeout(120000);
  await page.goto("/entrar");
  await page
    .getByLabel("Correo electrónico")
    .fill(process.env.ATLAS_TEST_EMAIL!);
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill(process.env.ATLAS_TEST_PASSWORD!);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/mis-bicicletas/);
  await page.goto(`/configurador?preset=${preset.id}`);
  await expect(page.locator(".slot-complete")).toHaveCount(23);
  await expect(page.locator(".viewer canvas")).toBeVisible();
});
async function indexText(page: Page, label: string) {
  return page
    .getByRole("complementary", { name: "Piezas del montaje", exact: true })
    .getByRole("button", { name: label, exact: true, includeHidden: true })
    .textContent();
}
async function pickSlot(page: Page, label: string) {
  await selectAssemblySlot(page, label, false);
}
async function save(page: Page, name: string) {
  await page.getByLabel("Nombre del montaje").fill(name);
  const request = page.waitForRequest((r) =>
    r.url().endsWith("/rest/v1/rpc/save_build"),
  );
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.locator(".save-status")).toHaveText("Guardado");
  return (await request).postDataJSON().p_configuration;
}
test("wheel pairs, individual choices, undo and mixed dimensions save atomically", async ({
  page,
}) => {
  const mounted = await indexText(page, "Cuadro");
  const sizes = page.getByRole("group", {
    name: "Talla del cuadro",
    exact: true,
  });
  for (const size of ["M", "L"]) {
    await sizes.getByRole("button", { name: size, exact: true }).click();
    await expect
      .poll(async () => {
        const labels = await page
          .locator(".piece-options > button > span > span")
          .allTextContents();
        return (
          labels.length > 0 &&
          labels.every(
            (label) => label.startsWith(size + " ") || label === size,
          )
        );
      })
      .toBe(true);
    expect(await indexText(page, "Cuadro")).toBe(mounted);
  }
  await sizes.getByRole("button", { name: "Todas", exact: true }).click();
  await pickSlot(page, "Aro delantero");
  await expect(
    page.getByRole("checkbox", { name: "Aplicar a ambos lados" }),
  ).toBeChecked();
  await page
    .getByRole("group", { name: "Medida de ruedas" })
    .getByRole("button", { name: '29"', exact: true })
    .click();
  const option = page
    .locator(".piece-options > button")
    .filter({ hasText: "29″" })
    .first();
  await expect(option).toBeVisible();
  await option.click();
  await expect.poll(() => indexText(page, "Aro trasero")).toContain("29″");
  await pickSlot(page, "Aro trasero");
  await page.getByRole("checkbox", { name: "Aplicar a ambos lados" }).uncheck();
  await page
    .getByRole("group", { name: "Medida de ruedas" })
    .getByRole("button", { name: '27,5"', exact: true })
    .click();
  await page
    .locator(".piece-options > button")
    .filter({ hasText: "27.5″" })
    .click();
  await expect.poll(() => indexText(page, "Aro trasero")).toContain("27.5″");
  expect(await indexText(page, "Aro delantero")).toContain("29″");
  await page
    .getByRole("button", { name: "Deshacer último cambio", exact: true })
    .click();
  await expect.poll(() => indexText(page, "Aro trasero")).toContain("29″");
  await page.getByRole("checkbox", { name: "Aplicar a ambos lados" }).check();
  await page
    .getByRole("group", { name: "Medida de ruedas" })
    .getByRole("button", { name: "Mixto", exact: true })
    .click();
  await page
    .locator(".piece-options > button")
    .filter({ hasText: "27.5″" })
    .click();
  await expect(page.locator(".save-status")).toContainText("Piezas aplicadas");
  await expect.poll(() => indexText(page, "Aro delantero")).toContain("29″");
  await expect.poll(() => indexText(page, "Aro trasero")).toContain("27.5″");
  const name = `Guided pair ${Date.now()}`;
  const saved = await save(page, name);
  const rim = source.components.find((c: any) => c.category === "rim");
  for (const [slot, bsd] of [
    ["front_rim", 622],
    ["rear_rim", 584],
  ]) {
    const expected = source.variants.find(
      (v: any) =>
        v.component_id === rim.id &&
        v.selectable &&
        v.specs.wheel_bsd_mm === bsd,
    );
    expect(saved.items.find((i: any) => i.slot === slot).variantId).toBe(
      expected.id,
    );
  }
  await page
    .locator(".editor-toolbar")
    .getByRole("link", { name: "Mis bicicletas", exact: true })
    .click();
  await page
    .locator(".preset-card")
    .filter({ hasText: name })
    .getByRole("link", { name: "Continuar", exact: false })
    .click();
  await expect.poll(() => indexText(page, "Aro delantero")).toContain("29″");
  await expect.poll(() => indexText(page, "Aro trasero")).toContain("27.5″");
});
test("a missing mixed counterpart preserves both tyres and filters never replace mounted parts", async ({
  page,
}) => {
  const front = await indexText(page, "Neumático delantero"),
    rear = await indexText(page, "Neumático trasero");
  await pickSlot(page, "Neumático delantero");
  await page
    .getByRole("group", { name: "Medida de ruedas" })
    .getByRole("button", { name: "Mixto", exact: true })
    .click();
  expect(await indexText(page, "Neumático delantero")).toBe(front);
  expect(await indexText(page, "Neumático trasero")).toBe(rear);
  await page.getByLabel("Buscar alternativa", { exact: true }).fill("Assegai");
  await page
    .locator(".piece-options > button")
    .filter({ hasText: "Assegai" })
    .click();
  await expect(page.locator(".assembly-notice")).toContainText(
    "No hay una variante equivalente",
  );
  expect(await indexText(page, "Neumático delantero")).toBe(front);
  expect(await indexText(page, "Neumático trasero")).toBe(rear);
  await page.getByRole("checkbox", { name: "Aplicar a ambos lados" }).uncheck();
  await page.locator(".piece-options > button").click();
  await expect(page.locator(".save-status")).toContainText("Pieza aplicada");
});
test("direct palettes, paired brakes and the responsive index stay usable", async ({
  page,
}, testInfo) => {
  const reads: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/rest/v1/") && r.method() === "GET")
      reads.push(r.url());
  });
  const beforePaint = reads.length;
  await page.getByRole("button", { name: "Color Rojo", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Color Rojo", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Color personalizado", { exact: true }).fill("#345678");
  await expect(
    page.getByLabel("Color personalizado", { exact: true }),
  ).toHaveValue("#345678");
  expect(reads).toHaveLength(beforePaint);
  await pickSlot(page, "Freno delantero");
  await expect(
    page.getByRole("checkbox", { name: "Aplicar a ambos lados" }),
  ).toBeChecked();
  await page
    .getByLabel("Buscar alternativa", { exact: true })
    .fill("SLX M7100");
  await page
    .locator(".piece-options > button")
    .filter({ hasText: "SLX M7100" })
    .click();
  await expect
    .poll(() => indexText(page, "Freno trasero"))
    .toContain("SLX M7100");
  await pickSlot(page, "Disco delantero");
  await expect(
    page.getByRole("checkbox", { name: "Aplicar a ambos lados" }),
  ).toBeChecked();
  const option = page.locator(".piece-options > button").first();
  await option.click();
  await expect(page.locator(".save-status")).toContainText("Piezas aplicadas");
  const saved = await save(page, `Guided color ${Date.now()}`);
  expect(saved.items.find((i: any) => i.slot === "frame").customColor).toBe(
    "#345678",
  );
  expect(saved.items.find((i: any) => i.slot === "front_brake").variantId).toBe(
    saved.items.find((i: any) => i.slot === "rear_brake").variantId,
  );
  expect(saved.items.find((i: any) => i.slot === "front_rotor").variantId).toBe(
    saved.items.find((i: any) => i.slot === "rear_rotor").variantId,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.locator(".editor-panel").evaluate((node) => {
    node.scrollTop = 0;
  });
  await page.screenshot({
    path: `/tmp/atlas-guided-${testInfo.project.name}.png`,
    fullPage: true,
  });
});
