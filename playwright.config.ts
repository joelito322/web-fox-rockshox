import { defineConfig, devices } from "@playwright/test";
const port = Number(process.env.ATLAS_PLAYWRIGHT_PORT ?? 4180);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("Invalid Playwright server port");
const baseURL = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  // Bound simultaneous software-rendered WebGL contexts in local/CI runs.
  workers: 2,
  // Functional checks include remote Auth and data requests; performance is measured separately.
  expect: { timeout: 15000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
    // Optional installed browser for compatibility runs; a mobile profile remains emulation.
    launchOptions: process.env.ATLAS_BROWSER_EXECUTABLE
      ? { executablePath: process.env.ATLAS_BROWSER_EXECUTABLE }
      : {},
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: {
    command:
      `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
