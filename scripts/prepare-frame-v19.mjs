// Offline capture first. --apply uploads only immutable content-addressed GLBs, never publishes choices.
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { v5 as uuid } from "./lib/uuid.mjs";
import { parseCatalogImport } from "../src/features/catalog/model/ingestion.ts";
import { readProjectEnvironment } from "./lib/environment.mjs";
const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const rows = read("models/catalog-v19/predecessors.json"),
  out = "models/catalog-v19/exports";
mkdirSync(out, { recursive: true });
const historyPath = "models/catalog-v19/uploads.json",
  history = existsSync(historyPath) ? read(historyPath) : [];
const ns = "df29e6ee-1845-5df4-80e7-c9f5ac4169c0";
const brandSources = ["visual-v7-reviewed", "gravity-reviewed"].flatMap(
  (n) => read(`supabase/catalog/${n}.json`).brands,
);
const unique = (rows) => [...new Map(rows.map((r) => [r.id, r])).values()];
const source = {
    brands: unique(
      brandSources.filter((b) =>
        rows.some((r) => r.component.brand_id === b.id),
      ),
    ),
    components: unique(rows.map((r) => r.component)),
    assets: [],
    variants: [],
  },
  mapping = {},
  captures = [];
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
try {
  const page = await browser.newPage();
  await page.goto(
    (process.env.ATLAS_BASE_URL ?? "http://127.0.0.1:5174") +
      "/tests/fixtures/frame-v19-review.html?version=v19",
  );
  await page.waitForFunction(
    () => typeof window.atlasExportFrame === "function",
  );
  for (const row of rows) {
    const result = await page.evaluate(
        (id) => window.atlasExportFrame(id),
        row.variant.id,
      ),
      bytes = Buffer.from(result.data, "base64"),
      sha256 = createHash("sha256").update(bytes).digest("hex");
    const variant = structuredClone(row.variant),
      asset = structuredClone(row.asset);
    variant.id = uuid("variant-v19:" + row.variant.id, ns);
    asset.id = uuid("asset-v19:" + row.variant.id, ns);
    variant.visual_asset_id = asset.id;
    variant.selectable = true;
    const prior = history.find((r) => r.variant_id === variant.id);
    if (prior?.published_at && prior.sha256 !== sha256)
      throw Error("Published v19 is immutable; use another identity/version");
    asset.storage_path = `catalog/v19/${row.slug}/${sha256.slice(0, 24)}.glb`;
    asset.kind = "glb";
    asset.generator_key = null;
    asset.manifest.anchors = result.anchors;
    asset.manifest.paintable_nodes = result.paintable_nodes;
    asset.reference_notes =
      "COMMENCAL FURIOUS V3 Gun Metal: perfiles propios de aluminio, diagonal acodada y bieleta calada; conserva anclajes y los otros catorce cuadros. Fuentes heredadas y límites: models/catalog-v19/README.md. No CAD.";
    const file =
      row.slug +
      "--" +
      variant.specs.size_label.toLowerCase().replaceAll("″", "in") +
      ".glb";
    writeFileSync(out + "/" + file, bytes);
    captures.push({
      variant_id: variant.id,
      predecessor_id: row.variant.id,
      asset_id: asset.id,
      file,
      storage_path: asset.storage_path,
      bytes: bytes.length,
      sha256,
      ...(prior?.published_at ? { published_at: prior.published_at } : {}),
    });
    source.variants.push(variant);
    source.assets.push(asset);
    mapping[row.variant.id] = variant.id;
  }
} finally {
  await browser.close();
}
parseCatalogImport(source);
writeFileSync(
  "supabase/catalog/frames-v19-reviewed.json",
  JSON.stringify(source, null, 2) + "\n",
);
writeFileSync(
  "supabase/catalog/frames-v19-successors.json",
  JSON.stringify(mapping, null, 2) + "\n",
);
writeFileSync(historyPath, JSON.stringify(captures, null, 2) + "\n");
if (process.argv.includes("--apply")) {
  const env = readProjectEnvironment(),
    client = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  for (const c of captures) {
    const bytes = readFileSync(out + "/" + c.file),
      { error } = await client.storage
        .from("models")
        .upload(c.storage_path, bytes, {
          contentType: "model/gltf-binary",
          cacheControl: "31536000",
          upsert: false,
        });
    if (error && !["409", "400"].includes(String(error.statusCode)))
      throw Error("Frame upload failed");
    const { data } = client.storage.from("models").getPublicUrl(c.storage_path),
      response = await fetch(data.publicUrl);
    if (
      !response.ok ||
      createHash("sha256")
        .update(Buffer.from(await response.arrayBuffer()))
        .digest("hex") !== c.sha256
    )
      throw Error("Frame storage verification failed");
    c.published_at ??= new Date().toISOString();
  }
  writeFileSync(historyPath, JSON.stringify(captures, null, 2) + "\n");
}
console.log(
  JSON.stringify({
    models: source.components.length,
    captures: captures.length,
    bytes: captures.reduce((s, c) => s + c.bytes, 0),
    uploaded: process.argv.includes("--apply"),
  }),
);
