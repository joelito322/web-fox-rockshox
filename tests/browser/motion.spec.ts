import { expect, test } from "@playwright/test";

test("detail motion preserves filters, native focus and Escape dismissal", async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/componentes?category=tire&q=Assegai");
  const search = page.getByRole("textbox", { name: "Buscar componentes" });
  const card = page.locator(".product-card").first();
  await card.click();
  const dialog = page.getByRole("dialog", { name: "Detalle de la pieza" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveCSS("animation-name", info.project.name === "mobile" ? "panel-enter-mobile" : "panel-enter");
  expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(card).toBeFocused();
  await expect(search).toHaveValue("Assegai");
  await expect(page).toHaveURL(/category=tire&q=Assegai/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("reduced motion removes surface and hover movement without blocking navigation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/componentes?category=tire&q=Assegai");
  const card = page.locator(".product-card").first();
  await card.hover();
  await expect(card.locator(".product-media img")).toHaveCSS("transform", "none");
  await card.click();
  const dialog = page.getByRole("dialog", { name: "Detalle de la pieza" });
  await expect(dialog).toHaveCSS("animation-name", "none");
  await expect(dialog).toHaveCSS("transition-duration", "0s");
  await page.keyboard.press("Escape");
  await expect(card).toBeFocused();
  await page.getByRole("link", { name: "Bicicletas", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Bicicletas." })).toBeVisible();
  expect(await page.locator(".route-content").evaluate(element => element.getAnimations().length)).toBe(0);
});

test("a preference change cancels in-flight content motion and retains editable controls", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/entrar");
  await page.getByRole("textbox", { name: "Correo electrónico" }).fill("rider@example.test");
  // Observe the actual region animation across a client-side route change.
  await page.evaluate(() => {
    const original = Element.prototype.animate;
    Element.prototype.animate = function (...args: Parameters<Element["animate"]>) {
      const animation = original.apply(this, args);
      if (this.classList.contains("route-content")) {
        animation.pause();
        (window as unknown as { routeAnimation: Animation }).routeAnimation = animation;
      }
      return animation;
    };
  });
  await page.getByRole("link", { name: "Crear cuenta", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Crear cuenta", exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as unknown as { routeAnimation: Animation }).routeAnimation?.playState)).toBe("paused");
  const email = page.getByRole("textbox", { name: "Correo electrónico" });
  await email.fill("retained@example.test");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => page.evaluate(() => (window as unknown as { routeAnimation: Animation }).routeAnimation.playState)).toBe("idle");
  await expect(email).toHaveValue("retained@example.test");
  await email.focus();
  await expect(email).toBeFocused();
});
