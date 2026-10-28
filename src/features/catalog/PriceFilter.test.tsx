import { act, fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PriceFilter } from "./PriceFilter";
afterEach(cleanup);
describe("compact price filter", () => {
  it("applies deliberately and prevents reversed ranges", async () => {
    const change = vi.fn();
    render(<PriceFilter value={{}} onChange={change} />);
    fireEvent.click(screen.getByLabelText("Filtrar por precio"));
    await waitFor(() => expect(screen.getByLabelText("Filtrar por precio").closest("details")).toHaveAttribute("open"));
    fireEvent.change(screen.getByLabelText("Desde S/"), { target: { value: "2500" } });
    fireEvent.change(screen.getByLabelText("Hasta S/"), { target: { value: "500" } });
    await act(async () => fireEvent(screen.getByLabelText("Filtrar por precio").closest("details")!, new Event("toggle")));
    expect(screen.getByLabelText("Desde S/")).toHaveValue("2500");
    expect(screen.getByLabelText("Hasta S/")).toHaveValue("500");
    expect(change).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Aplicar" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Hasta S/"), { target: { value: "3000,50" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));
    expect(change).toHaveBeenCalledWith({ min: 250000, max: 300050 });
    expect(screen.getByLabelText("Filtrar por precio").closest("details")).not.toHaveAttribute("open");
  });
  it("clears an applied range and restores focus on Escape", async () => {
    const change = vi.fn();
    render(<PriceFilter value={{ max: 8000 }} onChange={change} />);
    fireEvent.click(screen.getByRole("button", { name: /Quitar filtro de precio/ }));
    expect(change).toHaveBeenCalledWith({});
    fireEvent.click(screen.getByLabelText("Filtrar por precio"));
    await waitFor(() => expect(screen.getByLabelText("Filtrar por precio").closest("details")).toHaveAttribute("open"));
    fireEvent.keyDown(screen.getByLabelText("Hasta S/"), { key: "Escape" });
    expect(screen.getByLabelText("Filtrar por precio").closest("details")).not.toHaveAttribute("open");
    expect(screen.getByLabelText("Filtrar por precio")).toHaveFocus();
  });
});
