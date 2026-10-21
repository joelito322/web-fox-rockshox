import { expect, test, type Page } from "@playwright/test";

function trackData(page: Page) {
  const requests: string[] = [];
  const measurements: Promise<{
    endpoint: string;
    bytes: number;
    status: number;
  }>[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.includes("/rest/v1/"))
      requests.push(url.pathname.split("/rest/v1/")[1]);
  });
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (!url.pathname.includes("/rest/v1/")) return;
    measurements.push(
      (async () => ({
        endpoint: url.pathname.split("/rest/v1/")[1],
        bytes: (await response.body()).byteLength,
        status: response.status(),
      }))(),
    );
  });
  return {
    requests,
    async report(name: string) {
      const data = await Promise.all(measurements);
      console.log(
        JSON.stringify({
          name,
          requests: requests.length,
          bytes: data.reduce((sum, response) => sum + response.bytes, 0),
          responses: data,
        }),
      );
    },
  };
}

test("component search batches keystrokes and warm details need no new data requests", async ({
  page,
}) => {
  const data = trackData(page);
  await page.goto("/componentes?category=tire");
  await expect(page.locator(".product-card").first()).toBeVisible();
  await page.waitForLoadState("networkidle");
  const start = data.requests.length;
  await page
    .getByRole("textbox", { name: "Buscar componentes" })
    .pressSequentially("Assegai", { delay: 20 });
  await expect(page.locator(".product-card")).toHaveCount(1);
  await expect(page.locator(".product-card")).toContainText("Assegai");
  await page.waitForLoadState("networkidle");
  expect(data.requests.slice(start)).toEqual(["components"]);
  await page.locator(".product-card").click();
  let detail = page.getByRole("dialog", { name: "Detalle de la pieza" });
  await expect(
    detail.getByRole("heading", { name: "Assegai", exact: true }),
  ).toBeVisible();
  await page.waitForLoadState("networkidle");
  await detail
    .getByRole("button", { name: "Cerrar detalle", exact: true })
    .click();
  await expect(detail).toHaveCount(0);
  const beforeReopen = data.requests.length;
  await page.locator(".product-card").click();
  detail = page.getByRole("dialog", { name: "Detalle de la pieza" });
  await expect(
    detail.getByRole("heading", { name: "Assegai", exact: true }),
  ).toBeVisible();
  const versions = detail.getByRole("combobox", {
    name: "Versión",
    exact: true,
  });
  const options = await versions.locator("option").count();
  if (options > 1) await versions.selectOption({ index: 1 });
  await page.waitForLoadState("networkidle");
  expect(data.requests.slice(beforeReopen)).toEqual([]);
  await data.report("components-debounce-and-warm-detail");
});

test("bike thumbnails batch their sources and hot tabs, versions and details reuse data", async ({
  page,
}) => {
  const data = trackData(page);
  await page.goto("/bicicletas");
  await expect(page.locator(".bicycle-card")).toHaveCount(2);
  await page.waitForLoadState("networkidle");
  // One list request and one batch of item sources, independently of card count.
  expect(
    data.requests.filter((endpoint) => endpoint === "rpc/list_preset_families"),
  ).toHaveLength(1);
  expect(
    data.requests.filter((endpoint) => endpoint === "bike_presets"),
  ).toHaveLength(1);
  const family = page
    .locator(".bicycle-card")
    .filter({ hasText: "SUPREME DH V5" });
  const beforeVersion = data.requests.length;
  await family
    .getByRole("combobox", { name: "Versión", exact: true })
    .selectOption({ label: "L" });
  await page.waitForLoadState("networkidle");
  expect(data.requests.slice(beforeVersion)).toEqual([]);
  await family
    .getByRole("button", { name: "Ver montaje", exact: true })
    .click();
  let detail = page.getByRole("dialog", { name: "Detalle de la bicicleta" });
  await expect(detail.locator(".piece-information")).toHaveCount(23);
  await page.waitForLoadState("networkidle");
  // The already loaded family list supplies sibling versions; no third serial query.
  expect(data.requests.slice(beforeVersion)).toEqual([
    "bike_presets",
    "components",
  ]);
  await detail
    .getByRole("button", { name: "Cerrar detalle", exact: true })
    .click();
  const beforeReopen = data.requests.length;
  await family
    .getByRole("button", { name: "Ver montaje", exact: true })
    .click();
  detail = page.getByRole("dialog", { name: "Detalle de la bicicleta" });
  await expect(detail.locator(".piece-information")).toHaveCount(23);
  await page.waitForLoadState("networkidle");
  expect(data.requests.slice(beforeReopen)).toEqual([]);
  await detail
    .getByRole("button", { name: "Cerrar detalle", exact: true })
    .click();
  await page.getByRole("link", { name: "Componentes", exact: true }).click();
  await expect(page.locator(".product-card").first()).toBeVisible();
  await page.waitForLoadState("networkidle");
  const beforeReturn = data.requests.length;
  await page.getByRole("link", { name: "Bicicletas", exact: true }).click();
  await expect(page.locator(".bicycle-card")).toHaveCount(2);
  await page.waitForLoadState("networkidle");
  expect(data.requests.slice(beforeReturn)).toEqual([]);
  const beforeSearch = data.requests.length;
  await page
    .getByRole("textbox", { name: "Buscar bicicletas" })
    .pressSequentially("SUPREME", { delay: 20 });
  await expect(page.locator(".bicycle-card")).toHaveCount(1);
  await page.waitForLoadState("networkidle");
  expect(
    data.requests
      .slice(beforeSearch)
      .filter((endpoint) => endpoint === "rpc/list_preset_families"),
  ).toHaveLength(1);
  expect(
    data.requests
      .slice(beforeSearch)
      .filter((endpoint) => endpoint === "bike_presets"),
  ).toHaveLength(0);
  await data.report("bicycles-batch-version-warm-navigation");
});
