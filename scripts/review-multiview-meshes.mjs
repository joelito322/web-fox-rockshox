// Local inspection of both sides, depth and underside; no cloud writes.
import { chromium } from "@playwright/test";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
const version =
  process.argv.find((a) => a.startsWith("--version="))?.split("=")[1] ?? "v6";
if (!["v5", "v6"].includes(version)) throw Error("Unsupported review version");
const all = Object.entries(
  JSON.parse(readFileSync(`models/catalog-${version}/exports/manifest.json`)),
);
const rows = all.filter(
  ([, r], i) =>
    all.findIndex(([, x]) => x.model === r.model) === i &&
    (!process.argv.includes("--frames-only") || r.category === "frame"),
);
const output = `/tmp/atlas-${version}-multiview`;
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const results = [];
try {
  for (const [id, row] of rows) {
    for (const camera of [
      "right",
      "left",
      "front",
      "top",
      "bottom",
      "diagonal",
      "opposite",
    ]) {
      const page = await browser.newPage({
        viewport: { width: 1100, height: 850 },
      });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(
        `http://127.0.0.1:5174/tests/fixtures/catalog-mesh-review.html?generation=${version}&camera=${camera}`,
      );
      await page.getByRole("combobox", { name: "Modelo" }).selectOption(id);
      await page.waitForFunction(() => !!document.querySelector("canvas"));
      await page.waitForTimeout(650);
      if (errors.length) throw Error(row.model + ": " + errors.join("; "));
      await page.screenshot({ path: `${output}/${row.model}-${camera}.png` });
      await page.close();
      results.push({ model: row.model, camera });
    }
    console.log(`Reviewed ${row.model} in seven directions.`);
  }
  writeFileSync(
    `${output}/${process.argv.includes("--frames-only") ? "frames-results" : "results"}.json`,
    JSON.stringify(results, null, 2) + "\n",
  );
} finally {
  await browser.close();
}
