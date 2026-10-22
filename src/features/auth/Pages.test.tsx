import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import AuthPage from "./Pages";
const remote = vi.hoisted(() => ({ google: vi.fn(), password: vi.fn() }));
vi.mock("../../lib/supabase", () => ({
  requireSupabase: () => ({ auth: { signInWithOAuth: remote.google, signInWithPassword: remote.password } }),
  userError: () => "No se pudo completar el acceso.",
}));
vi.mock("./provider", () => ({
  useAuth: () => ({ user: null, loading: false, permissions: [], error: "" }),
  readIntent: () => null, defaultDestination: () => "/componentes",
}));
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  remote.google.mockResolvedValue({ error: null });
});
it.each(["login", "register"] as const)("starts Google from %s without requiring password fields", async (mode) => {
  render(<MemoryRouter><AuthPage mode={mode} /></MemoryRouter>);
  fireEvent.click(screen.getByRole("button", { name: "Continuar con Google" }));
  await waitFor(() => expect(remote.google).toHaveBeenCalledExactlyOnceWith({
    provider: "google", options: { redirectTo: `${location.origin}/auth/callback` },
  }));
  expect(remote.password).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Conectando con Google…" })).toBeDisabled();
  expect(screen.getByRole("button", { name: mode === "login" ? "Entrar" : "Crear cuenta" })).toBeDisabled();
});
it("permits retry after failure and retains the entered email", async () => {
  remote.google.mockResolvedValueOnce({ error: { code: "provider_disabled" } });
  render(<MemoryRouter><AuthPage mode="login" /></MemoryRouter>);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "rider@example.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Continuar con Google" }));
  await screen.findByRole("alert");
  expect(screen.getByRole("textbox")).toHaveValue("rider@example.com");
  expect(screen.getByRole("button", { name: "Continuar con Google" })).toBeEnabled();
});
it.each(["recover", "password"] as const)("does not offer Google during %s", (mode) => {
  render(<MemoryRouter><AuthPage mode={mode} /></MemoryRouter>);
  expect(screen.queryByRole("button", { name: "Continuar con Google" })).not.toBeInTheDocument();
});
