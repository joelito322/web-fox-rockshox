import { useEffect, useState } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import { CommerceProvider, useCommerce } from "./Provider";
const mocked = vi.hoisted(() => ({
  auth: {
    user: null as null | { id: string },
    permissions: [] as string[],
    roleId: "user",
    loading: false,
  },
  get: vi.fn(),
  save: vi.fn(),
}));
vi.mock("../auth/provider", () => ({ useAuth: () => mocked.auth }));
vi.mock("./api", () => ({
  getCart: (signal?: AbortSignal) => mocked.get(signal),
  saveCart: (revision: number, lines: unknown) => mocked.save(revision, lines),
}));
const offer = "11111111-1111-4111-8111-111111111111";
const cart = (quantity: number, revision = 1) => ({
  id: "22222222-2222-4222-8222-222222222222",
  revision,
  items: quantity ? [{ offer_id: offer, quantity }] : [],
});
beforeEach(() => {
  localStorage.clear();
  mocked.auth = { user: null, permissions: [], roleId: "user", loading: false };
  mocked.get.mockReset();
  mocked.save.mockReset();
});
it("keeps an anonymous cart explicit at login, persists the account cart remotely, and never publishes account lines on logout", async () => {
  mocked.get.mockResolvedValue(cart(2));
  mocked.save.mockImplementation(async (_revision, lines) =>
    cart(lines[0]?.quantity ?? 0, 2),
  );
  function View() {
    const value = useCommerce()!;
    return (
      <>
        <output aria-label="count">
          {value.lines.reduce((n, l) => n + l.quantity, 0)}
        </output>
        <output aria-label="guest">{value.guest.length}</output>
        <button
          onClick={() => void value.add([{ offer_id: offer, quantity: 1 }])}
        >
          add
        </button>
        <button onClick={() => void value.merge("merge")}>merge</button>
      </>
    );
  }
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const tree = () => (
    <QueryClientProvider client={client}>
      <CommerceProvider>
        <View />
      </CommerceProvider>
    </QueryClientProvider>
  );
  const view = render(tree());
  fireEvent.click(screen.getByText("add"));
  await waitFor(() =>
    expect(screen.getByLabelText("count")).toHaveTextContent("1"),
  );
  mocked.auth = { ...mocked.auth, user: { id: "account-a" } };
  view.rerender(tree());
  await waitFor(() =>
    expect(screen.getByLabelText("count")).toHaveTextContent("2"),
  );
  expect(screen.getByLabelText("guest")).toHaveTextContent("1");
  expect(mocked.save).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("merge"));
  await waitFor(() =>
    expect(mocked.save).toHaveBeenCalledWith(1, [
      { offer_id: offer, quantity: 3 },
    ]),
  );
  await waitFor(() =>
    expect(screen.getByLabelText("guest")).toHaveTextContent("0"),
  );
  mocked.auth = { ...mocked.auth, user: null };
  view.rerender(tree());
  expect(screen.getByLabelText("count")).toHaveTextContent("0");
  expect(mocked.save).toHaveBeenCalledTimes(1);
});
it("rejects delayed writes from an earlier A→B→A generation without remounting its route", async () => {
  mocked.auth = { ...mocked.auth, user: { id: "account-a" } };
  mocked.get.mockResolvedValue(cart(1));
  let resolve: (value: unknown) => void = () => {};
  mocked.save.mockReturnValue(
    new Promise((r) => {
      resolve = r;
    }),
  );
  const mounted = vi.fn();
  function View() {
    const value = useCommerce()!;
    useEffect(() => {
      mounted();
    }, []);
    return (
      <>
        <output aria-label="count">
          {value.lines.reduce((n, l) => n + l.quantity, 0)}
        </output>
        <button
          onClick={() => void value.add([{ offer_id: offer, quantity: 1 }])}
        >
          add
        </button>
      </>
    );
  }
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const tree = () => (
    <QueryClientProvider client={client}>
      <CommerceProvider>
        <View />
      </CommerceProvider>
    </QueryClientProvider>
  );
  const view = render(tree());
  await waitFor(() =>
    expect(screen.getByLabelText("count")).toHaveTextContent("1"),
  );
  fireEvent.click(screen.getByText("add"));
  await waitFor(() => expect(mocked.save).toHaveBeenCalled());
  mocked.auth = { ...mocked.auth, user: { id: "account-b" } };
  view.rerender(tree());
  mocked.auth = { ...mocked.auth, user: { id: "account-a" } };
  view.rerender(tree());
  await act(async () => {
    resolve(cart(99, 99));
  });
  expect(client.getQueryData(["sales", "cart", "account-a"])).toEqual(cart(1));
  expect(mounted).toHaveBeenCalledTimes(1);
});

it("never replaces an existing remote cart when Add is pressed before its initial read finishes", async () => {
  mocked.auth = { ...mocked.auth, user: { id: "account-a" } };
  let resolve: (value: unknown) => void = () => {};
  mocked.get.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  function View() {
    const value = useCommerce()!;
    const [message, setMessage] = useState("");
    return (
      <>
        <output aria-label="count">
          {value.lines.reduce((n, l) => n + l.quantity, 0)}
        </output>
        <output aria-label="message">{message}</output>
        <button
          onClick={() =>
            void value
              .add([{ offer_id: offer, quantity: 1 }])
              .catch((e) => setMessage(e.message))
          }
        >
          add
        </button>
      </>
    );
  }
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <CommerceProvider>
        <View />
      </CommerceProvider>
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByText("add"));
  await waitFor(() =>
    expect(screen.getByLabelText("message")).toHaveTextContent(
      "sales_operation_pending",
    ),
  );
  await act(async () => resolve(cart(7)));
  await waitFor(() =>
    expect(screen.getByLabelText("count")).toHaveTextContent("7"),
  );
  expect(mocked.save).not.toHaveBeenCalled();
});
