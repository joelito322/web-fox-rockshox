import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const rows = JSON.parse(
  readFileSync(
    process.argv.includes("--v30")
      ? "models/catalog-v30/predecessors.json"
      : process.argv.includes("--v29")
        ? "models/catalog-v29/predecessors.json"
        : process.argv.includes("--v28")
          ? "models/catalog-v28/predecessors.json"
          : process.argv.includes("--v27")
            ? "models/catalog-v27/predecessors.json"
            : process.argv.includes("--v26")
              ? "models/catalog-v26/predecessors.json"
              : process.argv.includes("--v25")
                ? "models/catalog-v25/predecessors.json"
                : process.argv.includes("--v24")
                  ? "models/catalog-v24/predecessors.json"
                  : process.argv.includes("--v23")
                    ? "models/catalog-v23/predecessors.json"
                    : process.argv.includes("--v22")
                      ? "models/catalog-v22/predecessors.json"
                      : process.argv.includes("--v21")
                        ? "models/catalog-v21/predecessors.json"
                        : process.argv.includes("--v20")
                          ? "models/catalog-v20/predecessors.json"
                          : process.argv.includes("--v19")
                            ? "models/catalog-v19/predecessors.json"
                            : process.argv.includes("--v18")
                              ? "models/catalog-v18/predecessors.json"
                              : process.argv.includes("--v17")
                                ? "models/catalog-v17/predecessors.json"
                                : process.argv.includes("--v16")
                                  ? "models/catalog-v16/predecessors.json"
                                  : process.argv.includes("--v15")
                                    ? "models/catalog-v15/predecessors.json"
                                    : process.argv.includes("--v14")
                                      ? "models/catalog-v14/predecessors.json"
                                      : process.argv.includes("--v13")
                                        ? "models/catalog-v13/predecessors.json"
                                        : process.argv.includes("--v12")
                                          ? "models/catalog-v12/predecessors.json"
                                          : process.argv.includes("--v11")
                                            ? "models/catalog-v11/predecessors.json"
                                            : "models/catalog-v10/predecessors.json",
    "utf8",
  ),
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
    (process.env.ATLAS_BASE_URL ?? "http://127.0.0.1:5174") +
      "/tests/fixtures/" +
      (process.argv.includes("--v30")
        ? "frame-v30-review.html"
        : process.argv.includes("--v29")
          ? "frame-v29-review.html"
          : process.argv.includes("--v28")
            ? "frame-v28-review.html"
            : process.argv.includes("--v27")
              ? "frame-v27-review.html"
              : process.argv.includes("--v26")
                ? "frame-v26-review.html"
                : process.argv.includes("--v25")
                  ? "frame-v25-review.html"
                  : process.argv.includes("--v24")
                    ? "frame-v24-review.html"
                    : process.argv.includes("--v23")
                      ? "frame-v23-review.html"
                      : process.argv.includes("--v22")
                        ? "frame-v22-review.html"
                        : process.argv.includes("--v21")
                          ? "frame-v21-review.html"
                          : process.argv.includes("--v20")
                            ? "frame-v20-review.html"
                            : process.argv.includes("--v19")
                              ? "frame-v19-review.html"
                              : process.argv.includes("--v18")
                                ? "frame-v18-review.html"
                                : process.argv.includes("--v17")
                                  ? "frame-v17-review.html"
                                  : process.argv.includes("--v16")
                                    ? "frame-v16-review.html"
                                    : process.argv.includes("--v15")
                                      ? "frame-v15-review.html"
                                      : process.argv.includes("--v14")
                                        ? "frame-v14-review.html"
                                        : process.argv.includes("--v13")
                                          ? "frame-v13-review.html"
                                          : process.argv.includes("--v12")
                                            ? "frame-v12-review.html"
                                            : process.argv.includes("--v11")
                                              ? "frame-v11-review.html"
                                              : "frame-review.html") +
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
