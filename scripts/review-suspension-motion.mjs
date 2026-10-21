import { chromium } from "@playwright/test";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
const profiles = JSON.parse(
  readFileSync(
    "src/features/configurator/model/suspension/profiles.json",
    "utf8",
  ),
);
const all = process.argv.includes("--all"),
  models = all
    ? Object.keys(profiles)
    : [
        "commencal-supreme-dh-v5",
        "santa-cruz-v10-8-my27",
        "yt-tues-mk4-carbon",
        "commencal-meta-sx-v5",
      ];
const out = "/tmp/atlas-motion-review";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const results = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1400, height: 1000 },
  });
  page.setDefaultTimeout(45000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(
    (process.env.ATLAS_BASE_URL ?? "http://127.0.0.1:5174") +
      "/tests/fixtures/suspension-review.html",
  );
  for (const model of models) {
    await page.getByLabel("Cuadro", { exact: true }).selectOption(model);
    await page.waitForFunction(
      (slug) =>
        window.atlasMotionReview?.ready &&
        window.atlasMotionReview.slug === slug,
      model,
    );
    await page.waitForTimeout(200);
    await page.getByRole("button", { name: "Suspensión", exact: true }).click();
    await page.waitForTimeout(400);
    const neutral = await page.evaluate(() =>
      window.atlasMotionReview.inspect(),
    );
    await page
      .locator("canvas")
      .screenshot({ path: `${out}/${model}-rest.png` });
    for (const [label, value] of [
      ["half", "50"],
      ["full", "100"],
    ]) {
      for (const name of ["Compresión delantera", "Compresión trasera"])
        if (await page.getByLabel(name, { exact: true }).isEnabled())
          await page.getByLabel(name, { exact: true }).fill(value);
      await page.waitForTimeout(250);
      await page
        .locator("canvas")
        .screenshot({ path: `${out}/${model}-${label}.png` });
    }
    const compressed = await page.evaluate(() =>
      window.atlasMotionReview.inspect(),
    );
    const definition = await page.evaluate(
      () => window.atlasMotionReview.definition,
    );
    results.push({ model, definition, neutral, compressed });
    await page
      .getByRole("button", { name: "Restablecer suspensión", exact: true })
      .click();
    await page.getByRole("button", { name: "Suspensión", exact: true }).click();
    if (errors.length) throw Error(errors.join("\n"));
  }
  writeFileSync(`${out}/results.json`, JSON.stringify(results, null, 2) + "\n");
  console.log(
    JSON.stringify({
      models: results.length,
      captures: results.length * 3,
      errors,
      results: results.map((r) => ({
        model: r.model,
        angle: r.definition?.angle,
        inspectionObserved: !!r.compressed,
        position: r.compressed?.position,
      })),
    }),
  );
} finally {
  await browser.close();
}
