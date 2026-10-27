import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Users from "./Users";
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), operation: vi.fn() }));
vi.mock("../auth/provider", () => ({ useAuth: () => ({
  user: { id: "actor" }, permissions: ["users.read", "users.assign_role", "users.invite"],
}) }));
vi.mock("../../lib/supabase", () => ({
  requireSupabase: () => ({ rpc: mocks.rpc }), userError: () => "No se pudo completar la operación.",
}));
vi.mock("./api", async (original) => ({
  ...await original<typeof import("./api")>(),
  listAccounts: async () => ({ count: 2, users: [accountA, accountB], roles }),
  grantableRoles: async () => roles,
  accountOperation: (input: unknown) => mocks.operation(input),
}));
vi.mock("../../components/ui/Drawer", () => ({ Drawer: ({ title, children, footer, onClose }: {
  title: string; children: ReactNode; footer?: ReactNode; onClose: () => void;
}) => <section role="dialog" aria-label={title}><h2>{title}</h2><button onClick={onClose}>Cerrar detalle</button>{children}{footer}</section> }));
const roles = [
  { id: "00000000-0000-4000-8000-000000000010", name: "Usuario" },
  { id: "00000000-0000-4000-8000-000000000011", name: "Editor" },
];
const accountA = {
  id: "00000000-0000-4000-8000-000000000001", email: "one@example.com",
  role_id: roles[0].id, role_name: "Usuario", revision: 1, confirmed: true,
  created_at: "2026-10-26T00:00:00Z", last_sign_in_at: null,
};
const accountB = { ...accountA, id: "00000000-0000-4000-8000-000000000002", email: "two@example.com" };
function mount(initial = "/administracion/usuarios") {
  const router = createMemoryRouter([{ path: "/administracion/usuarios", element: <Users /> }], { initialEntries: [initial] });
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RouterProvider router={router} /></QueryClientProvider>);
  return router;
}
beforeEach(() => {
  mocks.rpc.mockReset(); mocks.operation.mockReset();
  mocks.rpc.mockImplementation((_name, input) => ({ abortSignal: () => Promise.resolve({
    data: input.p_id === accountA.id ? accountA : accountB, error: null,
  }) }));
  vi.spyOn(window, "confirm").mockReturnValue(true);
});
describe("administration account details", () => {
  it("tracks same-section detail history, including close and reopen", async () => {
    const router = mount(`/administracion/usuarios?detail=${accountA.id}`);
    await screen.findByRole("heading", { name: accountA.email });
    await act(async () => { await router.navigate(`/administracion/usuarios?detail=${accountB.id}`); });
    await screen.findByRole("heading", { name: accountB.email });
    await act(async () => { await router.navigate("/administracion/usuarios"); });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await act(async () => { await router.navigate(-1); });
    await screen.findByRole("heading", { name: accountB.email });
    await act(async () => { await router.navigate(-1); });
    await screen.findByRole("heading", { name: accountA.email });
  });
  it("ignores a delayed account response after opening an invitation", async () => {
    let resolve!: (value: unknown) => void;
    mocks.rpc.mockImplementation(() => ({ abortSignal: () => new Promise((done) => { resolve = done; }) }));
    const router = mount(`/administracion/usuarios?detail=${accountA.id}`);
    fireEvent.click(await screen.findByRole("button", { name: /Crear usuario/ }));
    await screen.findByRole("dialog", { name: "Crear usuario" });
    fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "new@example.com" } });
    await act(async () => { resolve({ data: accountA, error: null }); });
    expect(screen.getByLabelText("Correo electrónico")).toHaveValue("new@example.com");
    expect(screen.queryByRole("heading", { name: accountA.email })).not.toBeInTheDocument();
    expect(router.state.location.search).toBe("");
  });
  it("preserves a dirty assignment when history navigation is cancelled", async () => {
    const router = mount(`/administracion/usuarios?detail=${accountA.id}`);
    await screen.findByRole("heading", { name: accountA.email });
    fireEvent.change(screen.getByLabelText("Rol"), { target: { value: roles[1].id } });
    await act(async () => { await router.navigate(`/administracion/usuarios?detail=${accountB.id}`); });
    await screen.findByRole("dialog", { name: "Cambios sin guardar" });
    fireEvent.click(screen.getByRole("button", { name: "Seguir editando" }));
    expect(screen.getByLabelText("Rol")).toHaveValue(roles[1].id);
    expect(router.state.location.search).toContain(accountA.id);
  });
  it("recovers a partial invitation by identity and confirms the assignment", async () => {
    mocks.operation.mockResolvedValueOnce({ status: "partial", userId: accountB.id }).mockResolvedValueOnce({ revision: 2 });
    mount();
    fireEvent.click(await screen.findByRole("button", { name: /Crear usuario/ }));
    fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: accountB.email } });
    fireEvent.change(screen.getByLabelText("Rol"), { target: { value: roles[1].id } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar invitación" }));
    fireEvent.click(await screen.findByRole("button", { name: /Completar asignación/ }));
    await screen.findByRole("heading", { name: accountB.email });
    expect(screen.getByLabelText("Rol")).toHaveValue(roles[1].id);
    vi.mocked(window.confirm).mockReturnValueOnce(false);
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(mocks.operation).toHaveBeenCalledTimes(1);
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining(accountB.email));
    fireEvent.click(screen.getByRole("button", { name: "Cerrar detalle" }));
    fireEvent.click(await screen.findByRole("button", { name: "Descartar cambios" }));
    fireEvent.click(await screen.findByRole("button", { name: /Completar asignación/ }));
    await screen.findByRole("heading", { name: accountB.email });
    expect(screen.getByLabelText("Rol")).toHaveValue(roles[1].id);
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(mocks.operation).toHaveBeenCalledTimes(2));
    expect(mocks.operation).toHaveBeenLastCalledWith({ action: "assign", userId: accountB.id, roleId: roles[1].id, revision: 1 });
    await waitFor(() => expect(screen.queryByRole("button", { name: /Completar asignación/ })).not.toBeInTheDocument());
  });
});
