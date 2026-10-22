import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const rows = JSON.parse(readFileSync("models/catalog-v23/predecessors.json")),
  browser = await chromium.launch({
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  }),
  output = "/tmp/atlas-v23-linkage";
mkdirSync(output, { recursive: true });
try {
  const p = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await p.goto(
    (process.env.ATLAS_BASE_URL ?? "http://127.0.0.1:5198") +
      "/tests/fixtures/frame-v23-review.html?version=v23",
  );
  await p.waitForFunction(() => window.atlasFramesReady);
  const results = [];
  for (const r of rows)
    for (const kind of ["link", "opposite", "above", "rear"]) {
      const result = await p.evaluate(
          ({ id, kind }) => window.atlasEnduroDetail(id, kind),
          { id: r.variant.id, kind },
        ),
        file = r.variant.specs.size_label + "-" + kind + ".png";
      writeFileSync(
        output + "/" + file,
        Buffer.from(result.data.split(",")[1], "base64"),
      );
      delete result.data;
      results.push({ ...result, file });
    }
  writeFileSync(
    "models/catalog-v23/linkage-review.json",
    JSON.stringify({ checked_at: new Date().toISOString(), results }, null, 2) +
      "\n",
  );
  console.log({ captures: results.length, output });
} finally {
  await browser.close();
}
