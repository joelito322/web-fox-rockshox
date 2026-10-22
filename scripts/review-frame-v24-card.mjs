// Read-only public catalog check: restored real photograph and real card presentation.
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  await page.goto(
    (process.env.ATLAS_BASE_URL ?? "http://127.0.0.1:5174") + "/componentes",
  );
  await page.getByLabel("Buscar componentes").fill("Sender");
  const card = page.locator(".product-card").filter({ hasText: "Sender CFR" });
  await card.waitFor({ state: "visible" });
  const img = card.locator("img").first();
  await img.waitFor();
  await img.evaluate(async (n) => {
    await n.decode();
  });
  const src = await img.getAttribute("src"),
    response = await page.request.get(new URL(src, page.url()).href),
    bytes = await response.body();
  const sha = (b) => createHash("sha256").update(b).digest("hex");
  if (
    sha(bytes) !==
    sha(
      readFileSync(
        "models/catalog-v24/references/prior-card-generation-2021.webp",
      ),
    )
  )
    throw Error("Catalog is not using the restored real photograph");
  mkdirSync("/tmp/atlas-frames-v24", { recursive: true });
  await card.screenshot({ path: "/tmp/atlas-frames-v24/catalog-card.png" });
  writeFileSync(
    "models/catalog-v24/card-review.json",
    JSON.stringify(
      {
        checked_at: new Date().toISOString(),
        model: "canyon-sender-cfr-high-pivot",
        original_photo: true,
        representation: "manufacturer-photo-background-removed",
        generation: "2021 reference restored by user",
        sha256: sha(bytes),
        bytes: bytes.length,
        source_file:
          "models/catalog-v24/references/prior-card-generation-2021.webp",
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "Restored real photograph verified in the public catalog card.",
  );
} finally {
  await browser.close();
}
