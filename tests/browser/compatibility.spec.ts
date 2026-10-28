import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { selectAssemblySlot } from "./helpers/assembly";

test.beforeEach(async ({ page }) => {
  test.skip(
    !process.env.ATLAS_TEST_EMAIL,
    "Run through scripts/test-authenticated.mjs",
  );
  test.setTimeout(100000);
  await page.goto("/entrar");
  await page
    .getByLabel("Correo electrónico")
    .fill(process.env.ATLAS_TEST_EMAIL!);
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill(process.env.ATLAS_TEST_PASSWORD!);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/mis-bicicletas/);
});

test("global warnings permit an inconsistent wheel, update on correction and persist after saving", async ({
  page,
}, info) => {
  await page.goto("/bicicletas?q=META");
  await page
    .locator(".preset-card")
    .filter({ hasText: "META SX V5" })
    .getByRole("link", { name: /Personalizar/ })
    .click();
  await expect(page.locator(".slot-complete")).toHaveCount(23);
  await selectAssemblySlot(page, "Aro delantero");
  await page.getByLabel("Buscar alternativa").fill("E 593");
  await page
    .locator(".piece-options button")
    .filter({ hasText: "27.5" })
    .click();
  const summary = page.getByRole("region", {
    name: "Estado de compatibilidad",
  });
  await expect(summary).toContainText(/incompatibilidad/);
  await expect(
    page.getByRole("button", { name: "Guardar", exact: true }),
  ).toBeEnabled();
  await summary.getByRole("button", { name: "Ver detalles" }).click();
  let panel = page.getByRole("dialog", { name: "Compatibilidad", exact: true });
  const problem = panel.locator("article").filter({
    hasText: "El aro y el neumático delanteros tienen diámetros distintos.",
  });
  await expect(problem).toContainText("27,5″");
  await expect(problem).toContainText("29″");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  mkdirSync("models/local/validation/compatibility", { recursive: true });
  await page.screenshot({
    path: `models/local/validation/compatibility/${info.project.name}-warnings.png`,
  });
  const rearBefore = await page
    .locator("#assembly-piece-rear_rim")
    .textContent();
  const requests: string[] = [];
  const collect = (request: { url: () => string }) =>
    requests.push(request.url());
  page.on("request", collect);
  await problem
    .getByRole("button", {
      name: "Ver alternativas",
      exact: true,
    })
    .click();
  const option = problem
    .locator(".compatibility-option")
    .filter({ hasText: "E 593" })
    .first();
  await expect(
    option.getByRole("button", { name: "Usar esta pieza", exact: true }),
  ).toBeVisible();
  await expect(option.locator(".compatibility-option-price")).toContainText(
    "S/",
  );
  expect(requests.filter((url) => /\.glb(?:[?]|$)/.test(url))).toHaveLength(0);
  expect(
    requests.filter((url) => url.includes("/rpc/sales_offers")),
  ).toHaveLength(1);
  await page.screenshot({
    path: `models/local/validation/compatibility/${info.project.name}-alternatives.png`,
  });
  page.off("request", collect);
  await option
    .getByRole("button", { name: "Usar esta pieza", exact: true })
    .click();
  await expect(panel).toHaveCount(0);
  await expect(page.locator(".save-status")).toContainText(
    "Se sustituyó únicamente aro delantero",
  );
  await expect(page.locator("#assembly-piece-rear_rim")).toHaveText(
    rearBefore!,
  );
  await summary.getByRole("button", { name: "Ver detalles" }).click();
  panel = page.getByRole("dialog", { name: "Compatibilidad", exact: true });
  await expect(
    panel.getByText(
      "El aro y el neumático delanteros tienen diámetros distintos.",
      { exact: true },
    ),
  ).toHaveCount(0);
  await panel.getByRole("button", { name: "Cerrar detalle" }).click();
  await expect(panel).toHaveCount(0);
  await page.getByRole("button", { name: "Deshacer último cambio" }).click();
  await expect(summary).toContainText(/incompatibilidad/);
  const name = process.env.ATLAS_TEST_RUN! + " incompatible";
  await page.getByLabel("Nombre del montaje").fill(name);
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.locator(".save-status")).toContainText("Guardado");
  await page
    .getByRole("link", { name: "Mis bicicletas", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name, exact: true }).click();
  await page
    .getByRole("dialog", { name: "Mi bicicleta", exact: true })
    .getByRole("link", { name: "Continuar montaje" })
    .click();
  await summary.getByRole("button", { name: "Ver detalles" }).click();
  await expect(
    page.getByRole("dialog", { name: "Compatibilidad", exact: true }),
  ).toContainText(
    "El aro y el neumático delanteros tienen diámetros distintos.",
  );
  panel = page.getByRole("dialog", { name: "Compatibilidad", exact: true });
  const reopenedProblem = panel.locator(".compatibility-card").filter({
    hasText: "El aro y el neumático delanteros tienen diámetros distintos.",
  });
  await reopenedProblem
    .getByRole("button", {
      name: "Ver alternativas",
      exact: true,
    })
    .click();
  await reopenedProblem
    .locator(".compatibility-option")
    .filter({ hasText: "E 593" })
    .first()
    .getByRole("button", { name: "Usar esta pieza", exact: true })
    .click();
  await expect(panel).toHaveCount(0);
  await expect(page.locator(".save-status")).toContainText(
    "Se sustituyó únicamente",
  );
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.locator(".save-status")).toContainText("Guardado");
  await page.reload();
  await summary
    .getByRole("button", { name: "Ver detalles", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog", { name: "Compatibilidad", exact: true })
      .getByText(
        "El aro y el neumático delanteros tienen diámetros distintos.",
        { exact: true },
      ),
  ).toHaveCount(0);
});

