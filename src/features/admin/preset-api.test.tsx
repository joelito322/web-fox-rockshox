import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePresetBrands, usePresetOptions } from "./preset-api";
const request = vi.hoisted(() => ({ rpc: vi.fn(), identity: "first-account" }));
vi.mock("../auth/provider", () => ({ useAuth: () => ({ user: { id: request.identity } }) }));
vi.mock("../../lib/supabase", () => ({ requireSupabase: () => ({ rpc: request.rpc }) }));
beforeEach(() => {
  request.identity = "first-account";
  request.rpc.mockReset();
  request.rpc.mockImplementation(() => ({ abortSignal: () => Promise.resolve({
    data: { count: 0, brands: [], components: [] }, error: null,
  }) }));
});
function provider() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
describe("administration reference options", () => {
  it("loads only brands for the reference gallery and reuses a fresh visit", async () => {
    const wrapper = provider();
    const first = renderHook(() => usePresetBrands(), { wrapper });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    expect(request.rpc).toHaveBeenCalledWith("preset_options", expect.objectContaining({ p_ids: [] }));
    first.unmount();
    const second = renderHook(() => usePresetBrands(), { wrapper });
    expect(second.result.current.isSuccess).toBe(true);
    expect(request.rpc).toHaveBeenCalledTimes(1);
  });
  it("canonicalizes selected IDs and never shares private options between accounts", async () => {
    const a = "00000000-0000-4000-8000-000000000001";
    const b = "00000000-0000-4000-8000-000000000002";
    const { result, rerender } = renderHook(({ ids }) => usePresetOptions(undefined, "", 0, ids), {
      wrapper: provider(), initialProps: { ids: [b, a, b] },
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(request.rpc).toHaveBeenCalledWith("preset_options", expect.objectContaining({ p_ids: [a, b] }));
    rerender({ ids: [a, b] });
    expect(request.rpc).toHaveBeenCalledTimes(1);
    request.identity = "second-account";
    rerender({ ids: [a, b] });
    await waitFor(() => expect(request.rpc).toHaveBeenCalledTimes(2));
  });
  it("does not request selected details when a reference has no parts", () => {
    renderHook(() => usePresetOptions(undefined, "", 0, []), { wrapper: provider() });
    expect(request.rpc).not.toHaveBeenCalled();
  });
});
