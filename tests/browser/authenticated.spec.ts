import { test, expect } from "@playwright/test";
test("administrator manages real drafts and roles with the approved tables and panels", async ({
  page,
}) => {
  test.skip(
    !process.env.ATLAS_TEST_EMAIL,
    "Run through scripts/test-authenticated.mjs",
  );
  test.setTimeout(60000);
  const run = process.env.ATLAS_TEST_RUN!;
  await page.goto("/entrar");
  await page
    .getByLabel("Correo electrónico")
    .fill(process.env.ATLAS_TEST_EMAIL!);
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill(process.env.ATLAS_TEST_PASSWORD!);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/mis-bicicletas/);
  await page.goto("/administracion/roles");
  await page.getByRole("button", { name: "Crear rol", exact: true }).click();
  let panel = page.getByRole("dialog", { name: "Crear rol", exact: true });
  await panel.getByLabel("Nombre", { exact: true }).fill(run);
  await panel.getByLabel("Ver mis bicicletas", { exact: false }).check();
  await panel.getByRole("button", { name: "Guardar rol" }).click();
  await expect(
    page.getByRole("button", { name: run, exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Permisos", exact: true }).click();
  await expect(
    page.getByRole("checkbox", {
      name: "Administrador: Crear y editar montajes",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(
    page.getByRole("checkbox", {
      name: `${run}: Ver mis bicicletas`,
      exact: true,
    }),
  ).toBeChecked();
  await page
    .locator(".admin-tabs")
    .getByRole("link", { name: "Catálogo", exact: true })
    .click();
  await page.getByRole("button", { name: "Crear marca", exact: true }).click();
  panel = page.getByRole("dialog", { name: "Marca", exact: true });
  await panel.getByLabel("Nombre", { exact: true }).fill(run);
  await panel.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(page.getByRole("status")).toContainText("Cambios guardados");
  await panel.getByRole("button", { name: "Cerrar detalle" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  // Keep the created model in the filtered result when the real inventory spans pages.
  await page
    .getByRole("textbox", { name: "Buscar modelo", exact: true })
    .fill(run);
  await page.getByRole("button", { name: "Componente", exact: true }).click();
  panel = page.getByRole("dialog", { name: "Componente", exact: true });
  await panel.getByLabel("Nombre", { exact: true }).fill(run);
  await panel
    .getByRole("combobox", { name: "Marca", exact: true })
    .selectOption({ label: run });
  await panel.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(
    page.getByRole("button", { name: run, exact: true }).first(),
  ).toBeVisible();
  await panel.getByRole("button", { name: "Añadir variante" }).click();
  panel = page.getByRole("dialog", { name: "Variante", exact: true });
  await panel.getByLabel("Versión", { exact: true }).fill("Aire · Validación");
  await panel.getByText("Características", { exact: true }).click();
  await panel.getByLabel("Recorrido (mm)", { exact: true }).fill("170");
  await panel
    .getByRole("combobox", { name: "Resorte", exact: true })
    .selectOption("air");
  await panel.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(page.getByRole("status")).toContainText("Cambios guardados");
  await panel.getByRole("button", { name: "Cerrar detalle" }).click();
  await page.getByRole("button", { name: run, exact: true }).first().click();
  panel = page.getByRole("dialog", { name: "Componente", exact: true });
  await expect(
    panel.getByRole("button", { name: /Aire · Validación/ }),
  ).toBeVisible();
  await panel
    .getByLabel("Descripción", { exact: true })
    .fill("Cambio sin guardar");
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    panel.getByRole("textbox", { name: "Descripción", exact: true }),
  ).toHaveValue("Cambio sin guardar");
  await panel.getByRole("button", { name: "Cerrar detalle" }).click();
  await expect(
    page.getByRole("dialog", { name: "Cambios sin guardar", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Descartar cambios", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .locator(".admin-tabs")
    .getByRole("link", { name: "Bicicletas de referencia", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Bicicleta de referencia", exact: true })
    .click();
  panel = page.getByRole("dialog", {
    name: "Bicicleta de referencia",
    exact: true,
  });
  await panel
    .getByLabel("Nombre", { exact: true })
    .fill(run + " draft reference");
  await panel.getByLabel("Versión / talla", { exact: true }).fill("M");
  await panel
    .getByRole("combobox", { name: "Marca", exact: true })
    .selectOption({ label: run });
  await panel
    .getByRole("combobox", { name: "Pieza", exact: true })
    .selectOption("fork");
  await panel.getByLabel("Buscar alternativa", { exact: true }).fill(run);
  await panel
    .locator(".piece-options button")
    .filter({ hasText: "Aire · Validación" })
    .click();
  await panel
    .getByRole("button", { name: "Guardar borrador", exact: true })
    .click();
  await expect(panel.getByRole("status")).toContainText("Cambios guardados");
  await panel
    .getByRole("button", { name: "Cerrar detalle", exact: true })
    .click();
  await page
    .getByRole("button", { name: run + " draft reference", exact: true })
    .click();
  panel = page.getByRole("dialog", {
    name: "Bicicleta de referencia",
    exact: true,
  });
  await panel
    .getByRole("combobox", { name: "Pieza", exact: true })
    .selectOption("fork");
  await expect(panel.locator(".selected-piece")).toContainText(
    "Aire · Validación",
  );
  await panel.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(panel.getByRole("alert")).toContainText("Publica la marca");
  await panel
    .getByRole("button", { name: "Cerrar detalle", exact: true })
    .click();
  await page.getByRole("link", { name: "Usuarios", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: process.env.ATLAS_TEST_EMAIL!,
      exact: true,
    }),
  ).toBeVisible({ timeout: 20000 });
  await page.goto("/configurador");
  await expect(page.getByLabel("Nombre del montaje")).toBeVisible();
  await page.getByLabel("Nombre del montaje").fill("");
  await expect(page.getByLabel("Nombre del montaje")).toHaveValue("");
  await page.getByLabel("Nombre del montaje").fill(run);
  await page
    .getByRole("button", { name: "Cerrar sesión", exact: true })
    .click();
  await expect(
    page.getByRole("alertdialog", { name: "Hay cambios sin guardar" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Guardar y salir", exact: true })
    .click();
  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("link", { name: "Entrar", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Entrar", exact: true }).click();
  await page
    .getByLabel("Correo electrónico")
    .fill(process.env.ATLAS_TEST_EMAIL!);
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill(process.env.ATLAS_TEST_PASSWORD!);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/mis-bicicletas/);
  await expect(
    page.getByRole("heading", { name: run, exact: true }),
  ).toBeVisible();
  await expect(page.getByText("0 piezas", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: run, exact: true }).click();
  const saved = page.getByRole("dialog", { name: "Mi bicicleta", exact: true });
  await expect(
    saved.getByRole("textbox", { name: "Nombre", exact: true }),
  ).toHaveValue(run);
});

test("reference families mount all positions and component intent waits for a frame", async ({
  page,
}, testInfo) => {
  test.skip(
    !process.env.ATLAS_TEST_EMAIL,
    "Run through scripts/test-authenticated.mjs",
  );
  test.setTimeout(90000);
  const run = process.env.ATLAS_TEST_RUN!;
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`/bicicletas?q=${run}`);
  await expect(page.locator(".preset-card")).toHaveCount(1);
  const card = page.locator(".preset-card");
  await expect(
    card.getByRole("combobox", { name: "Versión" }).locator("option"),
  ).toHaveCount(2);
  await card
    .getByRole("combobox", { name: "Versión" })
    .selectOption({ label: "L" });
  await card.getByRole("button", { name: "Ver montaje", exact: true }).click();
  const detail = page.getByRole("dialog", { name: "Detalle de la bicicleta" });
  await expect(detail.locator(".piece-information")).toHaveCount(23);
  await detail
    .getByRole("link", { name: "Personalizar esta bicicleta" })
    .click();
  await expect(page).toHaveURL(/entrar/);
  await page
    .getByLabel("Correo electrónico")
    .fill(process.env.ATLAS_TEST_EMAIL!);
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill(process.env.ATLAS_TEST_PASSWORD!);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.locator(".slot-complete")).toHaveCount(23);
  await expect(page.locator("canvas")).toBeVisible({ timeout: 20000 });
  await page.getByRole("button", { name: "Lateral", exact: true }).click();
  await page
    .locator(".viewer")
    .screenshot({ path: `/tmp/atlas-full-bike-${testInfo.project.name}.png` });
  await page.getByLabel("Nombre del montaje").fill(`${run} complete`);
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.locator(".save-status")).toContainText("Guardado");
  await page
    .getByRole("link", { name: "Mis bicicletas", exact: true })
    .last()
    .click();
  await expect(
    page
      .locator(".preset-card")
      .filter({
        has: page.getByRole("button", { name: `${run} complete`, exact: true }),
      })
      .getByText("23 piezas", { exact: true }),
  ).toBeVisible();
  await page.goto(`/componentes?category=fork&q=${run}`);
  await page.locator(".product-card").click();
  await page.getByRole("link", { name: "Probar en mi bicicleta" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Elige un cuadro para probar" }),
  ).toBeVisible();
  await expect(page.locator(".slot-complete")).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("status").filter({ hasText: "Elige un cuadro para probar" }),
  ).toBeVisible();
  await page.getByLabel("Buscar alternativa").fill(run);
  await page.locator(".piece-options button").click();
  await expect(page.locator(".slot-complete")).toHaveCount(2);
  await expect(page.locator(".editor-panel h1")).toHaveText("Horquilla");
  await page.getByLabel("Nombre del montaje").fill(`${run} intent`);
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.locator(".save-status")).toContainText("Guardado");
  expect(errors).toEqual([]);
});

test("native recovery callback consumes a token and changes the password without email delivery", async ({
  page,
}) => {
  test.skip(
    !process.env.ATLAS_RECOVERY_TOKEN,
    "Run through scripts/test-authenticated.mjs",
  );
  await page.goto(
    "/auth/callback?type=recovery&token_hash=" +
      encodeURIComponent(process.env.ATLAS_RECOVERY_TOKEN!),
  );
  await expect(page).toHaveURL("/nueva-contrasena");
  expect(page.url()).not.toContain("token_hash");
  await page
    .locator("#new-password")
    .fill(process.env.ATLAS_RECOVERY_PASSWORD!);
  await page
    .locator("#confirm-password")
    .fill(process.env.ATLAS_RECOVERY_PASSWORD!);
  await page
    .getByRole("button", { name: "Guardar contraseña", exact: true })
    .click();
  await expect(page).toHaveURL("/mis-bicicletas");
  await page
    .getByRole("button", { name: "Cerrar sesión", exact: true })
    .click();
  await page.getByRole("link", { name: "Entrar", exact: true }).click();
  await page
    .getByLabel("Correo electrónico")
    .fill(process.env.ATLAS_RECOVERY_EMAIL!);
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill(process.env.ATLAS_RECOVERY_PASSWORD!);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL("/mis-bicicletas");
  await expect(
    page.getByRole("link", { name: "Administración", exact: true }),
  ).toHaveCount(0);
});

test("reviewed enduro reference can be saved and reopened as a personal bicycle", async ({
  page,
}) => {
  test.skip(
    !process.env.ATLAS_TEST_EMAIL,
    "Run through scripts/test-authenticated.mjs",
  );
  test.setTimeout(60000);
  const name = process.env.ATLAS_TEST_RUN! + " reviewed";
  await page.goto("/bicicletas?q=META");
  await page
    .locator(".preset-card")
    .filter({ hasText: "META SX V5" })
    .getByRole("link", { name: "Personalizar", exact: false })
    .click();
  await page
    .getByLabel("Correo electrónico")
    .fill(process.env.ATLAS_TEST_EMAIL!);
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill(process.env.ATLAS_TEST_PASSWORD!);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.locator(".slot-complete")).toHaveCount(23);
  await expect(page.locator(".selected-piece")).toContainText("META SX V5");
  await page
    .locator(".slot-nav")
    .getByRole("button", { name: "Aro delantero", exact: false })
    .click();
  await page.getByLabel("Buscar alternativa").fill("E 593");
  await page
    .locator(".piece-options button")
    .filter({ hasText: "27.5" })
    .click();
  await expect(page.locator(".selected-piece")).toContainText("27.5");
  await page.locator(".mount-notes summary").click();
  await expect(page.locator(".mount-notes")).toContainText(
    "tienen diámetros distintos",
  );
  await page.getByLabel("Nombre del montaje").fill(name);
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.locator(".save-status")).toContainText("Guardado");
  await page
    .getByRole("link", { name: "Mis bicicletas", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name, exact: true }).click();
  const details = page.getByRole("dialog", {
    name: "Mi bicicleta",
    exact: true,
  });
  await expect(details).toContainText("META SX V5");
  await expect(details).toContainText("Assegai");
  await expect(details).toContainText("Bomber CR");
});

test("reviewed DH reference preserves size, versioned assembly and all pieces after save and reopen", async ({
  page,
}, testInfo) => {
  test.skip(
    !process.env.ATLAS_TEST_EMAIL,
    "Run through scripts/test-authenticated.mjs",
  );
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const name = process.env.ATLAS_TEST_RUN! + " downhill";
  await page.goto("/bicicletas?q=SUPREME");
  const card = page
    .locator(".preset-card")
    .filter({ hasText: "SUPREME DH V5" });
  await card
    .getByRole("combobox", { name: "Versión" })
    .selectOption({ label: "L" });
  await card.getByRole("link", { name: "Personalizar", exact: false }).click();
  await page
    .getByLabel("Correo electrónico")
    .fill(process.env.ATLAS_TEST_EMAIL!);
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill(process.env.ATLAS_TEST_PASSWORD!);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.locator(".slot-complete")).toHaveCount(23);
  await expect(page.locator(".selected-piece")).toContainText("SUPREME DH V5");
  await expect(page.locator(".selected-piece")).toContainText(
    "L · Clear Silver",
  );
  await expect(page.locator("canvas")).toBeVisible({ timeout: 20000 });
  await page.getByRole("button", { name: "Lateral", exact: true }).click();
  await page.getByLabel("Nombre del montaje").fill(name);
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.locator(".save-status")).toContainText("Guardado");
  await page
    .locator(".viewer")
    .screenshot({ path: `/tmp/atlas-dh-${testInfo.project.name}.png` });
  const contextLost = await page.locator("canvas").evaluate((canvas) => {
    const extension = canvas
      .getContext("webgl2")
      ?.getExtension("WEBGL_lose_context");
    if (!extension) return false;
    extension.loseContext();
    return true;
  });
  expect(contextLost).toBe(true);
  await expect(
    page.getByRole("heading", { name: "Vista 3D no disponible", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".slot-complete")).toHaveCount(23);
  await page.getByLabel("Color personalizado", { exact: true }).fill("#49614c");
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.locator(".save-status")).toContainText("Guardado");
  await page
    .getByRole("link", { name: "Mis bicicletas", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name, exact: true }).click();
  const details = page.getByRole("dialog", {
    name: "Mi bicicleta",
    exact: true,
  });
  for (const text of [
    "SUPREME DH V5",
    "40 Factory",
    "XG-795",
    "GX DH",
    "Potencia directa",
  ])
    await expect(details).toContainText(text);
  await details.getByRole("link", { name: "Continuar montaje" }).click();
  await expect(page.locator(".slot-complete")).toHaveCount(23);
  await expect(page.locator(".selected-piece")).toContainText(
    "L · Clear Silver",
  );
  await expect(
    page.getByLabel("Color personalizado", { exact: true }),
  ).toHaveValue("#49614c");
  await expect(page.locator("canvas")).toBeVisible({ timeout: 20000 });
  expect(errors).toEqual([]);
});

test("publishing a catalogue variant refreshes previously cached public facets without a reload", async ({
  page,
}) => {
  test.skip(
    !process.env.ATLAS_TEST_EMAIL,
    "Run through scripts/test-authenticated.mjs",
  );
  test.setTimeout(60000);
  const name = process.env.ATLAS_TEST_RUN! + " cache";
  await page.goto("/entrar");
  await page
    .getByLabel("Correo electrónico")
    .fill(process.env.ATLAS_TEST_EMAIL!);
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill(process.env.ATLAS_TEST_PASSWORD!);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/mis-bicicletas/);
  await page
    .locator(".header-nav")
    .getByRole("link", { name: "Catálogo", exact: true })
    .click();
  const documentId = await page.evaluate(() => {
    const id = crypto.randomUUID();
    Object.assign(window, { atlasNavigationProof: id });
    return id;
  });
  await expect(
    page.getByRole("combobox", { name: "Marca", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("combobox", { name: "Marca", exact: true })
      .locator("option")
      .filter({ hasText: name }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Administración", exact: true }).click();
  await page.getByRole("button", { name: "Crear marca", exact: true }).click();
  let panel = page.getByRole("dialog", { name: "Marca", exact: true });
  await panel.getByLabel("Nombre", { exact: true }).fill(name);
  await panel.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "Publicación confirmada",
  );
  await panel.getByRole("button", { name: "Cerrar detalle" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("textbox", { name: "Buscar modelo", exact: true })
    .fill(name);
  await page.getByRole("button", { name: "Componente", exact: true }).click();
  panel = page.getByRole("dialog", { name: "Componente", exact: true });
  await panel.getByLabel("Nombre", { exact: true }).fill(name);
  await panel
    .getByRole("combobox", { name: "Marca", exact: true })
    .selectOption({ label: name });
  await panel
    .getByRole("combobox", { name: "Categoría", exact: true })
    .selectOption("brake");
  await panel.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(
    panel.getByRole("button", { name: "Añadir variante", exact: true }),
  ).toBeEnabled();
  await panel
    .getByRole("button", { name: "Añadir variante", exact: true })
    .click();
  panel = page.getByRole("dialog", { name: "Variante", exact: true });
  await panel
    .getByLabel("Versión", { exact: true })
    .fill("Referencia temporal · 2 pistones");
  await panel.getByText("Características", { exact: true }).click();
  await panel.getByLabel("Pistones", { exact: true }).fill("2");
  await panel.getByText("Representación", { exact: true }).click();
  await panel
    .getByRole("combobox", { name: "Recurso existente", exact: true })
    .selectOption({ label: process.env.ATLAS_TEST_RUN! + "-scene" });
  await panel.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "Publicación confirmada",
  );
  await panel.getByRole("button", { name: "Cerrar detalle" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("link", { name: "Volver al trabajo", exact: true })
    .click();
  await expect(
    page
      .getByRole("combobox", { name: "Marca", exact: true })
      .locator("option")
      .filter({ hasText: name }),
  ).toHaveCount(1);
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { atlasNavigationProof: string })
          .atlasNavigationProof,
    ),
  ).toBe(documentId);
});

test("two- and four-piston brakes replace independently and persist with the documented rotor", async ({
  page,
}) => {
  test.skip(
    !process.env.ATLAS_TEST_EMAIL,
    "Run through scripts/test-authenticated.mjs",
  );
  test.setTimeout(60000);
  const name = process.env.ATLAS_TEST_RUN! + " braking";
  await page.goto("/bicicletas?q=META");
  await page
    .locator(".preset-card")
    .filter({ hasText: "META SX V5" })
    .getByRole("link", { name: "Personalizar", exact: false })
    .click();
  await page
    .getByLabel("Correo electrónico")
    .fill(process.env.ATLAS_TEST_EMAIL!);
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill(process.env.ATLAS_TEST_PASSWORD!);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.locator(".slot-complete")).toHaveCount(23);
  await page
    .locator(".slot-nav")
    .getByRole("button", { name: "Freno delantero", exact: false })
    .click();
  await page.getByLabel("Buscar alternativa").fill("SLX M7100");
  await page.locator(".piece-options button").click();
  await expect(page.locator(".selected-piece")).toContainText("2 pistones");
  await page
    .locator(".slot-nav")
    .getByRole("button", { name: "Freno trasero", exact: false })
    .click();
  await page.getByLabel("Buscar alternativa").fill("MT5");
  await page
    .locator(".piece-options button")
    .filter({ hasText: "MT5 · 4 pistones" })
    .click();
  await expect(page.locator(".selected-piece")).toContainText("4 pistones");
  await page.locator(".mount-notes summary").click();
  await expect(page.locator(".mount-notes")).toContainText(
    "Falta confirmar el espesor del disco trasero",
  );
  await page
    .locator(".slot-nav")
    .getByRole("button", { name: "Disco trasero", exact: false })
    .click();
  await page.getByLabel("Buscar alternativa").fill("MDR-P");
  await page
    .locator(".piece-options button")
    .filter({ hasText: "203 mm" })
    .click();
  await expect(page.locator(".selected-piece")).toContainText("203 mm");
  await expect(page.locator(".mount-notes")).not.toContainText(
    "Falta confirmar el espesor del disco trasero",
  );
  await expect(page.locator("canvas")).toBeVisible({ timeout: 20000 });
  await expect(page.locator(".slot-complete")).toHaveCount(23);
  await page.getByLabel("Nombre del montaje").fill(name);
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.locator(".save-status")).toContainText("Guardado");
  await page
    .getByRole("link", { name: "Mis bicicletas", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name, exact: true }).click();
  const detail = page.getByRole("dialog", {
    name: "Mi bicicleta",
    exact: true,
  });
  await expect(detail).toContainText("SLX M7100");
  await expect(detail).toContainText("MT5");
  await expect(detail).toContainText("MDR-P");
});

test("a committed save with a lost response is reconciled without duplicating the bicycle", async ({ page }) => {
  test.skip(!process.env.ATLAS_TEST_EMAIL, "Run through scripts/test-authenticated.mjs");
  test.setTimeout(60000);
  await loginForSaveValidation(page);
  const name = process.env.ATLAS_TEST_RUN! + " uncertain";
  await page.goto("/configurador");
  await page.getByLabel("Nombre del montaje").fill(name);
  let committedId = "";
  await page.route("**/rest/v1/rpc/save_build", async (route) => {
    const response = await route.fetch();
    expect(response.ok()).toBe(true);
    committedId = (await response.json()).id;
    // The transaction commits remotely; the browser receives a gateway failure.
    await route.fulfill({ status: 504, contentType: "application/json", body: '{"message":"gateway_timeout"}' });
  }, { times: 1 });
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.locator(".save-status")).toContainText("Guardado confirmado");
  expect(committedId).toMatch(/^[0-9a-f-]{36}$/);
  await page.getByRole("link", { name: "Mis bicicletas", exact: true }).last().click();
  await expect(page.getByRole("button", { name, exact: true })).toHaveCount(1);
  await page.getByRole("button", { name, exact: true }).click();
  await expect(page.getByRole("link", { name: "Continuar montaje" })).toHaveAttribute("href", `/configurador/${committedId}`);
});

test("editing during a save preserves the newer draft and retries a failed request", async ({ page }) => {
  test.skip(!process.env.ATLAS_TEST_EMAIL, "Run through scripts/test-authenticated.mjs");
  test.setTimeout(60000);
  await loginForSaveValidation(page);
  await page.goto("/configurador");
  const name = process.env.ATLAS_TEST_RUN! + " snapshot";
  await page.getByLabel("Nombre del montaje").fill(name);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  let arrived!: () => void;
  const requestStarted = new Promise<void>((resolve) => { arrived = resolve; });
  await page.route("**/rest/v1/rpc/save_build", async (route) => {
    arrived();
    await gate;
    await route.continue();
  }, { times: 1 });
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await requestStarted;
  await page.getByLabel("Nombre del montaje").fill(name + " edited");
  release();
  await expect(page.locator(".save-status")).toContainText("Hay cambios posteriores sin guardar");
  await expect(page.getByLabel("Nombre del montaje")).toHaveValue(name + " edited");
  await page.route("**/rest/v1/rpc/save_build", (route) => route.abort("failed"), { times: 1 });
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Conservamos tus cambios");
  await expect(page.getByLabel("Nombre del montaje")).toHaveValue(name + " edited");
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.locator(".save-status")).toHaveText("Guardado");
  await page.getByRole("link", { name: "Mis bicicletas", exact: true }).last().click();
  await expect(page.getByRole("button", { name: name + " edited", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name, exact: true })).toHaveCount(0);
});

test("two tabs detect a revision conflict and preserve both choices as separate bicycles", async ({ page, context }) => {
  test.skip(!process.env.ATLAS_TEST_EMAIL, "Run through scripts/test-authenticated.mjs");
  test.setTimeout(90000);
  await loginForSaveValidation(page);
  await page.goto("/configurador");
  const name = process.env.ATLAS_TEST_RUN! + " concurrent";
  await page.getByLabel("Nombre del montaje").fill(name);
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.locator(".save-status")).toHaveText("Guardado");
  await page.getByRole("link", { name: "Mis bicicletas", exact: true }).last().click();
  await page.getByRole("button", { name, exact: true }).click();
  const href = await page.getByRole("link", { name: "Continuar montaje" }).getAttribute("href");
  await page.getByRole("link", { name: "Continuar montaje" }).click();
  const second = await context.newPage();
  try {
    await second.goto(href!);
    await expect(second.getByLabel("Nombre del montaje")).toHaveValue(name);
    await page.getByLabel("Nombre del montaje").fill(name + " first");
    await page.getByRole("button", { name: "Guardar", exact: true }).click();
    await expect(page.locator(".save-status")).toHaveText("Guardado");
    await second.getByLabel("Nombre del montaje").fill(name + " second");
    await second.getByRole("button", { name: "Guardar", exact: true }).click();
    await expect(second.getByRole("alert")).toContainText("Los datos cambiaron en otra sesión");
    await expect(second.getByLabel("Nombre del montaje")).toHaveValue(name + " second");
    await second.getByRole("button", { name: "Guardar como copia", exact: true }).click();
    await expect(second.locator(".save-status")).toHaveText("Guardado");
    await second.getByRole("link", { name: "Mis bicicletas", exact: true }).last().click();
    await expect(second.getByRole("button", { name: name + " first", exact: true })).toBeVisible();
    await expect(second.getByRole("button", { name: name + " second", exact: true })).toBeVisible();
  } finally {
    await second.close();
  }
});

async function loginForSaveValidation(page: import("@playwright/test").Page) {
  await page.goto("/entrar");
  await page.getByLabel("Correo electrónico").fill(process.env.ATLAS_TEST_EMAIL!);
  await page.getByLabel("Contraseña", { exact: true }).fill(process.env.ATLAS_TEST_PASSWORD!);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/mis-bicicletas/);
}

test("a saved imported resource waits for its binary and remains editable when delivery fails", async ({ page }) => {
  test.skip(!process.env.ATLAS_TEST_EMAIL, "Run through scripts/test-authenticated.mjs");
  test.setTimeout(90000);
  const { visualTriangle } = await import("../fixtures/visual-triangle");
  const bytes = Buffer.from(visualTriangle());
  let missing = false;
  await page.route("**/storage/v1/object/public/models/validation/fixture.glb", async route => {
    if (missing) await route.fulfill({ status: 404, body: "missing" });
    else await route.fulfill({ contentType: "model/gltf-binary", body: bytes });
  });
  const run = process.env.ATLAS_TEST_RUN!;
  await page.goto(`/bicicletas?q=${run}`);
  await page.locator(".preset-card").getByRole("link", { name: "Personalizar", exact: false }).click();
  await page.getByLabel("Correo electrónico").fill(process.env.ATLAS_TEST_EMAIL!);
  await page.getByLabel("Contraseña", { exact: true }).fill(process.env.ATLAS_TEST_PASSWORD!);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.locator(".slot-complete")).toHaveCount(23);
  await page.locator(".slot-nav").getByRole("button", { name: "Horquilla", exact: false }).click();
  await page.getByLabel("Buscar alternativa").fill("Entrega remota " + run.slice(-8));
  await page.locator(".piece-options button").click();
  await expect(page.locator(".selected-piece")).toContainText("Archivo de validación");
  await expect(page.locator("canvas")).toBeVisible();
  const name = run + " imported";
  await page.getByLabel("Nombre del montaje").fill(name);
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.locator(".save-status")).toHaveText("Guardado");
  await page.getByRole("link", { name: "Mis bicicletas", exact: true }).last().click();
  await page.getByRole("button", { name, exact: true }).click();
  await page.getByRole("link", { name: "Continuar montaje" }).click();
  // A fresh module cache proves first-load preparation, not just an already-cached GLB.
  await page.reload();
  await expect(page.locator(".slot-complete")).toHaveCount(23);
  await expect(page.locator("canvas")).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole("heading", { name: "Vista 3D no disponible", exact: true })).toHaveCount(0);
  missing = true;
  await page.reload();
  await expect(page.getByRole("heading", { name: "Vista 3D no disponible", exact: true })).toBeVisible();
  await expect(page.locator(".slot-complete")).toHaveCount(23);
  await page.getByLabel("Nombre del montaje").fill(name + " retained");
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.locator(".save-status")).toHaveText("Guardado");
});

