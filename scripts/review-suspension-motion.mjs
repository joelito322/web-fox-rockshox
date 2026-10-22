import { chromium } from "@playwright/test";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
const profiles = JSON.parse(
  readFileSync(
    "src/features/configurator/model/suspension/profiles.json",
    "utf8",
  ),
);
const single = process.argv.find((a) => a.startsWith("--model="))?.slice(8);
const all = process.argv.includes("--all"),
  models = single
    ? [single]
    : all
      ? Object.keys(profiles)
      : [
          "commencal-supreme-dh-v5",
          "santa-cruz-v10-8-my27",
          "yt-tues-mk4-carbon",
          "commencal-meta-sx-v5",
        ];
const out =
  process.env.ATLAS_MOTION_REVIEW_OUTPUT ?? "/tmp/atlas-motion-review";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const results = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1400, height: 1000 },
  });
  // Explicit internal review mode: inspect unpublished GLBs without uploading draft bytes.
  const localVersions = (process.env.ATLAS_LOCAL_MODEL_VERSIONS ?? "")
    .split(",")
    .filter(Boolean);
  const localCaptures = new Map();
  for (const version of localVersions) {
    if (!/^v[0-9]+$/.test(version)) throw Error("Invalid local model version");
    const captures = JSON.parse(
      readFileSync(`models/catalog-${version}/uploads.json`, "utf8"),
    );
    for (const capture of captures) {
      if (capture.file.includes("/") || capture.file.includes("\\"))
        throw Error("Invalid capture file");
      localCaptures.set(
        "/storage/v1/object/public/models/" + capture.storage_path,
        `models/catalog-${version}/exports/` + capture.file,
      );
    }
  }
  if (localCaptures.size)
    await page.route(
      "**/storage/v1/object/public/models/catalog/**",
      async (route) => {
        const file = localCaptures.get(new URL(route.request().url()).pathname);
        if (file)
          await route.fulfill({
            status: 200,
            contentType: "model/gltf-binary",
            body: readFileSync(file),
            headers: { "access-control-allow-origin": "*" },
          });
        else await route.continue();
      },
    );
  page.setDefaultTimeout(45000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(
    (process.env.ATLAS_BASE_URL ?? "http://127.0.0.1:5174") +
      "/tests/fixtures/suspension-review.html" +
      (process.argv.includes("--v30")
      ? "?version=v30"
      : process.argv.includes("--v29")
      ? "?version=v29"
        : process.argv.includes("--v28")
          ? "?version=v28"
          : process.argv.includes("--v27")
            ? "?version=v27"
            : process.argv.includes("--v26")
              ? "?version=v26"
              : process.argv.includes("--v25")
                ? "?version=v25"
                : process.argv.includes("--v24")
                  ? "?version=v24"
                  : process.argv.includes("--v23")
                    ? "?version=v23"
                    : process.argv.includes("--v22")
                      ? "?version=v22"
                      : process.argv.includes("--v21")
                        ? "?version=v21"
                        : process.argv.includes("--v20")
                          ? "?version=v20"
                          : process.argv.includes("--v19")
                            ? "?version=v19"
                            : process.argv.includes("--v18")
                              ? "?version=v18"
                              : process.argv.includes("--v17")
                                ? "?version=v17"
                                : process.argv.includes("--v16")
                                  ? "?version=v16"
                                  : process.argv.includes("--v15")
                                    ? "?version=v15"
                                    : process.argv.includes("--v14")
                                      ? "?version=v14"
                                      : process.argv.includes("--v13")
                                        ? "?version=v13"
                                        : process.argv.includes("--v12")
                                          ? "?version=v12"
                                          : process.argv.includes("--v11")
                                            ? "?version=v11"
                                            : process.argv.includes("--v10")
                                              ? "?version=v10"
                                              : ""),
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
      // Internal still-pose inspection; product sliders intentionally stay neutral until Play.
      await page.evaluate(
        (value) => window.atlasMotionReview.pose(value, value),
        Number(value) / 100,
      );
      await page.waitForTimeout(250);
      await page
        .locator("canvas")
        .screenshot({ path: `${out}/${model}-${label}.png` });
    }
    const compressed = await page.evaluate(() =>
      window.atlasMotionReview.inspect(),
    );
    if (
      !neutral ||
      !compressed ||
      JSON.stringify(neutral) === JSON.stringify(compressed)
    )
      throw Error("Inspection did not move: " + model);
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
