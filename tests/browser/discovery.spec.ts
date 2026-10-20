import { expect, test } from "@playwright/test";

test("bike image opens the selected version by keyboard and returns to the card", async ({ page }) => {
  await page.goto("/bicicletas?q=SUPREME");
  const card = page.locator(".bicycle-card");
  await card.getByRole("combobox", { name: "Versión", exact: true }).selectOption({ label: "M" });
  const media = card.getByRole("button", { name: /^Ver montaje de/ });
  await media.focus();
  await page.keyboard.press("Enter");
  const detail = page.getByRole("dialog", { name: "Detalle de la bicicleta" });
  await expect(detail).toBeVisible();
  await expect(detail.getByRole("combobox", { name: "Versión", exact: true })).toHaveValue(
    (await card.getByRole("combobox", { name: "Versión", exact: true }).inputValue()),
  );
  await page.keyboard.press("Escape");
  await expect(detail).toHaveCount(0);
  await expect(media).toBeFocused();
  await expect(card.getByRole("combobox", { name: "Versión", exact: true }).locator("option:checked")).toHaveText("M");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("gallery navigation preserves component filters while frames remain in the bike tab", async ({ page }, info) => {
  await page.goto("/componentes?category=brake&q=SLX");
  const search = page.getByRole("textbox", { name: "Buscar componentes" });
  await expect(page.locator(".product-card")).toHaveCount(2);
  if (info.project.name === "mobile") {
    const categories = page.getByRole("button", { name: "Categorías", exact: true });
    await categories.click();
    await expect(categories).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("complementary", { name: "Categorías" })).toBeVisible();
    await categories.click();
    await expect(categories).toHaveAttribute("aria-expanded", "false");
  }
  await page.getByRole("link", { name: "Bicicletas", exact: true }).click();
  await page.getByRole("button", { name: "Cuadros", exact: true }).click();
  await expect(page).toHaveURL(/view=frames/);
  await expect(page.getByRole("button", { name: "Cuadros", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".frames-catalog .product-card").first()).toBeVisible();
  await page.getByRole("link", { name: "Componentes", exact: true }).click();
  await expect(search).toHaveValue("SLX");
  await expect(page.locator(".product-card")).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("wide workspace uses the viewport and adds product columns", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Wide desktop layout is checked in the desktop project");
  for (const width of [1920, 2560]) {
    await page.setViewportSize({ width, height: 1080 });
    await page.goto("/componentes?category=brake");
    await expect(page.locator(".product-card").first()).toBeVisible();
    const content = await page.locator(".content.catalog-page").boundingBox();
    expect(content?.x).toBe(0);
    expect(content?.width).toBe(width);
    const columns = await page.locator(".product-grid").evaluate(element => getComputedStyle(element).gridTemplateColumns.split(" ").length);
    expect(columns).toBeGreaterThan(3);
    const heading = await page.locator(".discovery-heading").boundingBox();
    expect(heading!.x).toBeLessThanOrEqual(56);
    expect(width - heading!.x - heading!.width).toBeLessThanOrEqual(57);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("link", { name: "Bicicletas", exact: true }).click();
    await expect(page.locator(".bicycle-card").first()).toBeVisible();
    expect((await page.locator(".preset-list").boundingBox())?.width).toBe(width);
    await page.goto("/comparar");
    await expect(page.locator(".content")).toBeVisible();
    expect((await page.locator(".content").boundingBox())?.width).toBe(width);
  }
});
