import { test, expect } from "@playwright/test";
test("reviewed enduro reference exposes its real composition without requiring a public login", async ({
  page,
}) => {
  await page.goto("/bicicletas?q=META");
  const card = page.locator(".preset-card").filter({ hasText: "META SX V5" });
  await expect(card).toHaveCount(1);
  await expect(
    card.getByRole("combobox", { name: "Versión" }).locator("option"),
  ).toHaveCount(2);
  await card.getByRole("button", { name: "Ver montaje", exact: true }).click();
  const detail = page.getByRole("dialog", { name: "Detalle de la bicicleta" });
  await expect(
    detail.getByText("Ejemplo ATLAS", { exact: true }),
  ).toBeVisible();
  await expect(detail.locator(".piece-information")).toHaveCount(23);
  await expect(detail).toContainText("38 Factory");
  await expect(detail).toContainText("Bomber CR");
  await expect(detail).toContainText("Nylon 2017-12");
  await detail
    .getByRole("link", { name: "Personalizar esta bicicleta" })
    .click();
  await expect(page).toHaveURL(/entrar/);
  expect(
    await page.evaluate(() => sessionStorage.getItem("atlas:intent")),
  ).toMatch(/^\/configurador\?preset=/);
});
test("local catalogue photos, tyre comparison and contextual prices use the reviewed data", async ({
  page,
}) => {
  const comparisonReads: string[] = [];
  page.on("request", request => {
    if (new URL(request.url()).pathname.endsWith("/rest/v1/components")) comparisonReads.push(request.url());
  });
  await page.goto("/componentes?category=tire&q=Assegai");
  await page.locator(".product-card").click();
  let detail = page.getByRole("dialog", { name: "Detalle de la pieza" });
  await expect(
    detail.getByRole("heading", { name: "Assegai", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      detail
        .locator(".detail-media img")
        .evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBeGreaterThan(0);
  await detail.getByRole("button", { name: "Comparar", exact: true }).click();
  await detail
    .getByRole("button", { name: "Cerrar detalle", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("textbox", { name: "Buscar componentes" })
    .fill("Minion DHR II");
  await expect(page.locator(".product-card")).toContainText("Minion DHR II");
  await page.locator(".product-card").click();
  detail = page.getByRole("dialog", { name: "Detalle de la pieza" });
  await detail.getByRole("button", { name: "Comparar", exact: true }).click();
  await detail
    .getByRole("button", { name: "Cerrar detalle", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const beforeCompare = comparisonReads.length;
  await page.locator(".compare-link").click();
  await expect(page.locator(".comparison-table")).toContainText("Assegai");
  await expect(page.locator(".comparison-table")).toContainText(
    "Minion DHR II",
  );
  await expect(
    page.getByRole("link", { name: "Probar", exact: true }),
  ).toHaveCount(2);
  await page.waitForLoadState("networkidle");
  expect(comparisonReads).toHaveLength(beforeCompare);
  await page.goto("/componentes?category=pedals&q=Nylon");
  await page.locator(".product-card").click();
  detail = page.getByRole("dialog", { name: "Detalle de la pieza" });
  await expect(detail.locator(".price-reference")).toContainText("33,99");
  await expect(detail.locator(".price-reference")).toContainText(
    "Estados Unidos",
  );
  await expect(detail.locator(".price-reference")).toContainText("2026-10-19");
});

test("reviewed downhill family exposes both frame sizes and its DH-specific composition", async ({
  page,
}) => {
  await page.goto("/bicicletas?q=SUPREME");
  const card = page
    .locator(".preset-card")
    .filter({ hasText: "SUPREME DH V5" });
  await expect(card).toHaveCount(1);
  const versions = card.getByRole("combobox", { name: "Versión" });
  await expect(versions.locator("option")).toHaveCount(2);
  await versions.selectOption({ label: "L" });
  await card.getByRole("button", { name: "Ver montaje", exact: true }).click();
  const detail = page.getByRole("dialog", { name: "Detalle de la bicicleta" });
  await expect(detail.locator(".piece-information")).toHaveCount(23);
  for (const name of [
    "40 Factory",
    "GX DH",
    "XG-795",
    "DUB PressFit",
    "Potencia directa",
    "Bomber CR",
  ])
    await expect(detail).toContainText(name);
  await detail
    .getByRole("link", { name: "Personalizar esta bicicleta" })
    .click();
  await expect(page).toHaveURL(/entrar/);
});

test("brake filters, generation details and maintenance use the published braking batch", async ({
  page,
}) => {
  await page.goto("/componentes?category=brake&piston_count=2&q=SLX");
  await expect(page.locator(".product-card")).toHaveCount(1);
  await expect(page.locator(".product-card")).toContainText("SLX M7100");
  await expect(
    page.getByRole("combobox", { name: "Pistones", exact: true }),
  ).toHaveValue("2");
  await page.locator(".product-card").click();
  let detail = page.getByRole("dialog", { name: "Detalle de la pieza" });
  await expect(detail).toContainText("BR-M7100");
  await expect(detail).toContainText("BL-M7100");
  await detail.getByRole("button", { name: "Cerrar detalle" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("textbox", { name: "Buscar componentes" }).fill("MT5");
  await page
    .getByRole("combobox", { name: "Pistones", exact: true })
    .selectOption("4");
  await page
    .locator(".product-card")
    .filter({ has: page.getByRole("heading", { name: "MT5", exact: true }) })
    .click();
  detail = page.getByRole("dialog", { name: "Detalle de la pieza" });
  await expect(detail).toContainText("Royal Blood");
  await expect(detail.locator(".price-reference")).toContainText("112,90");
  await expect
    .poll(() =>
      detail
        .locator(".detail-media img")
        .evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBeGreaterThan(0);
  await detail.getByText("Mantenimiento y fuentes", { exact: true }).click();
  await expect(detail).toContainText("Antes de cada salida");
  await expect(detail).toContainText("No se fija un plazo anual");
  await detail.getByRole("button", { name: "Cerrar detalle" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("textbox", { name: "Buscar componentes" })
    .fill("Maven Bronze");
  await expect(page.locator(".product-card")).toHaveCount(1);
  await expect(page.locator(".product-card")).toContainText("Maven Bronze");
  await page.locator(".product-card").click();
  detail = page.getByRole("dialog", { name: "Detalle de la pieza" });
  await expect(detail).toContainText("B1");
  await expect(detail).toContainText("Maxima Mineral Brake Oil");
});

test("current suspension references expose all four brands, paired measures and documented maintenance", async ({ page }) => {
  test.setTimeout(45000);
  await page.goto("/componentes?category=fork");
  const brand = page.getByRole("combobox", { name: "Marca", exact: true });
  for (const name of ["FOX", "RockShox", "Öhlins", "Marzocchi"])
    await expect(brand.locator("option").filter({ hasText: name })).toHaveCount(1);
  await brand.selectOption({ label: "Öhlins" });
  const rxf = page.locator(".product-card").filter({ hasText: "RXF38 m.3" });
  await expect(rxf).toHaveCount(1);
  await rxf.click();
  let detail = page.getByRole("dialog", { name: "Detalle de la pieza" });
  await expect(detail).toContainText("RXF38 m.3");
  await expect(detail).toContainText("TTX18");
  await page.goto("/componentes?category=fork&q=Bomber%20Z1");
  await page.locator(".product-card").click();
  detail = page.getByRole("dialog", { name: "Detalle de la pieza" });
  await expect(detail.getByRole("combobox", { name: "Versión", exact: true }).locator("option")).toHaveCount(3);
  await detail.getByRole("combobox", { name: "Versión", exact: true }).selectOption({ label: "Aire · 29″ · 160 mm · Rojo" });
  await expect(detail.locator(".detail-media img")).toHaveAttribute("src", /marzocchi-z1-rail-red/);
  await expect.poll(() => detail.locator(".detail-media img").evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await page.goto("/componentes?category=shock&q=FLOAT%20X2");
  await page.locator(".product-card").click();
  detail = page.getByRole("dialog", { name: "Detalle de la pieza" });
  await expect(detail.getByRole("combobox", { name: "Versión", exact: true }).locator("option")).toHaveCount(11);
  await detail.getByRole("combobox", { name: "Versión", exact: true }).selectOption({ label: "250 × 75 mm · Ojal estándar" });
  await detail.getByText("Mantenimiento y fuentes", { exact: true }).click();
  await expect(detail).toContainText("Servicio completo");
  await expect(detail).toContainText("125");
  await page.goto("/componentes?category=shock&q=Vivid");
  await page.locator(".product-card").click();
  detail = page.getByRole("dialog", { name: "Detalle de la pieza" });
  await expect(detail.getByRole("combobox", { name: "Versión", exact: true }).locator("option")).toHaveCount(24);
  await detail.getByRole("combobox", { name: "Versión", exact: true }).selectOption({ label: "205 × 65 mm · Trunnion" });
  await expect(detail).toContainText("205 × 65 mm · Trunnion");
});

test("current frame families retain original sizing and separate measured variants", async ({ page }) => {
  test.setTimeout(90000);
  for (const [name, sizes, reaches] of [
    ["Nomad 7 CC", ["M", "L"], ["455", "475"]],
    ["Sender CFR", ["M", "L"], ["468", "495"]],
    ["S-Works Enduro", ["S3", "S4"], ["464", "487"]],
    ["Cherry Bomb 29", ["17″", "19″"], ["442,2", "459,2"]],
    ["Ransom RC", ["M", "L"], ["458", "483"]],
    ["Slash AL Gen 6", ["M", "L"], ["448", "488,1"]],
  ] as const) {
    await page.goto("/componentes?category=frame&q=" + encodeURIComponent(name));
    await expect(page.locator(".product-card")).toHaveCount(1);
    await page.locator(".product-card").click();
    const detail = page.getByRole("dialog", { name: "Detalle de la pieza" });
    const choice = detail.getByRole("combobox", { name: "Versión", exact: true });
    await expect(choice.locator("option")).toHaveCount(2);
    for (let i = 0; i < sizes.length; i++) {
      const option = choice.locator("option").filter({ hasText: sizes[i] + " ·" });
      await expect(option).toHaveCount(1);
      await choice.selectOption(await option.getAttribute("value") ?? "");
      await expect(detail).toContainText(reaches[i]);
    }
    await expect(detail.getByRole("link", { name: "Probar en mi bicicleta" })).toBeVisible();
  }
});

test("published tyre brands expose exact constructions and terrain without combining specifications", async ({ page }) => {
  test.setTimeout(60000);
  await page.goto("/componentes?category=tire&q=BFT");
  await page.locator(".product-card").click();
  let detail = page.getByRole("dialog", {name:"Detalle de la pieza"});
  await detail.getByRole("combobox", {name:"Versión",exact:true}).selectOption({label:"27.5 × 2.40 · EPS/TLR · Dual"});
  await expect(detail).toContainText("61-584");
  await expect(detail).toContainText("885");
  await page.goto("/componentes?category=tire&q=Pinner");
  await page.locator(".product-card").click();
  detail = page.getByRole("dialog", {name:"Detalle de la pieza"});
  const versions = detail.getByRole("combobox", {name:"Versión",exact:true});
  await expect(versions.locator("option")).toHaveCount(5);
  await versions.selectOption({label:"29 × 2.40 · ATC · Dual Tread"});
  await expect(detail).toContainText("120");
  await expect(detail).toContainText("Raíces");
  await expect(detail).toContainText("Seco");
  await versions.selectOption({label:"27.5 × 2.40 · AGC · Dual Layer"});
  await expect(detail).toContainText("61-584");
  await page.goto("/componentes?category=tire&q=Wild%20Enduro%20MS");
  await page.locator(".product-card").click();
  detail = page.getByRole("dialog", {name:"Detalle de la pieza"});
  await expect(detail).toContainText("2 × 55 TPI");
  await expect(detail).toContainText("Magi-X");
  await expect(detail).toContainText("Blando");
  await page.goto("/componentes?category=tire&q=GRAVITY%20Magic%20Mary");
  await page.locator(".product-card").click();
  detail = page.getByRole("dialog", {name:"Detalle de la pieza"});
  await detail.getByRole("combobox", {name:"Versión",exact:true}).selectOption({label:"29 × 2.40 · GRAVITY · Diagonal · SOFT"});
  await expect(detail).toContainText("62-622");
  await expect(detail).toContainText("1455");
  await expect(detail).toContainText("3,5");
});

test("a previous frame capture stays readable without duplicating current sizes", async ({ page }) => {
  await page.goto("/componentes/specialized-s-works-enduro-udh?variant=39561b5e-5468-5f9c-8773-fe86b08209a9");
  const detail = page.getByRole("dialog", {name:"Detalle de la pieza"});
  const versions = detail.getByRole("combobox", {name:"Versión",exact:true});
  await expect(versions.locator("option:checked")).toContainText("Referencia anterior");
  await expect(detail.getByRole("link", {name:"Probar en mi bicicleta"})).toHaveCount(0);
  await expect(detail).toContainText("Retirada de nuevos montajes");
  await versions.selectOption({label:"S3 · Gloss Rebel Pink Tint Carbon / Fog Tint"});
  await expect(versions.locator("option")).toHaveCount(2);
  const shell = detail.locator(".spec-group").filter({has:page.getByRole("heading", {name:"Caja de pedalier",exact:true})});
  await expect(shell).toContainText("73");
  await expect(detail.getByRole("link", {name:"Probar en mi bicicleta"})).toBeVisible();
});
