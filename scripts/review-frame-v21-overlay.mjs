import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const rows = JSON.parse(readFileSync("models/catalog-v21/predecessors.json"));
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
mkdirSync("/tmp/atlas-frames-v21", { recursive: true });
try {
  const p = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await p.goto(
    (process.env.ATLAS_BASE_URL ?? "http://127.0.0.1:5174") +
      "/tests/fixtures/frame-v21-review.html?version=v21&ortho=1",
  );
  await p.waitForFunction(() => window.atlasFramesReady);
  const results = [];
  for (const r of rows) {
    const x = await p.evaluate(
      (id) => window.atlasOverlayFrame(id),
      r.variant.id,
    );
    writeFileSync(
      "/tmp/atlas-frames-v21/overlay-" + r.variant.specs.size_label + ".png",
      Buffer.from(x.data.split(",")[1], "base64"),
    );
    delete x.data;
    results.push(x);
  }
  writeFileSync(
    "models/catalog-v21/overlay-review.json",
    JSON.stringify({ checked_at: new Date().toISOString(), results }, null, 2) +
      "\n",
  );
  console.log("Two orthographic photo overlays captured");
} finally {
  await browser.close();
}
