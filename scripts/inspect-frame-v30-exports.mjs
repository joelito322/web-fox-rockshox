import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
try {
  const page = await browser.newPage();
  await page.goto(
    (process.env.ATLAS_BASE_URL ?? "http://127.0.0.1:5174") +
      "/tests/fixtures/frame-v30-review.html?version=v30",
  );
  await page.waitForFunction(
    () => typeof window.atlasInspectFrameExports === "function",
  );
  const results = await page.evaluate(() => window.atlasInspectFrameExports());
  if (
    results.length !== 2 ||
    results.some(
      (r) =>
        !r.finite ||
        r.meshes > 8 ||
        r.bounds[0] > 1.2 ||
        r.bounds[1] > 0.95 ||
        r.bounds[2] > 0.25 ||
        !r.paint ||
        !r.anchors ||
        r.triangles === 0 ||
        r.bounds.some((n) => !Number.isFinite(n) || n <= 0),
    )
  )
    throw Error("Export contract failed");
  writeFileSync(
    "models/catalog-v30/inspection.json",
    JSON.stringify({ checked_at: new Date().toISOString(), results }, null, 2) +
      "\n",
  );
  console.log(
    JSON.stringify({
      captures: results.length,
      finite: true,
      paintNodes: true,
      anchors: true,
      meshes: [
        Math.min(...results.map((r) => r.meshes)),
        Math.max(...results.map((r) => r.meshes)),
      ],
    }),
  );
} finally {
  await browser.close();
}
