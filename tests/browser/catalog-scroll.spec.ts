import { expect, test } from "@playwright/test";

test.use({ reducedMotion: "no-preference" });

test("component details preserve the scrolled catalog through repeated closes and history", async ({ page }, info) => {
  await page.addInitScript(() => {
    document.addEventListener("animationstart", event => {
      if (event.animationName.startsWith("panel-exit")) document.body.dataset.lastDrawerExit = event.animationName;
    });
  });
  await page.goto("/componentes");
  const cards = page.locator(".product-card");
  await expect(cards).toHaveCount(24);
  const dialog = page.getByRole("dialog", { name: "Detalle de la pieza" });
  for (const [index, action] of [[9, "outside"], [10, "escape"], [11, "button"]] as const) {
    const card = cards.nth(index);
    await card.scrollIntoViewIfNeeded();
    const y = await page.evaluate(() => scrollY);
    expect(y).toBeGreaterThan(300);
    await card.click();
    await expect(dialog).toBeVisible();
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(y);
    if (action === "outside") await page.mouse.click(8, 8);
    else if (action === "escape") await page.keyboard.press("Escape");
    else await dialog.getByRole("button", { name: "Cerrar detalle" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page).toHaveURL(/\/componentes$/);
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(y);
    await expect(card).toBeFocused();
    await expect(page.locator("body")).toHaveAttribute("data-last-drawer-exit", info.project.name === "mobile" ? "panel-exit-mobile" : "panel-exit");
  }
  const card = cards.nth(12);
  await card.scrollIntoViewIfNeeded();
  const y = await page.evaluate(() => scrollY);
  await card.click();
  await expect(dialog).toBeVisible();
  await page.goBack();
  await expect(dialog).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(y);
  await page.goForward();
  await expect(dialog).toBeVisible();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(y);
});

test("reduced motion closes without an exit animation and keeps the catalog position", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => document.addEventListener("animationstart", event => {
    if (event.animationName.startsWith("panel-exit")) document.body.dataset.unexpectedExit = "yes";
  }));
  await page.goto("/componentes");
  const card = page.locator(".product-card").nth(9);
  await card.scrollIntoViewIfNeeded();
  const y = await page.evaluate(() => scrollY);
  await card.click();
  const dialog = page.getByRole("dialog", { name: "Detalle de la pieza" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(y);
  await expect(page.locator("body")).not.toHaveAttribute("data-unexpected-exit", "yes");
});
