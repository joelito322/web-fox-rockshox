import { mkdirSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { readProjectEnvironment } from "../../scripts/lib/environment.mjs";
import { test, expect } from "@playwright/test";
test.describe.configure({ mode: "serial" });
test("modular administration preserves role permissions, filters and visible actions", async ({
  page,
}) => {
  test.skip(
    !process.env.ATLAS_TEST_EMAIL,
    "Run scripts/test-authenticated.mjs desktop '' admin-modular",
  );
  test.setTimeout(120000);
  const run = process.env.ATLAS_TEST_RUN!;
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
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
  let panel = page.getByRole("dialog");
  await panel.getByLabel("Nombre", { exact: true }).fill(run);
  await expect(panel.getByRole("checkbox")).toHaveCount(1); // Active, no duplicate permission editor.
  await panel.getByRole("button", { name: "Guardar rol", exact: true }).click();
  await expect(panel.getByRole("status")).toHaveText("Rol guardado.");
  await panel.getByRole("button", { name: "Configurar permisos →" }).click();
  await expect(page).toHaveURL(/permisos/);
  const permission = page.getByRole("checkbox", {
    name: `${run}: Ver mis bicicletas`,
    exact: true,
  });
  await permission.check();
  await page.getByRole("textbox", { name: "Buscar permisos" }).fill("Catálogo");
  await expect(permission).toHaveCount(0);
  await page
    .getByRole("button", { name: "Guardar cambios", exact: true })
    .click();
  await expect(
    page.getByText("Permisos guardados.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("textbox", { name: "Buscar permisos" }).fill("");
  await expect(permission).toBeChecked();
  mkdirSync("models/local/validation/admin-modular", { recursive: true });
  await page.screenshot({
    path: `models/local/validation/admin-modular/${test.info().project.name}-matrix.png`,
  });
  await page.getByRole("link", { name: "Roles", exact: true }).click();
  await page
    .locator(".row-button")
    .filter({ hasText: new RegExp(`^${run}$`) })
    .click();
  panel = page.getByRole("dialog");
  await panel
    .getByLabel("Descripción", { exact: true })
    .fill("Editor de prueba");
  await panel.getByRole("button", { name: "Guardar rol", exact: true }).click();
  await expect(panel.getByRole("status")).toHaveText("Rol guardado.");
  await panel.getByRole("button", { name: "Configurar permisos →" }).click();
  await expect(permission).toBeChecked();
  await page
    .getByRole("navigation", { name: "Módulos de administración" })
    .getByRole("link", { name: "Catálogo", exact: true })
    .click();
  await page.getByRole("link", { name: "Marcas", exact: true }).click();
  await page.getByRole("button", { name: "Crear marca", exact: true }).click();
  panel = page.getByRole("dialog");
  await panel.getByLabel("Nombre", { exact: true }).fill(run);
  await panel
    .getByRole("button", { name: "Guardar borrador", exact: true })
    .click();
  await expect(panel.getByRole("status")).toHaveText("Cambios guardados.");
  const action = panel.getByRole("button", {
    name: "Guardar borrador",
    exact: true,
  });
  await expect(action).toBeInViewport();
  await panel
    .getByRole("button", { name: "Ver componentes de esta marca" })
    .click();
  await expect(page).toHaveURL(/catalogo.*brand=/);
  await page.getByRole("button", { name: "Componente", exact: true }).click();
  panel = page.getByRole("dialog");
  await panel.getByLabel("Nombre", { exact: true }).fill(run);
  await panel
    .getByRole("combobox", { name: "Marca", exact: true })
    .selectOption({ label: run });
  await panel
    .getByRole("button", { name: "Guardar borrador", exact: true })
    .click();
  await expect(panel.getByRole("status")).toHaveText("Cambios guardados.");
  await panel
    .getByLabel("Descripción", { exact: true })
    .fill("Borrador pendiente");
  await panel.getByRole("button", { name: "Cerrar detalle" }).click();
  await expect(
    page.getByRole("dialog", { name: "Cambios sin guardar" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Seguir editando", exact: true })
    .click();
  await expect(
    panel.getByRole("textbox", { name: "Descripción", exact: true }),
  ).toHaveValue("Borrador pendiente");
  await panel
    .getByRole("button", { name: "Guardar borrador", exact: true })
    .click();
  await expect(panel.getByRole("status")).toHaveText("Cambios guardados.");
  await panel.getByRole("button", { name: "Cerrar detalle" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByLabel("Buscar modelo", { exact: true }).fill(run);
  await page
    .locator(".row-button")
    .filter({ hasText: new RegExp(`^${run}$`) })
    .click();
  panel = page.getByRole("dialog", { name: "Componente", exact: true });
  await panel.getByRole("button", { name: "Variantes", exact: true }).click();
  await panel
    .getByRole("button", { name: "Añadir variante", exact: true })
    .click();
  panel = page.getByRole("dialog", { name: "Variante", exact: true });
  await panel.getByLabel("Versión", { exact: true }).fill("Aire · Validación");
  await panel.getByLabel("Recorrido (mm)", { exact: true }).fill("170");
  await panel
    .getByRole("combobox", { name: "Resorte", exact: true })
    .selectOption("air");
  await panel
    .getByRole("button", { name: "Guardar borrador", exact: true })
    .click();
  await expect(panel.getByRole("status")).toHaveText("Cambios guardados.");
  await panel.getByRole("button", { name: `← ${run}`, exact: true }).click();
  panel = page.getByRole("dialog", { name: "Componente", exact: true });
  await panel.getByRole("button", { name: "Variantes", exact: true }).click();
  await expect(
    panel.getByRole("button", { name: /Aire · Validación/ }),
  ).toBeVisible();
  await panel.getByRole("button", { name: "Cerrar detalle" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("link", { name: "Accesos", exact: true }).click();
  await page.getByRole("link", { name: "Usuarios", exact: true }).click();
  await page.getByLabel("Buscar usuario").fill(process.env.ATLAS_TEST_EMAIL!);
  await page
    .getByRole("button", { name: process.env.ATLAS_TEST_EMAIL!, exact: true })
    .click();
  panel = page.getByRole("dialog");
  await expect(panel.getByRole("textbox")).toHaveCount(0);
  await panel.getByRole("button", { name: "Cerrar detalle" }).click();
  await page
    .getByRole("navigation", { name: "Módulos de administración" })
    .getByRole("link", { name: "Catálogo", exact: true })
    .click();
  await expect(page.getByLabel("Buscar modelo", { exact: true })).toHaveValue(
    run,
  );
  await page.getByRole("link", { name: "Recursos 3D", exact: true }).click();
  await expect(page.locator(".admin-table tbody tr").first()).toBeVisible();
  await page.locator(".admin-table .row-button").first().click();
  await expect(
    page.getByRole("dialog", { name: "Representación 3D" }),
  ).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("textbox")).toHaveCount(0);
  await page
    .getByRole("dialog")
    .evaluate((node) =>
      Promise.all(
        node
          .getAnimations()
          .map((animation) => animation.finished.catch(() => {})),
      ),
    );
  await page.screenshot({
    path: `models/local/validation/admin-modular/${test.info().project.name}-resource.png`,
  });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cerrar detalle", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("link", { name: "Componentes", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Filtrar por marca", exact: true })
    .selectOption("");
  const scene = run + " scene fork";
  await page.getByLabel("Buscar modelo", { exact: true }).fill(scene);
  await page
    .locator(".row-button")
    .filter({ hasText: new RegExp(`^${scene}$`) })
    .click();
  panel = page.getByRole("dialog", { name: "Componente", exact: true });
  await panel.getByRole("button", { name: "Variantes", exact: true }).click();
  await panel.getByRole("button", { name: /Validación temporal/ }).click();
  panel = page.getByRole("dialog", { name: "Variante", exact: true });
  await panel.getByRole("button", { name: "Retirar", exact: true }).click();
  await expect(panel.getByRole("status")).toHaveText(
    "Variante retirada de nuevas selecciones.",
  );
  await panel
    .getByRole("button", { name: "Volver a ofrecer", exact: true })
    .click();
  await expect(panel.getByRole("status")).toHaveText(
    "Variante disponible para nuevos montajes.",
  );
  expect(errors).toEqual([]);
});

test("new admin queries enforce permissions and concurrent edits preserve the confirmed row", async () => {
  test.skip(!process.env.ATLAS_TEST_EMAIL, "Run authenticated admin suite");
  const env = readProjectEnvironment();
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const anon = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_PUBLISHABLE_KEY,
    options,
  );
  const user = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_PUBLISHABLE_KEY,
    options,
  );
  const admin = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_PUBLISHABLE_KEY,
    options,
  );
  expect(
    (
      await user.auth.signInWithPassword({
        email: process.env.ATLAS_NORMAL_TEST_EMAIL!,
        password: process.env.ATLAS_NORMAL_TEST_PASSWORD!,
      })
    ).error,
  ).toBeNull();
  expect(
    (
      await admin.auth.signInWithPassword({
        email: process.env.ATLAS_TEST_EMAIL!,
        password: process.env.ATLAS_TEST_PASSWORD!,
      })
    ).error,
  ).toBeNull();
  for (const client of [anon, user]) {
    for (const [name, args] of [
      ["admin_catalog_page", {}],
      ["admin_user_page", {}],
      ["admin_preset_page", {}],
      ["get_roles_matrix", {}],
    ] as const) {
      const result = await client.rpc(name, args);
      expect(result.error?.code, name).toBe("42501");
    }
  }
  const run = process.env.ATLAS_TEST_RUN!;
  const extra = await admin.rpc("save_roles", {
    p_roles: [
      {
        name: run + "-batch",
        description: null,
        active: true,
        permissions: [],
      },
    ],
  });
  expect(extra.error).toBeNull();
  const roleA = extra.data.roles.find((r: { name: string }) => r.name === run);
  const roleB = extra.data.roles.find(
    (r: { name: string }) => r.name === run + "-batch",
  );
  const editedA = {
    ...roleA,
    permissions: [...roleA.permissions, "configurator.use"],
  };
  const editedB = { ...roleB, permissions: ["builds.read_own"] };
  const rejectedBatch = await admin.rpc("save_roles", {
    p_roles: [editedA, { ...editedB, revision: roleB.revision - 1 }],
  });
  expect(rejectedBatch.error?.code).toBe("PT409");
  const unchanged = (await admin.rpc("get_roles_matrix")).data.roles.find(
    (r: { id: string }) => r.id === roleA.id,
  );
  expect(unchanged.permissions).toEqual(roleA.permissions);
  expect(unchanged.revision).toBe(roleA.revision);
  const acceptedBatch = await admin.rpc("save_roles", {
    p_roles: [editedA, editedB],
  });
  expect(acceptedBatch.error).toBeNull();
  expect(
    acceptedBatch.data.roles.find((r: { id: string }) => r.id === roleA.id)
      .revision,
  ).toBe(roleA.revision + 1);
  expect(
    acceptedBatch.data.roles.find((r: { id: string }) => r.id === roleB.id)
      .revision,
  ).toBe(roleB.revision + 1);
  const id = crypto.randomUUID();
  const initial = {
    id,
    name: `${run} cache`,
    slug: `${run}-cache`,
    region: null,
    published: false,
  };
  expect(
    (
      await user.rpc("save_admin_catalog", {
        p_kind: "brand",
        p_data: initial,
        p_expected: null,
      })
    ).error?.code,
  ).toBe("42501");
  expect(
    (
      await admin.rpc("save_admin_catalog", {
        p_kind: "brand",
        p_data: initial,
        p_expected: null,
      })
    ).error,
  ).toBeNull();
  const before = await admin.rpc("admin_catalog_detail", {
    p_kind: "brand",
    p_id: id,
  });
  const first = { ...before.data, region: "Primera edición" };
  expect(
    (
      await admin.rpc("save_admin_catalog", {
        p_kind: "brand",
        p_data: first,
        p_expected: before.data,
      })
    ).error,
  ).toBeNull();
  const conflict = await admin.rpc("save_admin_catalog", {
    p_kind: "brand",
    p_data: { ...before.data, region: "Edición antigua" },
    p_expected: before.data,
  });
  expect(conflict.error?.code).toBe("PT409");
  expect(
    (
      await admin.rpc("save_admin_catalog", {
        p_kind: "brand",
        p_data: first,
        p_expected: { id },
      })
    ).error?.code,
  ).toBe("PT409");
  expect(
    (await admin.rpc("admin_catalog_detail", { p_kind: "brand", p_id: id }))
      .data.region,
  ).toBe("Primera edición");
  const page = await admin.rpc("admin_catalog_page", { p_kind: "asset" });
  expect(page.error).toBeNull();
  expect(page.data.items.length).toBeLessThanOrEqual(25);
  expect(page.data.items.every((item: object) => !("manifest" in item))).toBe(
    true,
  );
  const presets = await admin.rpc("admin_preset_page", {});
  expect(presets.error).toBeNull();
  expect(presets.data.items.every((item: object) => !("items" in item))).toBe(
    true,
  );
  const presetId = crypto.randomUUID();
  const preset = {
    id: presetId,
    brand_id: id,
    name: run,
    slug: `${run}-cache`,
    family_key: run,
    label: "M",
    model_year: null,
    image_key: null,
    kind: "example",
    sources: [],
    published: false,
    selectable: true,
  };
  expect(
    (
      await admin.rpc("save_admin_preset", {
        p_data: preset,
        p_items: [],
        p_expected: null,
      })
    ).error,
  ).toBeNull();
  const previous = (await admin.rpc("admin_preset_detail", { p_id: presetId }))
    .data;
  expect(
    (
      await admin.rpc("save_admin_preset", {
        p_data: { ...preset, label: "L" },
        p_items: [],
        p_expected: previous,
      })
    ).error,
  ).toBeNull();
  expect(
    (
      await admin.rpc("save_admin_preset", {
        p_data: { ...preset, label: "Anterior" },
        p_items: [],
        p_expected: previous,
      })
    ).error?.code,
  ).toBe("PT409");
  expect(
    (await admin.rpc("admin_preset_detail", { p_id: presetId })).data.label,
  ).toBe("L");
  const current = (await admin.rpc("admin_preset_detail", { p_id: presetId }))
    .data;
  expect(
    (
      await admin.rpc("save_admin_preset", {
        p_data: { ...preset, published: true },
        p_items: [],
        p_expected: current,
      })
    ).error,
  ).not.toBeNull();
  expect(
    (await admin.rpc("admin_preset_detail", { p_id: presetId })).data.published,
  ).toBe(false);
  const fixturePage = await admin.rpc("admin_preset_page", {
    p_search: run + " reference",
  });
  expect(fixturePage.error).toBeNull();
  expect(fixturePage.data.items.length).toBeGreaterThan(0);
  const fixtureId = fixturePage.data.items[0].id;
  const draftPreset = (
    await admin.rpc("admin_preset_detail", { p_id: fixtureId })
  ).data;
  expect(
    (
      await admin.rpc("save_admin_preset", {
        p_data: { ...draftPreset, published: true },
        p_items: draftPreset.items,
        p_expected: draftPreset,
      })
    ).error,
  ).toBeNull();
  const publishedPreset = (
    await admin.rpc("admin_preset_detail", { p_id: fixtureId })
  ).data;
  expect(
    (
      await admin.rpc("save_admin_preset", {
        p_data: { ...publishedPreset, selectable: false },
        p_items: publishedPreset.items,
        p_expected: publishedPreset,
      })
    ).error,
  ).toBeNull();
  const retiredPreset = (
    await admin.rpc("admin_preset_detail", { p_id: fixtureId })
  ).data;
  expect(retiredPreset.items).toEqual(publishedPreset.items);
  expect(
    (
      await admin.rpc("save_admin_preset", {
        p_data: { ...retiredPreset, selectable: true },
        p_items: retiredPreset.items,
        p_expected: retiredPreset,
      })
    ).error,
  ).toBeNull();
  const limited = acceptedBatch.data.roles.find(
    (r: { id: string }) => r.id === roleB.id,
  );
  expect(
    (
      await admin.rpc("save_roles", {
        p_roles: [
          { ...limited, permissions: ["builds.read_own", "catalog.manage"] },
        ],
      })
    ).error,
  ).toBeNull();
  const normalId = (await user.auth.getUser()).data.user!.id;
  const normalAccount = (
    await admin.rpc("admin_user_detail", { p_id: normalId })
  ).data;
  expect(
    (
      await admin.rpc("assign_user_role", {
        p_user_id: normalId,
        p_role_id: roleB.id,
        p_expected_revision: normalAccount.revision,
      })
    ).error,
  ).toBeNull();
  const publishedPage = await user.rpc("admin_catalog_page", {
    p_kind: "brand",
    p_status: "published",
  });
  expect(publishedPage.error).toBeNull();
  const published = publishedPage.data.items[0];
  expect(
    (
      await user.rpc("save_admin_catalog", {
        p_kind: "brand",
        p_data: { ...published, region: "Not authorized" },
        p_expected: published,
      })
    ).error?.code,
  ).toBe("42501");
  expect(
    (
      await admin.rpc("admin_catalog_detail", {
        p_kind: "brand",
        p_id: published.id,
      })
    ).data.region,
  ).toBe(published.region);
  await Promise.all([user.auth.signOut(), admin.auth.signOut()]);
});

test("admin panels retain keyboard drafts and keep actions reachable with larger text", async ({
  page,
}) => {
  test.skip(!process.env.ATLAS_TEST_EMAIL, "Run authenticated admin suite");
  test.setTimeout(60000);
  await page.emulateMedia({ reducedMotion: "reduce" });
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
  await page.getByRole("button", { name: "Crear rol", exact: true }).focus();
  await page.keyboard.press("Enter");
  let panel = page.getByRole("dialog", { name: "Crear rol", exact: true });
  const name = panel.getByLabel("Nombre", { exact: true });
  await name.fill("Borrador de teclado");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Cambios sin guardar", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Seguir editando", exact: true })
    .click();
  await expect(name).toHaveValue("Borrador de teclado");
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Descartar cambios", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Crear rol", exact: true }),
  ).toBeFocused();
  await page.goto("/administracion/catalogo");
  await page.setViewportSize({ width: 640, height: 480 });
  await page.locator(".admin-table .row-button").first().click();
  panel = page.getByRole("dialog", { name: "Componente", exact: true });
  await expect(panel).toBeVisible();
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  const save = panel.getByRole("button", {
    name: /Guardar (borrador|cambios)/,
  });
  await expect(save).toBeInViewport();
  const before = await save.boundingBox();
  await panel.locator(".drawer-body").evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  const after = await save.boundingBox();
  expect(Math.abs(before!.y - after!.y)).toBeLessThan(1);
  await expect(save).toBeInViewport();
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "";
  });
  await panel
    .getByRole("button", { name: "Cerrar detalle", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/administracion/permisos");
  const toolbar = page.locator(".matrix-toolbar");
  await toolbar.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 200));
  await expect(
    toolbar.getByRole("button", { name: "Guardar cambios", exact: true }),
  ).toBeInViewport();
  const firstColumn = page.locator(".permission-table thead th").first();
  const left = (await firstColumn.boundingBox())!.x;
  await page.locator(".permission-scroll").evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
    element.scrollTop = 200;
  });
  expect(Math.abs((await firstColumn.boundingBox())!.x - left)).toBeLessThan(1);
});

