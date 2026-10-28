import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { expect, it, vi } from "vitest";
import { CartContents } from "./Cart";
import type { CartLine } from "./model";
const mock = vi.hoisted(() => ({
  read: vi.fn(),
  cart: {} as Record<string, unknown>,
}));
vi.mock("../auth/provider", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("./Provider", () => ({ useCommerce: () => mock.cart }));
vi.mock("./api", () => ({
  getCart: vi.fn(),
  salesRpc: (...args: unknown[]) => mock.read(...args),
}));
it("updates quantity totals from cached unit prices without another price query per click", async () => {
  const id = "11111111-1111-4111-8111-111111111111";
  mock.read.mockResolvedValue([
    {
      offer_id: id,
      label: "Neumático demo",
      identity: { finish: "Negro" },
      unit_cents: 15000,
      base_cents: 15000,
      discount_cents: 0,
      available: 10,
    },
  ]);
  function Fixture() {
    const [lines, setLines] = useState<CartLine[]>([
      { offer_id: id, quantity: 2 },
    ]);
    mock.cart = {
      lines,
      guest: [],
      loading: false,
      busy: false,
      error: null,
      write: async (next: CartLine[]) => setLines(next),
    };
    return <CartContents />;
  }
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Fixture />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  await waitFor(() =>
    expect(screen.getByText(/Total de componentes/)).toHaveTextContent(
      "300.00",
    ),
  );
  fireEvent.click(screen.getByRole("button", { name: "Sumar unidad" }));
  await waitFor(() =>
    expect(screen.getByText(/Total de componentes/)).toHaveTextContent(
      "450.00",
    ),
  );
  expect(mock.read).toHaveBeenCalledTimes(1);
});
