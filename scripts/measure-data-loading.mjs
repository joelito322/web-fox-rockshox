// Measures browser data traffic only; development module/HMR time is not a production benchmark.
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
const base = process.env.ATLAS_BASE_URL ?? "http://127.0.0.1:5174";
const label =
  process.argv.find((a) => a.startsWith("--label="))?.slice(8) ?? "current";
if (!/^[a-z0-9-]+$/i.test(label)) throw Error("Invalid report label");
const browser = await chromium.launch();
const rows = [],
  phases = [];
try {
  const page = await browser.newPage();
  let stage = "";
  const starts = new Map();
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      !url.pathname.startsWith("/rest/v1/") &&
      !url.pathname.startsWith("/storage/v1/")
    )
      return;
    starts.set(request, {
      stage,
      start: performance.now(),
      endpoint: url.pathname.startsWith("/rest/")
        ? url.pathname.slice(9)
        : "storage-image",
    });
  });
  page.on("requestfinished", async (request) => {
    const start = starts.get(request);
    if (!start) return;
    const response = await request.response();
    let bytes = null;
    try {
      bytes = (await response.body()).length;
    } catch {}
    rows.push({
      stage: start.stage,
      endpoint: start.endpoint,
      ms: Math.round(performance.now() - start.start),
      bytes,
      status: response.status(),
    });
  });
  page.on("requestfailed", (request) => {
    const start = starts.get(request);
    if (start)
      rows.push({
        stage: start.stage,
        endpoint: start.endpoint,
        cancelled: true,
      });
  });
  async function phase(name, action) {
    stage = name;
    const start = performance.now();
    await action();
    // Drain finished/aborted requests; phase wall time includes this deliberate observation window.
    await page.waitForTimeout(600);
    phases.push({ name, observationMs: Math.round(performance.now() - start) });
  }
  await phase("catalog-cold", async () => {
    await page.goto(`${base}/componentes?category=brake`);
    await page.locator(".product-card").first().waitFor();
  });
  await phase("component-detail", async () => {
    await page.locator(".product-card").first().click();
    await page.getByRole("dialog").waitFor();
  });
  await page.keyboard.press("Escape");
  await phase("typing-search", async () => {
    await page
      .getByRole("textbox", { name: "Buscar componentes" })
      .pressSequentially("SHIMANO", { delay: 65 });
    await page.waitForTimeout(700);
  });
  await phase("bicycles-cold", async () => {
    await page.getByRole("link", { name: "Bicicletas", exact: true }).click();
    await page.locator(".bicycle-card").first().waitFor();
    await page.waitForTimeout(1200);
  });
  await phase("preset-detail", async () => {
    await page
      .locator(".bicycle-card")
      .first()
      .getByRole("button", { name: /Ver montaje de/ })
      .click();
    await page.getByRole("dialog").waitFor();
    await page.waitForTimeout(1200);
  });
  await page.keyboard.press("Escape");
  await phase("catalog-warm", async () => {
    await page.getByRole("link", { name: "Componentes", exact: true }).click();
    await page.waitForTimeout(800);
  });
  await phase("bicycles-warm", async () => {
    await page.getByRole("link", { name: "Bicicletas", exact: true }).click();
    await page.locator(".bicycle-card").first().waitFor();
    await page.waitForTimeout(1000);
  });
  const report = {
    context:
      "Vite development frontend, real Supabase Cloud; endpoint duration includes transport, not SQL execution. Observation windows are not readiness times.",
    phases,
    requests: rows,
  };
  mkdirSync("/tmp/atlas-query-audit", { recursive: true });
  writeFileSync(
    `/tmp/atlas-query-audit/${label}-public.json`,
    JSON.stringify(report, null, 2) + "\n",
  );
  for (const phase of phases) {
    const requests = rows.filter((r) => r.stage === phase.name);
    console.log(
      JSON.stringify({
        stage: phase.name,
        requests: requests.length,
        cancelled: requests.filter((r) => r.cancelled).length,
        bytes: requests.reduce((n, r) => n + (r.bytes ?? 0), 0),
      }),
    );
  }
} finally {
  await browser.close();
}
