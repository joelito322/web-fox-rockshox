import { test, expect } from "@playwright/test";

const activeImage = ".campaign-photo.is-active img";
async function leaveCampaign(page: import("@playwright/test").Page) {
  await page.getByRole("link", { name: "ATLAS MTB, inicio" }).focus();
  await page.mouse.move(0, 0);
}

test("campaign advances photographs while preserving its headline and supports pause", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install();
  await page.goto("/");
  await expect(page.locator(activeImage)).toHaveAttribute("src", /alpine-wide/);
  const heading = await page.getByRole("heading", { level: 1 }).textContent();
  await page.clock.runFor(6500);
  await expect(page.locator(activeImage)).toHaveAttribute("src", /airtime-wide/);
  await page.getByRole("button", { name: "Pausar fotografías" }).click();
  await leaveCampaign(page);
  await page.clock.runFor(14000);
  await expect(page.locator(activeImage)).toHaveAttribute("src", /airtime-wide/);
  await expect(page.locator(activeImage)).toHaveCSS("animation-play-state", "paused");
  await page.getByRole("button", { name: "Fotografía siguiente" }).click();
  await expect(page.locator(activeImage)).toHaveAttribute("src", /lines-wide/);
  await page.getByRole("button", { name: "Reproducir fotografías" }).click();
  await leaveCampaign(page);
  await page.clock.runFor(6500);
  await expect(page.locator(activeImage)).toHaveAttribute("src", /alpine-wide/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading!);
  await expect(page.getByRole("link", { name: "Crear mi bicicleta" })).toBeVisible();
});

test("reduced motion keeps one static photo and allows manual navigation", async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install();
  await page.goto("/");
  await expect(page.locator(activeImage)).toBeVisible();
  const suffix = info.project.name === "mobile" ? "-mobile.webp" : "-wide.webp";
  expect(await page.locator(activeImage).evaluate((image: HTMLImageElement) => image.currentSrc)).toContain("alpine" + suffix);
  await page.clock.runFor(20000);
  await expect(page.locator(activeImage)).toHaveAttribute("src", /alpine-wide/);
  await expect(page.getByRole("button", { name: "Pausar fotografías" })).toHaveCount(0);
  await expect(page.locator(activeImage)).toHaveCSS("animation-name", "none");
  await page.getByRole("button", { name: "Fotografía siguiente" }).click();
  await expect(page.locator(activeImage)).toHaveAttribute("src", /airtime-wide/);
  await expect(page.locator(".campaign-photo.is-active")).toHaveCSS("transition-duration", "0s");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("a delayed photograph retains the previous picture until delivery completes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  let release!: () => void;
  const delivery = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/*airtime*webp", async route => { await delivery; await route.continue(); });
  try {
    await page.goto("/");
    await expect(page.locator(activeImage)).toHaveAttribute("src", /alpine-wide/);
    const requested = page.waitForRequest(r => r.resourceType() === "image" && r.url().includes("airtime"));
    await page.getByRole("button", { name: "Fotografía siguiente" }).click();
    await requested;
    await expect(page.locator(activeImage)).toHaveAttribute("src", /alpine-wide/);
    release();
    await expect(page.locator(activeImage)).toHaveAttribute("src", /airtime-wide/);
  } finally { release(); }
});

test("missing campaign images leave access and the public catalog available", async ({ page }) => {
  await page.route("**/*webp", route => route.request().resourceType() === "image" ? route.abort() : route.continue());
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Cada pieza");
  await expect(page.getByRole("button", { name: "Fotografía siguiente" })).toBeDisabled();
  await page.getByRole("link", { name: "Crear mi bicicleta" }).click();
  await expect(page).toHaveURL(/entrar/);
});
