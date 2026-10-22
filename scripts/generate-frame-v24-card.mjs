// The user restored the real Sender photograph. Never overwrite it with a render.
if (process.argv.includes("--apply")) throw Error("Sender catalog photo restored by user; render overwrite disabled.");
// Honest catalog reference for MY25: render the new captured resource, never a photo of 2021.
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const captures = read("models/catalog-v24/uploads.json"),
  rows = read("models/catalog-v24/predecessors.json");
const capture = captures.find((c) => c.file.endsWith("--m.glb"));
const sha = (b) => createHash("sha256").update(b).digest("hex");
if (
  !capture ||
  sha(readFileSync("models/catalog-v24/exports/" + capture.file)) !==
    capture.sha256
)
  throw Error("Capture mismatch");
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 820 },
  });
  await page.goto(
    (process.env.ATLAS_BASE_URL ?? "http://127.0.0.1:5174") +
      "/tests/fixtures/frame-v24-review.html?version=v24&view=diagonal",
  );
  await page.waitForFunction(
    () => typeof window.atlasCaptureFrameCard === "function",
  );
  const image = await page.evaluate(
    (id) => window.atlasCaptureFrameCard(id),
    rows.find((r) => r.variant.id === capture.predecessor_id).variant.id,
  );
  const converted = spawnSync(
    "magick",
    [
      "png:-",
      "-trim",
      "+repage",
      "-resize",
      "760x500",
      "-gravity",
      "center",
      "-background",
      "none",
      "-extent",
      "800x540",
      "-quality",
      "90",
      "webp:-",
    ],
    {
      input: Buffer.from(image.data.split(",")[1], "base64"),
      maxBuffer: 4 * 1024 * 1024,
    },
  );
  if (converted.status !== 0) throw Error("Card conversion failed");
  const slug = "canyon-sender-cfr-high-pivot",
    file = slug + ".webp",
    meta = {
      slug,
      file,
      source_file: "models/catalog-v24/exports/" + capture.file,
      source_sha256: capture.sha256,
      representation: "published-3d-model-render",
      generation: "MY25 high-pivot",
      date: new Date().toISOString().slice(0, 10),
      script: "scripts/generate-frame-v24-card.mjs --apply",
      bytes: converted.stdout.length,
      sha256: sha(converted.stdout),
    };
  mkdirSync("/tmp/atlas-frames-v24", { recursive: true });
  writeFileSync(
    "/tmp/atlas-frames-v24/catalog-reference.webp",
    converted.stdout,
  );
  if (process.argv.includes("--apply")) {
    if (!capture.published_at)
      throw Error(
        "Upload and verify the immutable capture before applying the catalog reference",
      );
    const photoPath = "src/assets/images/catalog/photos.json",
      photos = read(photoPath),
      old = photos.find((p) => p.slug === slug);
    if (old)
      writeFileSync(
        "models/catalog-v24/references/prior-card-source.json",
        JSON.stringify(old, null, 2) + "\n",
      );
    writeFileSync("src/assets/images/catalog/" + file, converted.stdout);
    writeFileSync(
      photoPath,
      JSON.stringify(
        photos.filter((p) => p.slug !== slug),
        null,
        2,
      ) + "\n",
    );
    const renderPath = "src/assets/images/catalog/renders.json";
    writeFileSync(
      renderPath,
      JSON.stringify(
        [...read(renderPath).filter((r) => r.slug !== slug), meta],
        null,
        2,
      ) + "\n",
    );
    writeFileSync(
      "models/catalog-v24/card-reference.json",
      JSON.stringify(meta, null, 2) + "\n",
    );
  }
  console.log(
    JSON.stringify({ ...meta, applied: process.argv.includes("--apply") }),
  );
} finally {
  await browser.close();
}
