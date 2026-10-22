import { expect, test } from "@playwright/test";
import { installSceneMetrics } from "../../scripts/lib/scene-metrics.mjs";
import { readFileSync } from "node:fs";
const examples = JSON.parse(
  readFileSync("supabase/catalog/motion-v2-examples.json", "utf8"),
) as { presets: { id: string; slug: string }[] };
test.use({
  launchOptions: {
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  },
});
async function review(page: import("@playwright/test").Page) {
  await page.addInitScript(installSceneMetrics);
  await page.goto(
    "/tests/fixtures/suspension-review.html?model=santa-cruz-v10-8-my27",
  );
  await page.waitForFunction(() => (window as any).atlasMotionReview?.ready);
  await expect(page.locator("canvas")).toBeVisible();
  await page.waitForTimeout(300);
}
test("explicit playback reuses resources, follows separate bodies and closing restores the reference posture", async ({
  page,
}) => {
  test.setTimeout(60000);
  await review(page);
  const initial = await page.evaluate(() =>
    (window as any).atlasMotionReview.inspect(),
  );
  const queries: string[] = [];
  page.on("request", (r) => {
    if (/\/rest\/v1\/|\/storage\/v1\//.test(r.url())) queries.push(r.url());
  });
  await page.getByRole("button", { name: "Suspensión", exact: true }).click();
  await page.getByLabel("Compresión delantera", { exact: true }).fill("65");
  await page.getByLabel("Compresión trasera", { exact: true }).fill("65");
  expect(
    await page.evaluate(
      () => (window as any).atlasMotionReview.inspect()?.position,
    ),
  ).toEqual(initial.position);
  await page.getByRole("button", { name: "Reproducir", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as any).atlasMotionReview.inspect()?.position[1],
      ),
    )
    .not.toBe(0);
  await expect
    .poll(async () => {
      const state = await page.evaluate(() =>
        (window as any).atlasMotionReview.inspect(),
      );
      return state?.parts
        .find((p: any) => p.slot === "rear_tire")
        ?.position.some((n: number) => Math.abs(n) > 0.001);
    })
    .toBe(true);
  const compressed = await page.evaluate(() =>
    (window as any).atlasMotionReview.inspect(),
  );
  expect(
    compressed.parts
      .find((p: any) => p.slot === "fork")
      .bodies.some((p: any) => p.name === "motion_sliding"),
  ).toBe(true);
  expect(
    compressed.parts
      .find((p: any) => p.slot === "rear_tire")
      .position.some((n: number) => Math.abs(n) > 0.001),
  ).toBe(true);
  await page.getByRole("button", { name: "Suspensión", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Suspensión", exact: true }),
  ).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as any).atlasMotionReview.inspect()?.position,
      ),
    )
    .toEqual(initial.position);
  const reset = await page.evaluate(() =>
    (window as any).atlasMotionReview.inspect(),
  );
  expect(reset.position).toEqual(initial.position);
  expect(reset.rotation).toBeCloseTo(initial.rotation, 10);
  for (const part of reset.parts) expect(part.position).toEqual([0, 0, 0]);
  expect(queries).toHaveLength(0);
});
test("playback pauses without a permanent draw loop", async ({ page }) => {
  test.setTimeout(60000);
  await review(page);
  await page.getByRole("button", { name: "Suspensión", exact: true }).click();
  await page.getByLabel("Compresión delantera", { exact: true }).fill("60");
  await page.getByLabel("Compresión trasera", { exact: true }).fill("60");
  await page.getByRole("button", { name: "Reproducir", exact: true }).click();
  await page.waitForTimeout(450);
  const before = await page.evaluate(() =>
    (window as any).atlasMotionReview.inspect(),
  );
  await page.waitForTimeout(450);
  const after = await page.evaluate(() =>
    (window as any).atlasMotionReview.inspect(),
  );
  expect(after.position[1]).not.toBe(before.position[1]);
  await page.getByRole("button", { name: "Pausar", exact: true }).click();
  await page.waitForTimeout(700);
  const paused = await page.evaluate(() =>
    (window as any).atlasMotionReview.inspect(),
  );
  const drawn = await page.evaluate(
    () => (window as any).atlasSceneProof.firstDrawMs,
  );
  const frameTimes = await page.evaluate(
    () => (window as any).atlasSceneProof.frames.length,
  );
  await page.waitForTimeout(350);
  expect(
    await page.evaluate(() => (window as any).atlasMotionReview.inspect()),
  ).toEqual(paused);
  expect(
    await page.evaluate(() => (window as any).atlasSceneProof.frames.length),
  ).toBe(frameTimes);
  expect(drawn).toBeGreaterThan(0);
});
test("reduced motion keeps percentage selection at rest and keeps the controls in the viewport", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await review(page);
  await page.getByRole("button", { name: "Suspensión", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Reproducir", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Compresión trasera", { exact: true }).fill("30");
  expect(
    await page.evaluate(
      () => (window as any).atlasMotionReview.inspect()?.position[1],
    ),
  ).toBe(0);
  const panel = await page
    .getByRole("region", { name: "Suspensión", exact: true })
    .boundingBox();
  expect(panel!.x).toBeGreaterThanOrEqual(0);
  expect(panel!.x + panel!.width).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  );
});
test("all nine fork and four shock families keep distinct moving bodies", async ({
  page,
}) => {
  test.setTimeout(120000);
  await review(page);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const [category, label, expected, slot] of [
    ["fork", "Horquilla", 9, "fork"],
    ["shock", "Amortiguador", 4, "shock"],
  ] as const) {
    const selector = page.getByLabel(label, { exact: true });
    const options = await selector
      .locator("option")
      .evaluateAll((options) =>
        options.map((o) => (o as HTMLOptionElement).value).filter(Boolean),
      );
    expect(options).toHaveLength(expected);
    for (const slug of options) {
      await selector.selectOption(slug);
      await page.waitForFunction(
        ({ category, slug }) =>
          (window as any).atlasMotionReview?.ready &&
          (window as any).atlasMotionReview[category] === slug,
        { category, slug },
      );
      if (
        !(await page
          .getByRole("region", { name: "Suspensión", exact: true })
          .count())
      )
        await page
          .getByRole("button", { name: "Suspensión", exact: true })
          .click();
      await page.getByLabel("Compresión delantera", { exact: true }).fill("35");
      await page.getByLabel("Compresión trasera", { exact: true }).fill("35");
      await expect
        .poll(async () => {
          const proof = await page.evaluate(() =>
            (window as any).atlasMotionReview.inspect(),
          );
          return proof?.parts
            .find((p: any) => p.slot === slot)
            ?.bodies.some((b: any) => b.name === "motion_sliding");
        })
        .toBe(true);
      await page
        .getByRole("button", { name: "Suspensión", exact: true })
        .click();
    }
  }
  expect(errors).toEqual([]);
});
test("the rear coil shortens between its supports during playback", async ({
  page,
}) => {
  await review(page);
  await page
    .getByLabel("Amortiguador", { exact: true })
    .selectOption("marzocchi-bomber-cr");
  await page.waitForFunction(
    () =>
      (window as any).atlasMotionReview?.ready &&
      (window as any).atlasMotionReview.shock === "marzocchi-bomber-cr",
  );
  await page.getByRole("button", { name: "Suspensión", exact: true }).click();
  await page.getByLabel("Compresión trasera", { exact: true }).fill("100");
  const scale = () =>
    page.evaluate(
      () =>
        (window as any).atlasMotionReview
          .inspect()
          ?.parts.find((p: any) => p.slot === "shock")
          ?.bodies.find((b: any) => b.name === "motion_spring")?.scale,
    );
  expect(await scale()).toEqual([1, 1, 1]);
  await page.getByRole("button", { name: "Reproducir", exact: true }).click();
  await expect.poll(async () => (await scale())?.[1]).toBeLessThan(0.99);
  await page.getByRole("button", { name: "Pausar", exact: true }).click();
  const compressed = await scale();
  expect(compressed[0]).toBe(1);
  expect(compressed[2]).toBe(1);
  await page
    .getByRole("button", { name: "Restablecer suspensión", exact: true })
    .click();
  await expect.poll(scale).toEqual([1, 1, 1]);
});
test("saving an inspected build persists choices and reopening restores an uncompressed scene", async ({
  page,
}) => {
  test.skip(
    !process.env.ATLAS_TEST_EMAIL,
    "Run validate-configurator-performance.mjs desktop motion",
  );
  test.setTimeout(120000);
  await page.goto("/entrar");
  await page
    .getByLabel("Correo electrónico")
    .fill(process.env.ATLAS_TEST_EMAIL!);
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill(process.env.ATLAS_TEST_PASSWORD!);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/mis-bicicletas/);
  const preset = examples.presets.find((p) => p.slug.includes("supreme"))!;
  await page.goto(`/configurador?preset=${preset.id}`);
  await expect(page.locator(".slot-complete")).toHaveCount(23);
  await expect(page.locator(".viewer canvas")).toBeVisible();
  await page
    .getByRole("region", { name: "Montaje visual", exact: true })
    .getByRole("button", { name: "Suspensión", exact: true })
    .click();
  await page.getByLabel("Compresión delantera", { exact: true }).fill("50");
  await page.getByLabel("Compresión trasera", { exact: true }).fill("50");
  await page.getByRole("button", { name: "Reproducir", exact: true }).click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Pausar", exact: true }).click();
  const request = page.waitForRequest((r) =>
    new URL(r.url()).pathname.endsWith("/rest/v1/rpc/save_build"),
  );
  const name = `Motion ${Date.now()}`;
  await page.getByLabel("Nombre del montaje").fill(name);
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.locator(".save-status")).toHaveText("Guardado");
  const saved = (await request).postDataJSON().p_configuration;
  expect(Object.keys(saved).sort()).toEqual(["items", "name", "schemaVersion"]);
  expect(saved.items).toHaveLength(23);
  await page
    .locator(".editor-toolbar")
    .getByRole("link", { name: "Mis bicicletas", exact: true })
    .click();
  const card = page.locator(".preset-card").filter({ hasText: name });
  await expect(card.locator(".bike-preview")).toHaveAttribute(
    "data-preview-state",
    "ready",
  );
  await card.getByRole("link", { name: "Continuar", exact: false }).click();
  await expect(page.getByLabel("Nombre del montaje")).toHaveValue(name);
  await expect(
    page.getByRole("region", { name: "Suspensión", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("region", { name: "Montaje visual", exact: true })
    .getByRole("button", { name: "Suspensión", exact: true })
    .click();
  await expect(
    page.getByLabel("Compresión delantera", { exact: true }),
  ).toHaveValue("0");
  await expect(
    page.getByLabel("Compresión trasera", { exact: true }),
  ).toHaveValue("0");
  await expect(page.locator(".slot-complete")).toHaveCount(23);
});
