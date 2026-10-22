import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

// A synthetic session and intercepted APIs test the header without touching Cloud accounts.
const projectUrl = readFileSync(".env", "utf8").match(/^SUPABASE_URL=["']?([^\s"']+)/m)![1];
const storageKey = `sb-${new URL(projectUrl).hostname.split(".")[0]}-auth-token`;
const user = {
  id: "00000000-0000-4000-8000-000000000001", aud: "authenticated", role: "authenticated",
  email: "rider@example.test", email_confirmed_at: "2026-10-21T00:00:00Z", created_at: "2026-10-21T00:00:00Z",
  app_metadata: { provider: "google", providers: ["google"] },
  user_metadata: { full_name: "Alex Rider" }, identities: [{ provider: "google", user_id: "00000000-0000-4000-8000-000000000001" }],
};

test.beforeEach(async ({ page }) => {
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const jwt = [Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url"),
    Buffer.from(JSON.stringify({ sub: user.id, aud: "authenticated", exp: expires })).toString("base64url"), "fixture"].join(".");
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
    key: storageKey, value: { access_token: jwt, refresh_token: "fixture", expires_at: expires, expires_in: 3600, token_type: "bearer", user },
  });
  await page.route("**/auth/v1/user", route => route.fulfill({ json: user }));
  await page.route("**/auth/v1/logout**", route => route.fulfill({ status: 204 }));
  await page.route("**/rest/v1/**", route => route.fulfill({ json: route.request().url().includes("/rpc/get_my_access") ? {
    role: { id: "user-role", name: "Usuario", key: "user" }, permissions: ["builds.read_own"],
  } : [] }));
});

test("account disclosure shows identity, fits the viewport and supports Escape", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Mi cuenta", exact: true });
  await trigger.click();
  const panel = page.getByRole("region", { name: "Cuenta activa" });
  await expect(panel.getByText("rider@example.test")).toBeVisible();
  await expect(panel.getByText("Alex Rider", { exact: true })).toBeVisible();
  await expect(panel.getByText("Google vinculado")).toBeVisible();
  await expect(panel.getByRole("link", { name: "Administración" })).toHaveCount(0);
  const bounds = await panel.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.keyboard.press("Tab");
  await expect(panel.getByRole("link", { name: "Mis bicicletas" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(panel).toHaveCount(0);
  await trigger.click();
  await page.getByRole("link", { name: "Catálogo", exact: true }).click();
  await expect(panel).toHaveCount(0);
});

test("signout still dispatches the cancellable unsaved-changes request", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Mi cuenta", exact: true }).click();
  await page.evaluate(() => {
    window.addEventListener("atlas:request-signout", event => {
      event.preventDefault();
      document.body.dataset.signoutGuard = "called";
    }, { once: true });
  });
  await page.getByRole("button", { name: "Cerrar sesión", exact: true }).click();
  await expect(page.locator("body")).toHaveAttribute("data-signout-guard", "called");
  await expect(page.getByRole("region", { name: "Cuenta activa" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Mi cuenta", exact: true })).toBeVisible();
});
