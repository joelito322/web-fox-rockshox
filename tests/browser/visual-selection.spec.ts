import { test, expect } from "@playwright/test";
import * as T from "three";
import { readFileSync } from "node:fs";
import { parseCatalogImport } from "../../src/features/catalog/model/ingestion";
import { presetImportSchema } from "../../src/features/catalog/model/presets";
import { installSceneMetrics } from "../../scripts/lib/scene-metrics.mjs";
const catalog = parseCatalogImport(
  JSON.parse(readFileSync("supabase/catalog/visual-v4-reviewed.json", "utf8")),
);
const presets = presetImportSchema.parse(
  JSON.parse(readFileSync("supabase/catalog/visual-v4-examples.json", "utf8")),
).presets;
for (const discipline of ["enduro", "downhill"])
  test(`direct mesh selection follows the ${discipline} assembly`, async ({
    page,
  }) => {
    await page.addInitScript(installSceneMetrics);
    await page.goto(
      `/tests/fixtures/scene-preview.html?discipline=${discipline}`,
    );
    await page.waitForFunction(
      () => (window as any).atlasSceneProof?.firstDrawMs != null,
    );
    const preset = presets.find((p) =>
      discipline === "downhill"
        ? p.slug.includes("supreme")
        : p.slug.includes("meta"),
    );
    const variant = catalog.variants.find(
      (v) => v.id === preset!.items.find((i) => i.slot === "frame")!.variantId,
    );
    const anchors = catalog.assets.find(
      (a) => a.id === variant!.visual_asset_id,
    )!.manifest.anchors;
    const canvas = page.locator("canvas"),
      bounds = (await canvas.boundingBox())!;
    const camera = new T.PerspectiveCamera(
        37,
        bounds.width / bounds.height,
        0.1,
        1000,
      ),
      target = new T.Vector3(0.17, 0.15, 0),
      fit = Math.max(1, 1.45 / (bounds.width / bounds.height));
    camera.position.copy(
      new T.Vector3(0.2, 0.25, 2.6).sub(target).multiplyScalar(fit).add(target),
    );
    camera.lookAt(target);
    camera.updateMatrixWorld();
    const seat = anchors.seat_tube.position,
      head = anchors.head_tube.position;
    const spot = new T.Vector3(
      (seat[0] + 0.012 + head[0]) / 2,
      (seat[1] - 0.025 + head[1]) / 2,
      0.02,
    ).project(camera);
    await page.mouse.click(
      bounds.x + ((spot.x + 1) / 2) * bounds.width,
      bounds.y + ((1 - spot.y) / 2) * bounds.height,
    );
    await expect(page.getByLabel("Pieza seleccionada")).toHaveText("Cuadro");
    const before = await canvas.screenshot();
    await page
      .getByRole("combobox", { name: "Cámara de revisión" })
      .selectOption("frontal");
    await expect(page.getByLabel("Pieza seleccionada")).toHaveText("Cuadro");
    await expect
      .poll(async () => !(await canvas.screenshot()).equals(before))
      .toBe(true);
  });

test("cached shadows survive camera changes and refresh when a piece changes", async ({
  page,
}) => {
  await page.addInitScript(installSceneMetrics);
  await page.goto("/tests/fixtures/scene-preview.html?controls=1");
  await page.waitForFunction(
    () => (window as any).atlasSceneProof?.firstDrawMs != null,
  );
  const reset = () =>
    page.evaluate(() => {
      const p = (window as any).atlasSceneProof;
      p.calls = 0;
      p.maxCalls = 0;
    });
  const calls = () =>
    page.evaluate(() => {
      const p = (window as any).atlasSceneProof;
      return Math.max(p.calls, p.maxCalls);
    });
  await reset();
  await page
    .getByRole("combobox", { name: "Cámara de revisión" })
    .selectOption("perspectiva");
  await expect.poll(calls).toBeGreaterThan(0);
  const orbitCalls = await calls();
  await reset();
  await page.getByRole("button", { name: "Retirar neumático" }).click();
  await expect.poll(calls).toBeGreaterThan(orbitCalls * 1.5);
  await reset();
  await page.getByRole("button", { name: "Restaurar montaje" }).click();
  await expect.poll(calls).toBeGreaterThan(orbitCalls * 1.5);
});
