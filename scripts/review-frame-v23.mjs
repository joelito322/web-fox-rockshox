import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const rows = JSON.parse(
  readFileSync("models/catalog-v23/predecessors.json", "utf8"),
);
const all = process.argv.includes("--all");
const output =
  process.env.ATLAS_FRAME_REVIEW_OUTPUT ?? "/tmp/atlas-frames-baseline";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 820 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(
    (process.env.ATLAS_BASE_URL ?? "http://127.0.0.1:5198") +
      "/tests/fixtures/frame-v23-review.html?version=v23",
  );
  await page.waitForFunction(() => window.atlasFramesReady);
  const seen = new Set(),
    results = [];
  for (const row of rows) {
    if (!all && seen.has(row.slug)) continue;
    seen.add(row.slug);
    for (const view of [
      "lateral",
      "opuesta",
      "frontal",
      "superior",
      "inferior",
      "diagonal",
      "diagonal-opuesta",
    ]) {
      const result = await page.evaluate(
        async ({ id, view }) => window.atlasReviewFrame(id, view),
        { id: row.variant.id, view },
      );
      const name = `${row.slug}--${row.variant.specs.size_label}-${view}.png`;
      writeFileSync(
        output + "/" + name,
        Buffer.from(result.data.split(",")[1], "base64"),
      );
      delete result.data;
      results.push({ ...result, view, file: name });
    }
  }
  writeFileSync(
    output + "/results.json",
    JSON.stringify(
      { models: seen.size, captures: results.length, errors, results },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({
      models: seen.size,
      captures: results.length,
      errors,
      output,
    }),
  );
} finally {
  await browser.close();
}
