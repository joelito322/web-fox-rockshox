import { useEffect } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { AdminWorkspace, useAdminState } from "./workspace";

it("clears account-scoped data without remounting the active route and ignores old callbacks", () => {
  const mounted = vi.fn();
  let oldUpdate: (() => void) | undefined;
  function Route() {
    const [search, setSearch] = useAdminState("users", "search", "");
    useEffect(() => { mounted(); }, []);
    return <><output aria-label="Búsqueda">{search}</output><button onClick={() => {
      setSearch("private@example.com");
      oldUpdate = () => setSearch("late@example.com");
    }}>Buscar</button></>;
  }
  const view = (scopeKey: string) => <AdminWorkspace scopeKey={scopeKey}><Route /></AdminWorkspace>;
  const { rerender } = render(view("account-a:users.read"));
  fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
  expect(screen.getByLabelText("Búsqueda")).toHaveTextContent("private@example.com");
  rerender(view("account-a:catalog.manage"));
  expect(screen.getByLabelText("Búsqueda")).toBeEmptyDOMElement();
  act(() => oldUpdate?.());
  expect(screen.getByLabelText("Búsqueda")).toBeEmptyDOMElement();
  rerender(view("account-b:users.read"));
  expect(screen.getByLabelText("Búsqueda")).toBeEmptyDOMElement();
  rerender(view("account-a:users.read"));
  act(() => oldUpdate?.());
  expect(screen.getByLabelText("Búsqueda")).toBeEmptyDOMElement();
  expect(mounted).toHaveBeenCalledTimes(1);
});
