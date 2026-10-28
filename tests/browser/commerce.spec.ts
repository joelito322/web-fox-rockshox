import { mkdirSync } from "node:fs";
import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readProjectEnvironment } from "../../scripts/lib/environment.mjs";
test.describe.configure({ mode: "serial" });
test("catalogue → persistent cart → accepted order → demo payment → fulfilment", async ({
  page,
}) => {
  test.skip(
    !process.env.ATLAS_TEST_EMAIL,
    'Use test-authenticated.mjs desktop "" commerce',
  );
  test.setTimeout(150000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/entrar");
  await page
    .getByLabel("Correo electrónico")
    .fill(process.env.ATLAS_TEST_EMAIL!);
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill(process.env.ATLAS_TEST_PASSWORD!);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/mis-bicicletas/);
  await page.goto("/componentes?category=tire");
  await page.locator(".product-card").first().click();
  const panel = page.getByRole("dialog");
  await expect(
    panel.getByRole("button", { name: "Añadir al carrito" }),
  ).toBeVisible();
  await panel.getByRole("button", { name: "Añadir al carrito" }).click();
  await expect(panel.getByRole("status")).toContainText("Añadido");

  await panel
    .getByRole("button", { name: "Cerrar detalle", exact: true })
    .click();
  await page.goto("/comprar");
  await expect(page.locator(".sales-cart-line")).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page
    .getByLabel("Destinatario", { exact: true })
    .fill(" Cliente de demostración ");
  await page
    .getByLabel("Correo o teléfono de contacto")
    .fill(" demo@example.invalid ");
  await expect(
    page.getByRole("group", { name: "Método de pago", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Transferencia", exact: true })
    .click();
  await page.getByRole("button", { name: "Interbank", exact: true }).click();
  await expect
    .poll(() =>
      page
        .locator(".sales-payment img")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete &&
              (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);

  const viewport = page.viewportSize()!;
  await page.setViewportSize({ width: 320, height: 850 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page.setViewportSize(viewport);

  await page.getByRole("button", { name: "Ver resumen", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Crear pedido", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
    window.scrollTo(0, 0);
  });
  mkdirSync("models/local/validation/commerce", { recursive: true });
  await page.screenshot({
    path: `models/local/validation/commerce/${test.info().project.name}-checkout-methods.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Crear pedido" }).click();
  await expect(page).toHaveURL(/mis-pedidos\?order=/);
  await expect(
    page.getByRole("heading", { name: "Pendiente de pago", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Interbank", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Plin", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Detalle del método seleccionado" }),
  ).toContainText("Plin");
  await page
    .getByRole("button", { name: "Transferencia", exact: true })
    .click();
  for (const bank of ["BCP", "Interbank", "BBVA", "Scotiabank"]) {
    await page.getByRole("button", { name: bank, exact: true }).click();
    await expect(
      page.getByRole("region", { name: "Detalle del método seleccionado" }),
    ).toContainText(`Transferencia a ${bank}`);
  }
  await expect(
    page.getByRole("region", { name: "Detalle del método seleccionado" }),
  ).toContainText("CCI");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  mkdirSync("models/local/validation/commerce", { recursive: true });
  await page.screenshot({
    path: `models/local/validation/commerce/${test.info().project.name}-payment-methods.png`,
  });
  await page.getByRole("button", { name: "Simular aprobación" }).click();
  await expect(
    page.getByRole("heading", { name: "Confirmado", exact: true }),
  ).toBeVisible();
  await page.getByText("Simulaciones de pago", { exact: true }).click();
  await expect(page.getByText(/Transferencia · Scotiabank ·/)).toBeVisible();
  const order = new URL(page.url()).searchParams.get("order")!;
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Confirmado", exact: true }),
  ).toBeVisible();
  await page.goto("/administracion/pedidos?order=" + order);
  await page
    .getByRole("button", { name: "En preparación", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "En preparación", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Cancelar pedido", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: /Listo para (recoger|despacho)/ })
    .click();
  await page.getByRole("button", { name: "Entregado", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Entregado", exact: true }),
  ).toBeVisible();
  mkdirSync("models/local/validation/commerce", { recursive: true });
  await page.screenshot({
    path: `models/local/validation/commerce/${test.info().project.name}-order.png`,
  });
  expect(errors).toEqual([]);
});
test("shipping quote persists and only the reviewed version can create an order", async ({
  page,
}) => {
  test.skip(!process.env.ATLAS_TEST_EMAIL, "Use authenticated commerce runner");
  test.setTimeout(150000);
  await page.goto("/entrar");
  await page
    .getByLabel("Correo electrónico")
    .fill(process.env.ATLAS_TEST_EMAIL!);
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill(process.env.ATLAS_TEST_PASSWORD!);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/mis-bicicletas/);
  await page.goto("/componentes?category=tire");
  await page.locator(".product-card").first().click();
  let panel = page.getByRole("dialog");
  await panel.getByRole("button", { name: "Añadir al carrito" }).click();
  await expect(panel.getByRole("status")).toContainText("Añadido");
  await page.goto("/comprar");
  await page
    .getByLabel("Destinatario", { exact: true })
    .fill("Solicitud de envío");
  await page
    .getByLabel("Correo o teléfono de contacto")
    .fill("demo@example.invalid");
  await page.getByRole("button", { name: "Envío por cotizar" }).click();
  await page
    .getByLabel("Dirección", { exact: true })
    .fill("Calle de prueba 100");
  await page.getByLabel("Distrito / ciudad").fill("Lima");
  await page.getByLabel("Región", { exact: true }).fill("Lima");
  await page
    .getByRole("button", { name: "Solicitar cotización", exact: true })
    .click();
  await expect(page).toHaveURL(/mis-pedidos\?tab=cotizaciones&quote=/);
  const id = new URL(page.url()).searchParams.get("quote")!;
  await expect(
    page.getByRole("heading", { name: /Por cotizar/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Revisar y aceptar" }),
  ).toHaveCount(0);
  await page.goto("/administracion/pedidos?tab=cotizaciones&quote=" + id);
  panel = page.getByRole("dialog");
  await panel.getByLabel("Entrega (S/)", { exact: true }).fill("25");
  await panel
    .getByLabel("Revisión técnica y condiciones")
    .fill("Envío de demostración.");
  await panel.getByRole("button", { name: "Publicar cotización" }).click();
  await expect(
    panel.getByRole("heading", { name: /Pendiente de aceptación/ }),
  ).toBeVisible();
  await page.goto("/mis-pedidos?tab=cotizaciones&quote=" + id);
  await page.getByRole("link", { name: "Revisar y aceptar" }).click();
  await page.getByRole("button", { name: "Ver resumen", exact: true }).click();
  await expect(page.locator(".sales-summary")).toContainText("S/");
  await page.getByRole("button", { name: "Crear pedido" }).click();
  await expect(
    page.getByRole("heading", { name: "Pendiente de pago", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Motivo de cancelación").fill("Cancelar demostración");
  await page
    .getByRole("button", { name: "Cancelar pedido", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Cancelado", exact: true }),
  ).toBeVisible();
});
test("public offers expose only bounded projections and an ordinary user cannot manage prices", async () => {
  const env = readProjectEnvironment();
  const client = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const denied = await client.from("store_offers").select("*");
  expect(denied.error).toBeTruthy();
  if (process.env.ATLAS_NORMAL_TEST_EMAIL) {
    const login = await client.auth.signInWithPassword({
      email: process.env.ATLAS_NORMAL_TEST_EMAIL,
      password: process.env.ATLAS_NORMAL_TEST_PASSWORD!,
    });
    expect(login.error).toBeNull();
    const response = await client.rpc("sales_admin_offers", {
      p_search: "",
      p_page: 0,
    });
    expect(response.error?.code).toBe("42501");
  }
});

test("administration creates an offer, revises stock and assigns a non-stacking promotion using existing drawers", async ({
  page,
}) => {
  test.skip(!process.env.ATLAS_TEST_EMAIL, "Use authenticated commerce runner");
  test.setTimeout(150000);
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
  await page.goto("/administracion/ofertas");
  await page.getByRole("button", { name: "Crear oferta", exact: true }).click();
  let panel = page.getByRole("dialog");
  await panel.getByLabel("SKU", { exact: true }).fill("BROWSER-" + run);
  await panel
    .getByLabel("Nombre comercial", { exact: true })
    .fill(run + " oferta");
  await panel.getByLabel("Precio (S/)", { exact: true }).fill("150.25");
  await panel.getByLabel("Stock disponible", { exact: true }).fill("5");
  await panel
    .getByLabel("Buscar versión del catálogo")
    .fill(run + " scene tire");
  const select = panel.getByLabel("Añadir versión y acabado");
  await expect(select.locator("option")).toHaveCount(2);
  await select.selectOption({ index: 1 });
  await panel
    .getByRole("button", { name: "Guardar oferta", exact: true })
    .click();
  await expect(panel).toHaveCount(0);
  await page.getByLabel("Buscar", { exact: true }).fill(run);
  await page
    .getByRole("button", { name: run + " oferta", exact: true })
    .click();
  panel = page.getByRole("dialog");
  await expect(panel.getByLabel("Precio (S/)", { exact: true })).toHaveValue(
    "150.25",
  );
  await panel.getByLabel("Stock disponible", { exact: true }).fill("7");
  await panel
    .getByRole("button", { name: "Guardar oferta", exact: true })
    .click();
  await expect(panel).toHaveCount(0);
  await expect(
    page.getByRole("cell", { name: "7 / 7", exact: true }),
  ).toBeVisible();
  await page.goto("/administracion/promociones");
  await page
    .getByRole("button", { name: "Crear promoción", exact: true })
    .click();
  panel = page.getByRole("dialog");
  await panel.getByLabel("Nombre", { exact: true }).fill(run + " promoción");
  await panel.getByLabel("Porcentaje (%)", { exact: true }).fill("12.5");
  await panel.getByLabel("Promoción activa").selectOption("no");
  await panel.getByLabel("Buscar ofertas", { exact: true }).fill(run);
  await panel
    .getByRole("checkbox", { name: run + " oferta", exact: true })
    .check();
  await panel
    .getByRole("button", { name: "Guardar promoción", exact: true })
    .click();
  await expect(panel).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: run + " promoción", exact: true }),
  ).toBeVisible();
});

test("a real 3D selection converts explicitly to cart and carries a server-built technical snapshot into assembly review", async ({
  page,
}) => {
  test.skip(!process.env.ATLAS_TEST_EMAIL, "Use authenticated commerce runner");
  test.setTimeout(180000);
  const env = readProjectEnvironment();
  const client = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const found = await client
    .from("components")
    .select("id,component_variants!inner(id)")
    .ilike("name", "Nomad%")
    .eq("published", true)
    .eq("component_variants.selectable", true)
    .limit(1)
    .single();
  expect(found.error).toBeNull();
  const variant = found.data!.component_variants[0].id;
  await page.goto("/entrar");
  await page
    .getByLabel("Correo electrónico")
    .fill(process.env.ATLAS_TEST_EMAIL!);
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill(process.env.ATLAS_TEST_PASSWORD!);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/mis-bicicletas/);
  await page.goto("/configurador?variant=" + variant);
  const buy = page.getByRole("button", {
    name: "Comprar componentes",
    exact: true,
  });
  await expect(buy).toBeEnabled({ timeout: 60000 });
  await buy.click();
  let panel = page.getByRole("dialog", { name: "Componentes de tu montaje" });
  await expect(panel).toContainText("Nomad");
  await page.screenshot({
    path: `models/local/validation/commerce/${test.info().project.name}-conversion.png`,
  });
  const replace = panel.getByRole("button", {
    name: "Reemplazar carrito completo",
  });
  if (await replace.count()) await replace.click();
  else await panel.getByRole("button", { name: "Sumar al carrito" }).click();
  const save = page.getByRole("button", {
    name: "Guardar y salir",
    exact: true,
  });
  await expect(save).toBeVisible();
  await save.click();
  await expect(page).toHaveURL(/\/comprar/, { timeout: 60000 });
  await page
    .getByLabel("Destinatario", { exact: true })
    .fill("Armado de demostración");
  await page
    .getByLabel("Correo o teléfono de contacto")
    .fill("demo@example.invalid");
  await page
    .getByRole("checkbox", { name: "Solicitar armado con revisión técnica" })
    .check();
  const builds = page.getByLabel("Montaje que quieres armar");
  await expect(builds.locator("option")).toHaveCount(2);
  await builds.selectOption({ index: 1 });
  await page
    .getByRole("button", { name: "Solicitar cotización", exact: true })
    .click();
  await expect(page).toHaveURL(/mis-pedidos\?tab=cotizaciones&quote=/);
  const id = new URL(page.url()).searchParams.get("quote")!;
  await page.goto("/administracion/pedidos?tab=cotizaciones&quote=" + id);
  panel = page.getByRole("dialog", { name: "Cotización" });
  await panel.getByText("Composición que se revisa", { exact: true }).click();
  await expect(panel).toContainText("Nomad");
  await expect(panel.getByLabel("Armado (S/)", { exact: true })).toHaveValue(
    "150",
  );
  await panel
    .getByRole("checkbox", { name: "Armado sin coste", exact: true })
    .check();
  await expect(panel.getByLabel("Armado (S/)", { exact: true })).toHaveValue(
    "0",
  );
  await panel
    .getByLabel("Revisión técnica y condiciones")
    .fill(
      "Instalación parcial de demostración; revisión humana del cuadro seleccionado.",
    );
  await panel
    .getByRole("button", { name: "Publicar cotización", exact: true })
    .click();
  await expect(
    panel.getByRole("heading", { name: /Pendiente de aceptación/ }),
  ).toBeVisible();
  await panel
    .getByRole("button", { name: "Cerrar detalle", exact: true })
    .click();
  await page.getByRole("button", { name: /Notificaciones ·/ }).click();
  const notices = page.getByRole("dialog", {
    name: "Notificaciones",
    exact: true,
  });
  await expect(notices).toContainText("Tu armado va sin coste");
  const update = notices
    .locator("article")
    .filter({ hasText: "Tu armado va sin coste" });
  const target = await update
    .getByRole("link", { name: "Revisar actualización", exact: true })
    .getAttribute("href");
  await update
    .getByRole("button", { name: "Marcar como leída", exact: true })
    .click();
  await expect(
    notices.getByText("Tu armado va sin coste", { exact: true }),
  ).toHaveCount(0);
  await notices
    .getByRole("button", { name: "Cerrar detalle", exact: true })
    .click();
  await page.reload();
  await page.getByRole("button", { name: /Notificaciones ·/ }).click();
  await expect(
    page.getByRole("dialog", { name: "Notificaciones", exact: true }),
  ).not.toContainText("Tu armado va sin coste");
  await page.goto(target!);
  await page
    .getByRole("link", { name: "Revisar y aceptar", exact: true })
    .click();
  await expect(
    page.getByRole("group", { name: "Método de pago", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ver resumen", exact: true }).click();
  await expect(page.locator(".sales-summary")).toContainText("Armado");
  await page.getByRole("button", { name: "Crear pedido", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Pendiente de pago", exact: true }),
  ).toBeVisible();
});
