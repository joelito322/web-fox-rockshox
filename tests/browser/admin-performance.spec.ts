import { expect, test } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

test("admin searches debounce, warm tabs reuse data and reference brands omit inventory", async ({ page }) => {
  test.skip(!process.env.ATLAS_ADMIN_TEST_EMAIL, "Run scripts/validate-admin-performance.mjs");
  test.setTimeout(90000);
  const requests: { endpoint: string; body: Record<string, unknown> | null }[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.includes("/rest/v1/rpc/") || url.pathname.includes("/functions/v1/"))
      requests.push({ endpoint: url.pathname.split("/").at(-1)!, body: request.postDataJSON() });
  });
  await page.goto("/entrar");
  await page.getByLabel("Correo electrónico").fill(process.env.ATLAS_ADMIN_TEST_EMAIL!);
  await page.getByLabel("Contraseña", { exact: true }).fill(process.env.ATLAS_ADMIN_TEST_PASSWORD!);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/mis-bicicletas/);
  await page.goto("/administracion/usuarios");
  await expect(page.getByRole("button", { name: process.env.ATLAS_ADMIN_TEST_EMAIL!, exact: true })).toBeVisible();
  const before = requests.filter((r) => r.endpoint === "admin_user_page").length;
  const search = page.getByRole("textbox", { name: "Buscar usuario" });
  await search.fill("a"); await search.fill("at"); await search.fill("atlas-");
  await expect.poll(() => requests.filter((r) => r.endpoint === "admin_user_page").length).toBe(before + 1);
  await expect(page.getByRole("button", { name: process.env.ATLAS_ADMIN_TEST_EMAIL!, exact: true })).toBeVisible();
  const tabs = page.locator(".admin-tabs");
  await tabs.getByRole("link", { name: "Roles", exact: true }).click();
  await expect(page.getByRole("button", { name: "Crear rol", exact: true })).toBeVisible();
  const matrixReads = requests.filter((r) => r.endpoint === "get_roles_matrix").length;
  await tabs.getByRole("link", { name: "Permisos", exact: true }).click();
  await expect(page.locator(".permission-table")).toBeVisible();
  expect(requests.filter((r) => r.endpoint === "get_roles_matrix")).toHaveLength(matrixReads);
  await tabs.getByRole("link", { name: "Bicicletas", exact: true }).click();
  await expect(page.getByRole("button", { name: "Bicicleta de referencia", exact: true })).toBeEnabled();
  const options = requests.filter((r) => r.endpoint === "preset_options");
  expect(options).toHaveLength(1);
  expect(options[0].body?.p_ids).toEqual([]);
  await tabs.getByRole("link", { name: "Catálogo", exact: true }).click();
  await expect(page.getByRole("button", { name: "Crear marca", exact: true })).toBeVisible();
  const catalogBefore = requests.filter((r) => r.endpoint === "admin_catalog_page").length;
  const modelSearch = page.getByRole("textbox", { name: "Buscar modelo", exact: true });
  await modelSearch.fill("s"); await modelSearch.fill("su"); await modelSearch.fill("supreme");
  await expect.poll(() => requests.filter((r) => r.endpoint === "admin_catalog_page").length).toBe(catalogBefore + 1);
  await expect(page.getByRole("button", { name: /SUPREME/i }).first()).toBeVisible();
  expect(requests.filter((r) => r.endpoint === "admin-users")).toHaveLength(0);
  const summary = {
    profile: test.info().project.name,
    userSearchRequests: 1, catalogSearchRequests: 1, warmMatrixExtraRequests: 0,
    referenceBrandsRequestedIds: options[0].body?.p_ids, edgeListRequests: 0,
    endpoints: requests.map((request) => request.endpoint),
  };
  const dir = "/tmp/atlas-query-audit/admin"; mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/${test.info().project.name}.json`, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary));
});
