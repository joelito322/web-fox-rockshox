import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  // Bound simultaneous software-rendered WebGL contexts in local/CI runs.
  workers: 2,
  // Functional checks include remote Auth and data requests; performance is measured separately.
  expect: { timeout: 15000 },
  use: {
    baseURL: "http://127.0.0.1:4180",
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
      "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4180 --strictPort",
    url: "http://127.0.0.1:4180",
    reuseExistingServer: !process.env.CI,
  },
});
