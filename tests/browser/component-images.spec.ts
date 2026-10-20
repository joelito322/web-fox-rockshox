import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const photos = JSON.parse(readFileSync(
  new URL("../../src/assets/images/catalog/photos.json", import.meta.url), "utf8",
)) as Array<{ slug: string; file: string }>;

test("all reviewed component photographs load across the public catalogue pages", async ({ page }) => {
  test.setTimeout(60000);
  await page.goto("/componentes");
  const seen = new Set<string>();
  let pages = 0;
  while (true) {
    const cards = page.locator(".product-card");
    await expect(cards.first()).toBeVisible();
    const first = await cards.first().textContent();
    const results = await cards.locator("img").evaluateAll(async images => {
      return Promise.all(images.map(async image => {
        const photo = image as HTMLImageElement;
        // Load below-the-fold lazy images too, so every delivered asset is decoded.
        photo.loading = "eager";
        await photo.decode();
        return { source: photo.currentSrc, width: photo.naturalWidth };
      }));
    });
    for (const result of results) {
      expect(result.width).toBeGreaterThan(0);
      for (const photo of photos) {
        if (result.source.includes(photo.file)) seen.add(photo.slug);
      }
    }
    pages++;
    const next = page.getByRole("button", { name: "Siguiente", exact: true });
    if (!await next.count() || await next.isDisabled()) break;
    expect(pages).toBeLessThan(10);
    await next.click();
    await expect(cards.first()).not.toHaveText(first!);
  }
  expect([...seen].sort()).toEqual(photos.map(photo => photo.slug).sort());
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
