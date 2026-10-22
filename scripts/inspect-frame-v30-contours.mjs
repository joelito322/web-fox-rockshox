import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
try {
  const p = await browser.newPage();
  await p.goto(
    (process.env.ATLAS_BASE_URL ?? "http://127.0.0.1:5174") +
      "/tests/fixtures/frame-v30-review.html?version=v30",
  );
  await p.waitForFunction(
    () => typeof window.atlasInspectContours === "function",
  );
  const results = await p.evaluate(() => window.atlasInspectContours());
  const failures = results.flatMap((r) =>
      r.samples
        .filter((s) => s.after !== s.hit)
        .map((s) => ({ size: r.size, ...s })),
    ),
    summary = results.map((r) => ({
      size: r.size,
      samples: r.samples.length,
      beforeCorrectFailures: r.samples.filter(
        (s) => s.beforeCorrectRegistration !== s.hit,
      ).length,
      beforeLegacyFailures: r.samples.filter(
        (s) => s.beforeLegacyRegistration !== s.hit,
      ).length,
      afterFailures: r.samples.filter((s) => s.after !== s.hit).length,
    }));
  writeFileSync(
    "models/catalog-v30/contour-review.json",
    JSON.stringify(
      {
        checked_at: new Date().toISOString(),
        note: "Independent high-confidence photographic samples, not percent CAD resemblance or exhaustive contour acceptance",
        summary,
        failures,
        results,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(JSON.stringify({ summary, failures }));
  if (failures.length) process.exitCode = 1;
} finally {
  await browser.close();
}
