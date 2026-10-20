// All 53 model profiles, all variant captures, four camera views per model.
import { chromium } from "@playwright/test";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { installSceneMetrics } from "./lib/scene-metrics.mjs";
const version=process.argv.find(a=>a.startsWith('--version='))?.split('=')[1]??'v4';
if(!['v3','v4','v5'].includes(version))throw Error('Unsupported review version');
const catalog = JSON.parse(
  readFileSync(`supabase/catalog/visual-${version}-reviewed.json`, "utf8"),
);
const directory = `/tmp/atlas-visual-${version}-review`;
mkdirSync(directory, { recursive: true });
const mobile = process.argv.includes("--mobile");
const browser = await chromium.launch({
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const results = [];
const category = process.argv
  .find((a) => a.startsWith("--category="))
  ?.split("=")[1];
const selectedModel = process.argv
  .find((a) => a.startsWith("--model="))
  ?.split("=")[1];
try {
  const openPage = async () => { const page = await browser.newPage({
    viewport: mobile
      ? { width: 412, height: 915 }
      : { width: 1440, height: 950 },
    isMobile: mobile,
    hasTouch: mobile,
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(installSceneMetrics);return page;};
  const errors=[];let page=await openPage();let visited=0;
  for (const model of catalog.components.filter(
    (c) =>
      (!category || c.category === category) &&
      (!selectedModel || c.slug === selectedModel),
  )) {
    const all = catalog.variants.filter((v) => v.component_id === model.id);
    const choices = process.argv.includes("--models-only")
      ? all.slice(0, 1)
      : all;
    for (let i = 0; i < choices.length; i++) {
      if(visited++>0 && visited%8===0){await page.close();page=await openPage();}
      const v = choices[i],
        before = errors.length,
        discipline =
          model.disciplines.includes("downhill") &&
          !model.disciplines.includes("enduro")
            ? "downhill"
            : "enduro";
      await page.goto(
        "http://127.0.0.1:5174/tests/fixtures/scene-preview.html?variant=" +
          v.id +
          "&discipline=" +
          discipline + "&generation="+version,
      );
      await page.waitForFunction(
        () => window.atlasSceneProof?.firstDrawMs != null,
        { timeout: 30000 },
      );
      await page.waitForTimeout(80);
      if (errors.length > before)
        throw Error(model.slug + ": " + errors.slice(before).join(", "));
      const metrics = await page.evaluate(() => {
        const p = window.atlasSceneProof;
        return {
          firstDrawMs: Math.round(p.firstDrawMs),
          triangles: Math.max(p.maxTriangles, p.triangles),
          drawCalls: Math.max(p.maxCalls, p.calls),
        };
      });
      if (i === 0)
        for (const camera of (process.argv.includes("--front-only")?["frontal"]:["lateral","perspectiva","frontal","superior"])) {
          await page
            .getByRole("combobox", { name: "Cámara de revisión" })
            .selectOption(camera);
          await page.waitForTimeout(150);
          await page.screenshot({
            path: `${directory}/${model.slug}-${camera}${mobile ? "-mobile" : ""}.png`,
          });
        }
      results.push({
        model: model.slug,
        variant: v.id,
        draft: !v.published,
        ...metrics,
      });
    }
    console.log(model.slug + ": " + choices.length + " captures rendered");
  }
  const report = {
    context:
      "Chromium SwiftShader " +
      (mobile ? "Android touch emulation" : "desktop") +
      "; rendering coverage, not a percentage-of-fidelity certification or physical Android benchmark",
    models: new Set(results.map((r) => r.model)).size,
    variants: results.length,
    maxDrawCalls: Math.max(...results.map((r) => r.drawCalls)),
    maxTriangles: Math.max(...results.map((r) => r.triangles)),
    results,
  };
  writeFileSync(
    directory +
      "/results" +
      (mobile ? "-mobile" : "") +
      (process.argv.includes("--front-only") ? "-frontal" : "") +
      (selectedModel ? "-" + selectedModel : category ? "-" + category : "") +
      ".json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify({ ...report, results: undefined }));
} finally {
  await browser.close();
}
