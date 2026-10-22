// Historical render inspection only. The FRS catalog card now uses its official photograph.
if (process.argv.includes("--apply"))
  throw Error(
    "FRS uses the original Pure White photograph. This historical renderer must not overwrite the catalog image.",
  );
// Static image from the exact published FRS GLB; local asset write only with --apply.
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
try {
  const page = await browser.newPage();
  await page.goto(
    (process.env.ATLAS_BASE_URL ?? "http://127.0.0.1:5174") +
      "/tests/fixtures/gravity-review.html",
  );
  await page.waitForFunction(
    () => typeof window.atlasCaptureGravityImage === "function",
  );
  const data = await page.evaluate(() =>
    window.atlasCaptureGravityImage("commencal-frs-v3"),
  );
  const bytes = Buffer.from(data, "base64");
  if (process.argv.includes("--apply")) {
    const converted = spawnSync(
      "magick",
      ["webp:-", "-resize", "800x500", "-quality", "90", "webp:-"],
      { input: bytes, maxBuffer: 2 * 1024 * 1024 },
    );
    if (converted.status !== 0)
      throw Error("Unable to optimize the GLB reference image.");
    writeFileSync(
      "src/assets/images/catalog/commencal-frs-v3.webp",
      converted.stdout,
    );
  }
  console.log(
    JSON.stringify({
      model: "commencal-frs-v3",
      representation: "published-glb-render",
      applied: process.argv.includes("--apply"),
    }),
  );
} finally {
  await browser.close();
}
