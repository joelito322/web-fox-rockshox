import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const rows = JSON.parse(readFileSync("models/catalog-v30/predecessors.json"));
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
mkdirSync("/tmp/atlas-v30-details", { recursive: true });
try {
  const p = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  await p.goto(
    (process.env.ATLAS_BASE_URL ?? "http://127.0.0.1:5174") +
      "/tests/fixtures/frame-v30-review.html?version=v30",
  );
  await p.waitForFunction(() => window.atlasFramesReady);
  for (const r of rows)
    for (const view of [
      "headset",
      "head-side",
      "head-front",
      "head-rear",
      "head-low",
    ]) {
      const result = await p.evaluate(
        async ({ id, view }) => window.atlasReviewFrame(id, view),
        { id: r.variant.id, view },
      );
      writeFileSync(
        "/tmp/atlas-v30-details/" +
          r.slug +
          "--" +
          r.variant.specs.size_label.toLowerCase().replaceAll("″", "in") +
          "-" +
          view +
          ".png",
        Buffer.from(result.data.split(",")[1], "base64"),
      );
    }
  writeFileSync(
    "models/catalog-v30/detail-review.json",
    JSON.stringify(
      {
        checked_at: new Date().toISOString(),
        models: 1,
        variants: rows.length,
        views: ["headset", "head-side", "head-front", "head-rear", "head-low"],
        captures: rows.length * 5,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(rows.length * 5 + " detail views captured");
} finally {
  await browser.close();
}
