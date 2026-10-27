import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import Catalog from "./Catalog";
import Presets from "./Presets";
import Roles from "./Roles";
const remote = vi.hoisted(() => ({ rpc: vi.fn(), matrix: vi.fn(), saveRoles: vi.fn() }));
vi.mock("../../lib/supabase", () => ({ requireSupabase: () => ({ rpc: remote.rpc }), userError: () => "No se pudo completar la operación." }));
vi.mock("../auth/provider", () => ({ useAuth: () => ({ user: { id: "99999999-9999-4999-8999-999999999999" }, permissions: ["catalog.manage", "catalog.publish", "roles.manage", "builds.read_own", "presets.manage", "presets.publish"] }) }));
vi.mock("./api", async (original) => ({ ...await original<typeof import("./api")>(), matrix: remote.matrix, saveRoles: remote.saveRoles }));
vi.mock("./preset-api", () => ({ usePresetBrands: () => ({ data: { brands: [] } }), usePresetOptions: () => ({ data: { components: [], count: 0 } }) }));
const id = (n: number) => `11111111-1111-4111-8111-${String(n).padStart(12, "0")}`;
const brand = (n: number) => ({ id: id(n), name: `Marca ${n}`, slug: `marca-${n}`, region: null, published: false });
const preset = (n: number) => ({ id: id(n), brand_id: id(50), name: `Bicicleta ${n}`, slug: `bike-${n}`, family_key: "bike", label: "M", model_year: null, image_key: null, kind: "example", sources: [], published: false, selectable: true, items: [] });
const roles = Array.from({ length: 10 }, (_, n) => ({ id: id(n + 1), key: `role-${n}`, name: `Rol ${n}`, description: "", active: true, is_system: false, revision: 1, permissions: [] as string[] }));
const matrix = () => ({ roles: structuredClone(roles), permissions: [{ code: "builds.read_own", name: "Ver mis bicicletas", area: "Montajes", description: "Acceso" }] });
function response(data: unknown) { const promise = Promise.resolve({ data, error: null }); return Object.assign(promise, { abortSignal: () => promise }); }
function start(element: React.ReactNode, path: string) {
  const router = createMemoryRouter([{ path: "/admin", element }, { path: "/administracion/marcas", element: <Catalog view="brand" /> }], { initialEntries: [path] });
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RouterProvider router={router} /></QueryClientProvider>);
  return router;
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
  HTMLElement.prototype.scrollIntoView = vi.fn();
  remote.matrix.mockResolvedValue(matrix());
  remote.saveRoles.mockResolvedValue(matrix());
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("synchronizes brand detail with query navigation and browser history", async () => {
  remote.rpc.mockImplementation((name, args) => response(name === "admin_catalog_page" ? { items: [brand(1), brand(2)], brands: [brand(1), brand(2)], count: 2 } : brand(args.p_id === id(1) ? 1 : 2)));
  const router = start(<Catalog view="brand" />, `/admin?detail=${id(1)}`);
  await waitFor(() => expect(screen.getByLabelText("Nombre")).toHaveValue("Marca 1"));
  await act(async () => { await router.navigate(`/admin?detail=${id(2)}`); });
  await waitFor(() => expect(screen.getByLabelText("Nombre")).toHaveValue("Marca 2"));
  await act(async () => { await router.navigate(-1); });
  await waitFor(() => expect(screen.getByLabelText("Nombre")).toHaveValue("Marca 1"));
  await act(async () => { await router.navigate("/admin"); });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
it("does not replace a new brand draft with a delayed initial detail", async () => {
  let resolve!: (value: unknown) => void;
  remote.rpc.mockImplementation((name) => name === "admin_catalog_page" ? response({ items: [], brands: [], count: 0 }) : new Promise((done) => { resolve = done; }));
  start(<Catalog view="brand" />, `/admin?detail=${id(1)}`);
  fireEvent.click(await screen.findByRole("button", { name: /crear marca/i }));
  fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Borrador propio" } });
  await act(async () => { resolve({ data: brand(1), error: null }); });
  expect(screen.getByLabelText("Nombre")).toHaveValue("Borrador propio");
  expect(screen.queryByRole("dialog", { name: "Cambios sin guardar" })).not.toBeInTheDocument();
});
it("synchronizes preset details with query history", async () => {
  remote.rpc.mockImplementation((name, args) => response(name === "admin_preset_page" ? { items: [], count: 0 } : preset(args.p_id === id(1) ? 1 : 2)));
  const router = start(<Presets />, `/admin?detail=${id(1)}`);
  await waitFor(() => expect(screen.getByLabelText("Nombre")).toHaveValue("Bicicleta 1"));
  await act(async () => { await router.navigate(`/admin?detail=${id(2)}`); });
  await waitFor(() => expect(screen.getByLabelText("Nombre")).toHaveValue("Bicicleta 2"));
  await act(async () => { await router.navigate(-1); });
  await waitFor(() => expect(screen.getByLabelText("Nombre")).toHaveValue("Bicicleta 1"));
});
it("synchronizes role detail with query navigation and closes when the URL has no detail", async () => {
  const router = start(<Roles />, `/admin?detail=${id(1)}`);
  await waitFor(() => expect(screen.getByLabelText("Nombre")).toHaveValue("Rol 0"));
  await act(async () => { await router.navigate(`/admin?detail=${id(2)}`); });
  await waitFor(() => expect(screen.getByLabelText("Nombre")).toHaveValue("Rol 1"));
  await act(async () => { await router.navigate("/admin"); });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
it("preserves permission edits across role pages and submits hidden changes", async () => {
  start(<Roles permissionsView />, "/admin");
  fireEvent.click(await screen.findByRole("checkbox", { name: "Rol 0: Ver mis bicicletas" }));
  fireEvent.click(screen.getByRole("button", { name: "Roles siguientes" }));
  expect(screen.queryByRole("checkbox", { name: "Rol 0: Ver mis bicicletas" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("checkbox", { name: "Rol 8: Ver mis bicicletas" }));
  fireEvent.click(screen.getByRole("button", { name: "Roles anteriores" }));
  expect(screen.getByRole("checkbox", { name: "Rol 0: Ver mis bicicletas" })).toBeChecked();
  fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
  await waitFor(() => expect(remote.saveRoles).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: id(1), permissions: ["builds.read_own"] }), expect.objectContaining({ id: id(9), permissions: ["builds.read_own"] })])));
});
it("opens the role page containing a linked matrix column and focuses its heading", async () => {
  start(<Roles permissionsView />, `/admin?role=${id(10)}`);
  await waitFor(() => expect(document.activeElement).toBe(document.getElementById(`role-${id(10)}`)));
  expect(screen.getByRole("checkbox", { name: "Rol 9: Ver mis bicicletas" })).toBeInTheDocument();
});
it("keeps the role draft when deactivation confirmation is cancelled", async () => {
  const confirm = vi.fn(() => false); vi.stubGlobal("confirm", confirm);
  start(<Roles />, `/admin?detail=${id(1)}`);
  fireEvent.click(await screen.findByLabelText("Activo"));
  fireEvent.click(screen.getByRole("button", { name: "Guardar rol" }));
  expect(confirm).toHaveBeenCalledWith(expect.stringContaining("Rol 0"));
  expect(remote.saveRoles).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Activo")).not.toBeChecked();
});
it("preserves a dirty brand when history navigation is cancelled and discards only after approval", async () => {
  remote.rpc.mockImplementation((name, args) => response(name === "admin_catalog_page" ? { items: [], brands: [], count: 0 } : brand(args.p_id === id(1) ? 1 : 2)));
  const router = start(<Catalog view="brand" />, `/admin?detail=${id(1)}`);
  await waitFor(() => expect(screen.getByLabelText("Nombre")).toHaveValue("Marca 1"));
  fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Edición pendiente" } });
  await act(async () => { await router.navigate(`/admin?detail=${id(2)}`); });
  expect(screen.getByRole("dialog", { name: "Cambios sin guardar" })).toBeInTheDocument();
  expect(screen.getByLabelText("Nombre")).toHaveValue("Edición pendiente");
  fireEvent.click(screen.getByRole("button", { name: "Seguir editando" }));
  expect(router.state.location.search).toContain(id(1));
  await act(async () => { await router.navigate(`/admin?detail=${id(2)}`); });
  fireEvent.click(screen.getByRole("button", { name: "Descartar cambios" }));
  await waitFor(() => expect(screen.getByLabelText("Nombre")).toHaveValue("Marca 2"));
});
it("links a component brand to a refreshable brand detail route", async () => {
  const component = { id: id(20), brand_id: id(1), name: "Cuadro", slug: "cuadro", category: "frame", description: "", technical_notes: null, image_key: null, disciplines: [], sources: [], published: false, brands: { name: "Marca 1" }, component_variants: [], variant_count: 0 };
  remote.rpc.mockImplementation((name, args) => response(name === "admin_catalog_page" ? { items: args.p_kind === "component" ? [component] : [brand(1)], brands: [brand(1)], count: 1 } : brand(1)));
  const router = start(<Catalog />, "/admin");
  fireEvent.click(await screen.findByRole("button", { name: "Marca 1" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/administracion/marcas"));
  expect(router.state.location.search).toContain(id(1));
  await waitFor(() => expect(screen.getByLabelText("Nombre")).toHaveValue("Marca 1"));
});
