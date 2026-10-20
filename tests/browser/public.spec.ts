import { expect, test } from "@playwright/test";
test("public entry loads without the 3D engine and opens the catalog", async ({
  page,
}) => {
  const scripts: string[] = [];
  page.on("request", (request) => scripts.push(request.url()));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Cada pieza",
  );
  await expect(
    page.getByRole("link", { name: "Crear mi bicicleta" }),
  ).toBeVisible();
  expect(
    scripts.some(
      (url) => url.includes("/scene/BikeScene") || url.includes("three.module"),
    ),
  ).toBe(false);
  await page.getByRole("link", { name: "Explorar componentes" }).click();
  await expect(page).toHaveURL(/componentes/);
  await expect(
    page.getByRole("heading", { name: "Componentes." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("private assembly requests the shared login and preserves its intent", async ({
  page,
}) => {
  await page.goto("/configurador");
  await expect(page).toHaveURL(/entrar/);
  await expect(
    page.getByRole("heading", { name: "Iniciar sesión" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => sessionStorage.getItem("atlas:intent")),
  ).toBe("/configurador");
});
test("registration rejects mismatched passwords before calling Auth", async ({
  page,
}) => {
  await page.goto("/registro");
  await page
    .getByRole("textbox", { name: "Correo electrónico" })
    .fill("rider@example.test");
  await page.locator("#new-password").fill("UnaClaveDePrueba14");
  await page.locator("#confirm-password").fill("OtraClaveDePrueba14");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Las contraseñas no coinciden.",
  );
});