test("empty builds remain neutral and Nomad fork limits show documented values without blocking selection", async ({
  page,
}, info) => {
  await page.goto("/configurador");
  const summary = page.getByRole("region", {
    name: "Estado de compatibilidad",
  });
  await expect(summary).toContainText("Selecciona piezas");
  await page.getByLabel("Buscar alternativa").fill("Nomad");
  await page
    .locator(".piece-options button")
    .filter({ hasText: "M · Matte Metallic Earth" })
    .click();
  await expect(page.locator(".slot-complete")).toHaveCount(1);
  await selectAssemblySlot(page, "Horquilla");
  await page.getByLabel("Buscar alternativa").fill("40 Factory");
  await page
    .locator(".piece-options button")
    .filter({ hasText: "29 · 203 mm · Shiny Orange" })
    .click();
  await expect(page.locator(".slot-complete")).toHaveCount(2);
  await summary.getByRole("button", { name: "Ver detalles" }).click();
  const panel = page.getByRole("dialog", {
    name: "Compatibilidad",
    exact: true,
  });
  const problem = panel.locator("article").filter({
    hasText: "Recorrido de horquilla fuera del límite documentado del cuadro.",
  });
  await expect(problem).toContainText("170–180 mm");
  await expect(problem).toContainText("203 mm");
  await expect(
    problem.getByRole("link", { name: /Ver especificación/ }),
  ).toHaveAttribute("href", /nomad-7-my27/);
  mkdirSync("models/local/validation/compatibility", { recursive: true });
  await page.screenshot({
    path: `models/local/validation/compatibility/${info.project.name}-fork-limit.png`,
  });
  await panel.getByRole("button", { name: "Cerrar detalle" }).click();
  await expect(panel).toHaveCount(0);
  const index = page.getByRole("complementary", {
    name: "Piezas del montaje",
    exact: true,
  });
  await expect(
    index.getByRole("button", {
      name: "Horquilla",
      exact: true,
      includeHidden: true,
    }),
  ).toHaveAccessibleDescription(/Incompatibilidad detectada/);
  await expect(
    page.getByRole("button", { name: "Guardar", exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
