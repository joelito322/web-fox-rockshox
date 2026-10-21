// Static catalogue views of existing ATLAS geometry; no new commercial models or Cloud writes.
import { createClient } from "@supabase/supabase-js";
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { readProjectEnvironment } from "./lib/environment.mjs";
const env = readProjectEnvironment();
const client = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data, error } = await client
  .from("components")
  .select("slug,name,category,component_variants!inner(id,allowed_finishes)")
  .like("slug", "atlas-%")
  .eq("published", true)
  .eq("component_variants.published", true)
  .eq("component_variants.selectable", true)
  .order("slug");
if (error) throw Error("Cannot read published ATLAS references");
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
try {
  const page = await browser.newPage();
  await page.goto(
    (process.env.ATLAS_BASE_URL ?? "http://127.0.0.1:5174") +
      "/tests/fixtures/thumbnail-capture.html",
  );
  await page.waitForFunction(
    () => typeof window.atlasCaptureComponent === "function",
  );
  for (const component of data) {
    const variant = component.component_variants[0];
    const configuration = {
      schemaVersion: 1,
      name: component.name,
      items: [
        {
          slot: component.category,
          variantId: variant.id,
          finishId: variant.allowed_finishes.default_finish_id,
          customColor: null,
        },
      ],
    };
    const image = await page.evaluate(
      (configuration) => window.atlasCaptureComponent(configuration),
      configuration,
    );
    if (!image || image.type !== "image/webp")
      throw Error("Component image unavailable");
    if (process.argv.includes("--apply"))
      writeFileSync(
        `src/assets/images/catalog/${component.slug}.webp`,
        Buffer.from(image.data, "base64"),
      );
    console.log(
      JSON.stringify({
        slug: component.slug,
        bytes: image.bytes,
        representation: "existing-3d-render",
        applied: process.argv.includes("--apply"),
      }),
    );
  }
} finally {
  await browser.close();
}
