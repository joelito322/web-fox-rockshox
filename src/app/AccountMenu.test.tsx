import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AccountMenu } from "./AccountMenu";
const session = vi.hoisted(() => ({
  user: { id: "first", email: "rider@example.test", email_confirmed_at: "2026-10-21", user_metadata: { full_name: "Alex Rider" }, identities: [{ provider: "google" }] },
  permissions: ["builds.read_own"], roleName: "Usuario", loading: false, error: "",
}));
vi.mock("../features/auth/provider", () => ({ useAuth: () => session }));
beforeEach(() => {
  session.user.id = "first";
  session.user.email = "rider@example.test";
  session.permissions = ["builds.read_own"];
  session.error = "";
});
afterEach(cleanup);
const mount = (logout = vi.fn()) => render(<MemoryRouter><AccountMenu onLogout={logout} /><button>Fuera</button></MemoryRouter>);
const open = () => fireEvent.click(screen.getByRole("button", { name: "Mi cuenta" }));
it("shows the current identity and verified details only when expanded", () => {
  mount();
  expect(screen.queryByRole("region", { name: "Cuenta activa" })).not.toBeInTheDocument();
  open();
  expect(screen.getByText("Alex Rider")).toBeVisible();
  expect(screen.getByText("rider@example.test")).toBeVisible();
  expect(screen.getByText("Usuario")).toBeVisible();
  expect(screen.getByText("Correo confirmado")).toBeVisible();
  expect(screen.getByText("Google vinculado")).toBeVisible();
  expect(screen.getByRole("link", { name: "Mis bicicletas" })).toHaveAttribute("href", "/mis-bicicletas");
  expect(screen.queryByRole("link", { name: "Administración" })).not.toBeInTheDocument();
});
it("returns focus to the trigger with Escape", () => {
  mount(); open();
  screen.getByRole("button", { name: "Cerrar sesión" }).focus();
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.getByRole("button", { name: "Mi cuenta" })).toHaveFocus();
  expect(screen.getByRole("button", { name: "Mi cuenta" })).toHaveAttribute("aria-expanded", "false");
});
it("closes on outside pointer and outside focus", () => {
  mount(); open();
  fireEvent.pointerDown(screen.getByRole("button", { name: "Fuera" }));
  expect(screen.queryByRole("region")).not.toBeInTheDocument();
  open();
  fireEvent.focusIn(screen.getByRole("button", { name: "Fuera" }));
  expect(screen.queryByRole("region")).not.toBeInTheDocument();
});
it("uses current permissions for account destinations", () => {
  session.permissions = ["users.read"];
  mount(); open();
  expect(screen.queryByRole("link", { name: "Mis bicicletas" })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Administración" })).toBeVisible();
});
it("delegates signout to the existing guarded action and closes", () => {
  const logout = vi.fn();
  mount(logout); open();
  fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
  expect(logout).toHaveBeenCalledOnce();
  expect(screen.queryByRole("region")).not.toBeInTheDocument();
});
it("closes on identity change and does not retain the previous email", () => {
  const view = mount(); open();
  session.user.id = "second";
  session.user.email = "second@example.test";
  view.rerender(<MemoryRouter><AccountMenu onLogout={vi.fn()} /><button>Fuera</button></MemoryRouter>);
  expect(screen.queryByRole("region")).not.toBeInTheDocument();
  open();
  expect(screen.getByText("second@example.test")).toBeVisible();
  expect(screen.queryByText("rider@example.test")).not.toBeInTheDocument();
});
