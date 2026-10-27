import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { Compatibility } from "./Compatibility";
import { AssemblyIndex } from "./AssemblyNavigation";
import type { MountWarning } from "./model";
const conflict: MountWarning = { code: "rear_wheel_mismatch", message: "El aro y el neumático traseros tienen diámetros distintos.", level: "conflict", slots: ["rear_rim", "rear_tire"], details: [{ label: "Aro trasero", value: '27,5″' }, { label: "Neumático trasero", value: '29″' }] };
beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
it("keeps conflict and incomplete data counts distinct without opening automatically", () => {
  render(<Compatibility warnings={[conflict, { code: "fork_unknown", message: "Falta una medida", level: "unknown" }]} hasParts onSelect={vi.fn()} />);
  expect(screen.getByRole("status")).toHaveTextContent("1 incompatibilidad · 1 dato por confirmar");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Ver detalles" }));
  expect(screen.getByRole("dialog", { name: "Compatibilidad" })).toHaveTextContent('27,5″');
  expect(screen.getByRole("heading", { name: /Datos por confirmar/ })).toBeInTheDocument();
});
it("selects the affected position and updates open details when a conflict is resolved", () => {
  const select = vi.fn();
  const { rerender } = render(<Compatibility warnings={[conflict]} hasParts onSelect={select} />);
  fireEvent.click(screen.getByRole("button", { name: "Ver detalles" }));
  rerender(<Compatibility warnings={[]} hasParts onSelect={select} />);
  expect(screen.queryByText(conflict.message)).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Sin incompatibilidades detectadas");
  rerender(<Compatibility warnings={[conflict]} hasParts onSelect={select} />);
  fireEvent.click(screen.getByRole("button", { name: "Cambiar neumático trasero" }));
  expect(select).toHaveBeenCalledWith("rear_tire");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
it("does not describe an empty assembly as compatible and identifies affected index rows", () => {
  render(<><Compatibility warnings={[]} hasParts={false} onSelect={vi.fn()} /><AssemblyIndex configuration={{ schemaVersion: 1, name: "Prueba", items: [] }} variants={{}} slot="frame" warnings={[conflict]} onSelect={vi.fn()} /></>);
  expect(screen.getByRole("status")).toHaveTextContent("Selecciona piezas");
  expect(screen.queryByRole("button", { name: "Ver detalles" })).not.toBeInTheDocument();
  const row = screen.getByRole("button", { name: "Aro trasero" });
  expect(row).toHaveAccessibleDescription(/Incompatibilidad detectada/);
  expect(within(screen.getByRole("button", { name: "Aro delantero" })).queryByText("Incompatibilidad detectada")).not.toBeInTheDocument();
});
