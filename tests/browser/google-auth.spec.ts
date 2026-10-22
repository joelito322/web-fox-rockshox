import { expect, test } from "@playwright/test";

// Exercise the real Supabase authorization redirect; stop before Google consent.
// No Google account or simulated session is created by this check.
test("Google access starts PKCE and reaches Google without password fields", async ({ page }) => {
  let authorize: URL | undefined;
  page.on("request", request => {
    const url = new URL(request.url());
    if (url.pathname === "/auth/v1/authorize") authorize = url;
  });
  await page.goto("/registro");
  const origin = new URL(page.url()).origin;
  await expect(page.getByRole("button", { name: "Continuar con Google" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Continuar con Google" }).click();
  await page.waitForURL(url => url.hostname === "accounts.google.com");
  await expect(page.locator("#identifierId")).toBeVisible();
  expect(authorize?.searchParams.get("provider")).toBe("google");
  expect(authorize?.searchParams.get("code_challenge_method")).toBe("s256");
  expect(authorize?.searchParams.get("code_challenge")).toBeTruthy();
  expect(authorize?.searchParams.get("redirect_to")).toBe(`${origin}/auth/callback`);
  expect(new URL(page.url()).hostname).toBe("accounts.google.com");
});

test("cancelled Google return clears sensitive parameters and allows retry", async ({ page }) => {
  await page.goto("/auth/callback?error=access_denied&error_description=private-provider-message");
  await expect(page.getByRole("alert")).toContainText("No se completó el acceso con Google");
  await expect(page).toHaveURL(/\/auth\/callback$/);
  await expect(page.getByText("private-provider-message")).toHaveCount(0);
  await page.getByRole("link", { name: "Volver a iniciar sesión" }).click();
  await expect(page.getByRole("button", { name: "Continuar con Google" })).toBeEnabled();
});
