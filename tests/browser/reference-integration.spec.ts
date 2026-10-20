import { test, expect } from "@playwright/test";
import * as T from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { readFileSync } from "node:fs";
import type Source from "../../supabase/catalog/visual-v5-reviewed.json";
import type Examples from "../../supabase/catalog/visual-v5-examples.json";
import type Report from "../../models/catalog-v5/exports/report.json";
import { parseCatalogImport } from "../../src/features/catalog/model/ingestion";
import { resolveAssembly } from "../../src/features/configurator/model/assemblyV2";
import { rotatePoint } from "../../src/features/configurator/model/assemblyV5";
import { installSceneMetrics } from "../../scripts/lib/scene-metrics.mjs";
import type {
  Configuration,
  VariantMap,
} from "../../src/features/configurator/model";
const source: typeof Source = JSON.parse(
  readFileSync("supabase/catalog/visual-v5-reviewed.json", "utf8"),
);
const examples: typeof Examples = JSON.parse(
  readFileSync("supabase/catalog/visual-v5-examples.json", "utf8"),
);
const report: typeof Report = JSON.parse(
  readFileSync("models/catalog-v5/exports/report.json", "utf8"),
);
const catalog = parseCatalogImport(source);
for (const discipline of ["enduro", "downhill"])
  test(`real reference GLBs load and the painted frame remains selectable on ${discipline}`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript(installSceneMetrics);
    await page.goto(
      `/tests/fixtures/scene-preview.html?generation=v5&discipline=${discipline}`,
    );
    await page.waitForFunction(
      () => (window as any).atlasSceneProof?.firstDrawMs != null,
    );
    const preset = examples.presets.find((p) =>
      discipline === "enduro"
        ? p.slug.includes("meta")
        : p.slug.includes("supreme"),
    )!;
    const configuration = {
      schemaVersion: 1,
      name: preset.name,
      items: preset.items,
    } as Configuration;
    const variants: VariantMap = {};
    for (const v of catalog.variants) {
      const component = catalog.components.find(
        (c) => c.id === v.component_id,
      )!;
      variants[v.id] = {
        ...v,
        component: {
          ...component,
          brands: catalog.brands.find((b) => b.id === component.brand_id)!,
        },
        visual_assets: catalog.assets.find((a) => a.id === v.visual_asset_id)!,
      };
    }
    const frame =
      variants[configuration.items.find((i) => i.slot === "frame")!.variantId];
    const old = Object.values(report).find((r) =>
      r.paintable_nodes.some((name) =>
        frame.visual_assets!.manifest.paintable_nodes.includes(name),
      ),
    )!;
    const bytes = readFileSync("models/catalog-v5/exports/" + old.file),
      gltf = await new GLTFLoader().parseAsync(
        bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength,
        ),
        "",
      );
    let best: T.Vector3 | undefined,
      score = Infinity;
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((n) => {
      if (
        !(n instanceof T.Mesh) ||
        !frame.visual_assets!.manifest.paintable_nodes.includes(n.name)
      )
        return;
      const position = n.geometry.getAttribute("position");
      const indices = n.geometry.index;
      const count = indices?.count ?? position.count;
      for (let i = 0; i < count; i += 3) {
        const p = new T.Vector3();
        for (let j = 0; j < 3; j++)
          p.add(
            new T.Vector3().fromBufferAttribute(
              position,
              indices ? indices.getX(i + j) : i + j,
            ),
          );
        p.multiplyScalar(1 / 3).applyMatrix4(n.matrixWorld);
        if (p.x < 0.1 || p.x > 0.35 || p.y < 0.25 || p.y > 0.6 || p.z < 0.009)
          continue;
        const value = p.distanceToSquared(new T.Vector3(0.23, 0.48, 0.04));
        if (value < score) {
          score = value;
          best = p;
        }
      }
    });
    expect(best).toBeDefined();
    const assembly = resolveAssembly(configuration, variants),
      point = new T.Vector3(
        ...rotatePoint(
          best!.toArray() as [number, number, number],
          Number((assembly as any).settleAngle),
        ),
      );
    const canvas = page.locator("canvas"),
      bounds = (await canvas.boundingBox())!;
    const target = new T.Vector3(0.17, 0.15, 0),
      fit = Math.max(1, 1.45 / (bounds.width / bounds.height));
    const camera = new T.PerspectiveCamera(
      37,
      bounds.width / bounds.height,
      0.1,
      1000,
    );
    camera.position.copy(
      new T.Vector3(0.2, 0.25, 2.6).sub(target).multiplyScalar(fit).add(target),
    );
    camera.lookAt(target);
    camera.updateMatrixWorld();
    point.project(camera);
    await page.mouse.click(
      bounds.x + ((point.x + 1) / 2) * bounds.width,
      bounds.y + ((1 - point.y) / 2) * bounds.height,
    );
    await expect(page.getByLabel("Pieza seleccionada")).toHaveText("Cuadro");
    const side = await canvas.screenshot();
    await page
      .getByRole("combobox", { name: "Cámara de revisión" })
      .selectOption("frontal");
    await expect
      .poll(async () => Buffer.compare(side, await canvas.screenshot()))
      .not.toBe(0);
    expect(errors).toEqual([]);
  });
