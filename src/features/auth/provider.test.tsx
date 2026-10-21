import { act, render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./provider";
const access = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn(), listener: null as null | ((event: string, session: unknown) => void) }));
vi.mock("../../lib/supabase", () => ({
  userError: () => "Error de acceso",
  supabase: {
    rpc: access.rpc,
    auth: {
      getUser: access.getUser,
      onAuthStateChange: (listener: typeof access.listener) => {
        access.listener = listener;
        return { data: { subscription: { unsubscribe() {} } } };
      },
    },
  },
}));
function Probe() {
  const auth = useAuth();
  return <span data-testid="identity">{auth.user?.id ?? "anonymous"}</span>;
}
beforeEach(() => {
  access.getUser.mockReset();
  access.rpc.mockReset().mockResolvedValue({ data: { permissions: ["builds.read_own"] }, error: null });
});
afterEach(() => { access.listener = null; });
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><AuthProvider><Probe /></AuthProvider></QueryClientProvider>);
}
describe("access verification on focus", () => {
  it("deduplicates concurrent focus and denied events but verifies every later focus", async () => {
    let resolve!: (value: unknown) => void;
    access.getUser.mockReturnValue(new Promise((done) => { resolve = done; }));
    const screen = mount();
    act(() => {
      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new Event("atlas:access-denied"));
      window.dispatchEvent(new Event("focus"));
    });
    expect(access.getUser).toHaveBeenCalledTimes(1);
    await act(async () => resolve({ data: { user: { id: "first" } }, error: null }));
    await waitFor(() => expect(screen.getByTestId("identity")).toHaveTextContent("first"));
    expect(access.rpc).toHaveBeenCalledTimes(1);
    access.getUser.mockResolvedValue({ data: { user: { id: "first" } }, error: null });
    act(() => window.dispatchEvent(new Event("focus")));
    await waitFor(() => expect(access.getUser).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(access.rpc).toHaveBeenCalledTimes(2));
  });
  it("cannot restore a session that signs out during an in-flight verification", async () => {
    let resolve!: (value: unknown) => void;
    access.getUser.mockReturnValue(new Promise((done) => { resolve = done; }));
    const screen = mount();
    act(() => window.dispatchEvent(new Event("focus")));
    await act(async () => access.listener?.("SIGNED_OUT", null));
    await act(async () => resolve({ data: { user: { id: "old" } }, error: null }));
    expect(screen.getByTestId("identity")).toHaveTextContent("anonymous");
    expect(access.rpc).not.toHaveBeenCalled();
  });
});