test("a denied administrative write revalidates access and removes the open private form", async ({ page }) => {
  test.skip(!process.env.ATLAS_TEST_EMAIL, "Run through scripts/test-authenticated.mjs");
  test.setTimeout(60000);
  await loginForSaveValidation(page);
  await page.goto("/administracion/catalogo");
  await page.getByRole("button", { name: "Crear marca", exact: true }).click();
  const panel = page.getByRole("dialog", { name: "Marca", exact: true });
  await panel.getByLabel("Nombre", { exact: true }).fill("Validation denied draft");
  // Server revocation with an existing JWT is tested against Cloud by validate-supabase.
  // Inject its two browser-facing responses without revoking the shared test identity.
  await page.route("**/rest/v1/rpc/get_my_access", async route => {
    const actual = await route.fetch();
    const access = await actual.json();
    await route.fulfill({ response: actual, json: { ...access, permissions: ["configurator.use", "builds.read_own", "builds.write_own", "builds.delete_own"] } });
  });
  await page.route("**/rest/v1/rpc/save_catalog", route => route.fulfill({status: 403, contentType: "application/json", body: '{"code":"42501","message":"permission_denied"}'}));
  await panel.getByRole("button", { name: "Guardar borrador", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Acceso no disponible", exact: true })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Administración", exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Volver a mi espacio", exact: true }).click();
  await expect(page).toHaveURL("/mis-bicicletas");
});

test("changing to a documented Nomad size preserves the other pieces and survives saving", async ({ page }) => {
  test.skip(!process.env.ATLAS_TEST_EMAIL, "Run through scripts/test-authenticated.mjs");
  test.setTimeout(90000);
  await page.goto("/bicicletas?q=META");
  await page.locator(".preset-card").getByRole("link", {name: "Personalizar", exact: false}).click();
  await page.getByLabel("Correo electrónico").fill(process.env.ATLAS_TEST_EMAIL!);
  await page.getByLabel("Contraseña", {exact:true}).fill(process.env.ATLAS_TEST_PASSWORD!);
  await page.getByRole("button", {name:"Entrar",exact:true}).click();
  await expect(page.locator(".slot-complete")).toHaveCount(23);
  await page.getByLabel("Buscar alternativa").fill("Nomad");
  await page.locator(".piece-options button").filter({hasText:"L · Matte Metallic Earth"}).click();
  const confirm = page.getByRole("alertdialog", {name: "Cambiar de cuadro"});
  await confirm.getByRole("button", {name: /^Cambiar (sin guardar|cuadro)$/, exact:true}).click();
  await expect(page.locator(".selected-piece")).toContainText("L · Matte Metallic Earth");
  await expect(page.locator(".slot-complete")).toHaveCount(23);
  await expect(page.locator("canvas")).toBeVisible({timeout:20000});
  await page.getByLabel("Color personalizado", {exact:true}).fill("#447755");
  const name = process.env.ATLAS_TEST_RUN! + " Nomad L";
  await page.getByLabel("Nombre del montaje").fill(name);
  await page.getByRole("button", {name:"Guardar",exact:true}).click();
  await expect(page.locator(".save-status")).toContainText("Guardado");
  await page.getByRole("link", {name:"Mis bicicletas",exact:true}).last().click();
  await page.getByRole("button", {name,exact:true}).click();
  const detail = page.getByRole("dialog", {name:"Mi bicicleta",exact:true});
  for (const piece of ["Nomad 7 CC", "Bomber CR", "38 Factory", "Assegai"]) await expect(detail).toContainText(piece);
  await detail.getByRole("link", {name:"Continuar montaje"}).click();
  await expect(page.locator(".slot-complete")).toHaveCount(23);
  await expect(page.locator(".selected-piece")).toContainText("L · Matte Metallic Earth");
  await expect(page.getByLabel("Color personalizado", {exact:true})).toHaveValue("#447755");
  await page.locator(".mount-notes summary").click();
  await expect(page.locator(".mount-notes")).toContainText("pedalier");
});

test("starting with a Sender frame saves an intentionally incomplete bicycle", async ({ page }) => {
  test.skip(!process.env.ATLAS_TEST_EMAIL, "Run through scripts/test-authenticated.mjs");
  test.setTimeout(60000);
  await page.goto("/componentes?category=frame&q=Sender");
  await page.locator(".product-card").click();
  const detail = page.getByRole("dialog", {name:"Detalle de la pieza"});
  await detail.getByRole("combobox", {name:"Versión",exact:true}).selectOption({label:"M · Void Black"});
  await detail.getByRole("link", {name:"Probar en mi bicicleta"}).click();
  await page.getByLabel("Correo electrónico").fill(process.env.ATLAS_TEST_EMAIL!);
  await page.getByLabel("Contraseña", {exact:true}).fill(process.env.ATLAS_TEST_PASSWORD!);
  await page.getByRole("button", {name:"Entrar",exact:true}).click();
  await expect(page.locator(".slot-complete")).toHaveCount(1);
  await expect(page.locator(".selected-piece")).toContainText("M · Void Black");
  await expect(page.locator("canvas")).toBeVisible({timeout:20000});
  const name = process.env.ATLAS_TEST_RUN! + " Sender M";
  await page.getByLabel("Nombre del montaje").fill(name);
  await page.getByRole("button", {name:"Guardar",exact:true}).click();
  await expect(page.locator(".save-status")).toContainText("Guardado");
  await page.reload();
  await expect(page.locator(".slot-complete")).toHaveCount(1);
  await expect(page.locator(".selected-piece")).toContainText("M · Void Black");
});

test("reauthentication retains an account's unsaved recovery and deliberate logout removes it", async ({ page }) => {
  test.skip(!process.env.ATLAS_TEST_EMAIL, "Run through scripts/test-authenticated.mjs");
  test.setTimeout(60000);
  await page.goto("/bicicletas?q=META");
  await page.locator(".preset-card").getByRole("link", {name:"Personalizar",exact:false}).click();
  const login = async () => {
    await page.getByLabel("Correo electrónico").fill(process.env.ATLAS_TEST_EMAIL!);
    await page.getByLabel("Contraseña", {exact:true}).fill(process.env.ATLAS_TEST_PASSWORD!);
    await page.getByRole("button", {name:"Entrar",exact:true}).click();
  };
  await login();
  await expect(page.locator(".slot-complete")).toHaveCount(23);
  const name = process.env.ATLAS_TEST_RUN! + " local recovery";
  await page.getByLabel("Nombre del montaje").fill(name);
  await expect.poll(() => page.evaluate(() => Object.entries(localStorage).some(([key,value]) => key.startsWith("atlas:draft:") && value.includes("local recovery")))).toBe(true);
  // Exercise a failed session check, without exposing or changing the real account's credentials.
  await page.route("**/auth/v1/user", route => route.fulfill({status:401,contentType:"application/json",body:JSON.stringify({code:"bad_jwt",message:"Session validation fixture"})}));
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page).toHaveURL(/entrar/);
  await page.unroute("**/auth/v1/user");
  await login();
  await expect(page.getByLabel("Nombre del montaje")).toHaveValue(name);
  await expect(page.locator(".slot-complete")).toHaveCount(23);
  await page.getByRole("button", {name:"Cerrar sesión",exact:true}).click();
  const decision = page.getByRole("alertdialog", {name:"Hay cambios sin guardar"});
  await decision.getByRole("button", {name:"Guardar y salir",exact:true}).click();
  await expect(page.getByRole("link", {name:"Entrar",exact:true})).toBeVisible();
  await expect.poll(() => page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith("atlas:draft:")).length)).toBe(0);
});
