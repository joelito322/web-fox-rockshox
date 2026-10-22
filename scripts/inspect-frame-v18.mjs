import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
try {
  const page = await browser.newPage();
  await page.goto(
    (process.env.ATLAS_BASE_URL ?? "http://127.0.0.1:5174") +
      "/tests/fixtures/frame-v18-review.html?version=v18",
  );
  await page.waitForFunction(
    () => typeof window.atlasInspectBores === "function",
  );
  const results = await page.evaluate(() => window.atlasInspectBores());
  const blocked = results.flatMap((r) =>
    r.probes
      .filter((p) => p.after > 0)
      .map((p) => ({ slug: r.slug, size: r.size, ...p })),
  );
  writeFileSync(
    "models/catalog-v18/bore-review.json",
    JSON.stringify(
      { checked_at: new Date().toISOString(), results, blocked },
      null,
      2,
    ) + "\n",
  );
  console.log(
    JSON.stringify({
      captures: results.length,
      rays: results.reduce((s, r) => s + r.probes.length, 0),
      blockedBefore: results
        .flatMap((r) => r.probes)
        .filter((p) => p.before > 0).length,
      blockedAfter: blocked.length,
      maxBoundsDelta: Math.max(...results.map((r) => r.boundsDelta)),
    }),
  );
  if (blocked.length) process.exitCode = 1;
} finally {
  await browser.close();
}