test("a catalog editor reads published data and prepares a new draft without publication rights", async ({
  page,
}) => {
  test.skip(!process.env.ATLAS_TEST_EMAIL, "Run authenticated admin suite");
  test.setTimeout(60000);
  await page.goto("/entrar");
  await page
    .getByLabel("Correo electrónico")
    .fill(process.env.ATLAS_NORMAL_TEST_EMAIL!);
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill(process.env.ATLAS_NORMAL_TEST_PASSWORD!);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/mis-bicicletas/);
  await page.goto("/administracion/catalogo");
  const model = process.env.ATLAS_TEST_RUN! + " scene fork";
  await page.getByLabel("Buscar modelo", { exact: true }).fill(model);
  await page
    .locator(".row-button")
    .filter({ hasText: new RegExp(`^${model}$`) })
    .click();
  let panel = page.getByRole("dialog", { name: "Componente", exact: true });
  await expect(panel.getByLabel("Nombre", { exact: true })).toBeDisabled();
  await panel.getByRole("button", { name: "Variantes", exact: true }).click();
  await panel.getByRole("button", { name: /Validación temporal/ }).click();
  panel = page.getByRole("dialog", { name: "Variante", exact: true });
  await expect(panel.getByLabel("Versión", { exact: true })).toBeDisabled();
  await panel
    .getByRole("button", { name: "Crear nueva versión", exact: true })
    .click();
  await expect(panel.getByLabel("Versión", { exact: true })).toBeEnabled();
  await panel.getByLabel("Recorrido (mm)", { exact: true }).fill("170");
  await panel
    .getByRole("combobox", { name: "Resorte", exact: true })
    .selectOption("air");
  await panel
    .getByRole("button", { name: "Guardar borrador", exact: true })
    .click();
  await expect(panel.getByRole("status")).toHaveText("Cambios guardados.");
  await expect(
    panel.getByRole("button", { name: "Publicar", exact: true }),
  ).toHaveCount(0);
});
