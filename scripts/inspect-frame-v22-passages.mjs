// Full-envelope passage validation, including every detail mesh and outer cheek.
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
try {
  const page = await browser.newPage();
  await page.goto(
    (process.env.ATLAS_BASE_URL ?? "http://127.0.0.1:5174") +
      "/tests/fixtures/frame-v22-review.html?version=v22",
  );
  await page.waitForFunction(
    () => typeof window.atlasInspectFullPassages === "function",
  );
  const results = await page.evaluate(() => window.atlasInspectFullPassages());
  const blocked = results.flatMap((r) =>
    r.bottom_bracket.probes
      .filter((p) => p.hits.length > 0)
      .map((p) => ({ size: r.size, ...p })),
  );
  writeFileSync(
    "models/catalog-v22/passage-review.json",
    JSON.stringify(
      { checked_at: new Date().toISOString(), results, blocked },
      null,
      2,
    ) + "\n",
  );
  console.log(
    JSON.stringify({
      rays: results.reduce((s, r) => s + r.bottom_bracket.probes.length, 0),
      blocked: blocked.length,
      seat_axis_delta_deg: results.map((r) => r.seat_axis_delta_deg),
    }),
  );
  if (blocked.length || results.some((r) => r.seat_axis_delta_deg > 0.5))
    process.exitCode = 1;
} finally {
  await browser.close();
}
