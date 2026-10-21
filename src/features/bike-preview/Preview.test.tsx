import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const preview = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock("../auth/provider", () => ({
  useAuth: () => ({ user: null, permissions: [] }),
}));
vi.mock("./api", () => ({
  getPresetPreview: preview.load,
  getBuildPreview: vi.fn(),
  readPresetPreviewSource: vi.fn(),
}));
import { PresetPreview } from "./Preview";
const variantId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const configuration = {
  schemaVersion: 1 as const,
  name: "Prearmada",
  items: [
    {
      slot: "frame" as const,
      variantId,
      finishId: "black",
      customColor: null as string | null,
    },
  ],
};
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
it("refreshes the image when the same preset receives another saved visual configuration", async () => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(
        private callback: (entries: { isIntersecting: boolean }[]) => void,
      ) {}
      observe() {
        this.callback([{ isIntersecting: true }]);
      }
      disconnect() {}
    },
  );
  preview.load.mockReset().mockResolvedValue(null);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const view = (source: typeof configuration) => (
    <QueryClientProvider client={client}>
      <PresetPreview id="same-preset" name="Prearmada" source={source} />
    </QueryClientProvider>
  );
  const { rerender } = render(view(configuration));
  await waitFor(() => expect(preview.load).toHaveBeenCalledTimes(1));
  rerender(
    view({
      ...configuration,
      items: [{ ...configuration.items[0], customColor: "#f0f000" }],
    }),
  );
  await waitFor(() => expect(preview.load).toHaveBeenCalledTimes(2));
  expect(preview.load.mock.calls[1][1].items[0].customColor).toBe("#f0f000");
  // Renaming has no visual effect and must keep the same thumbnail.
  rerender(
    view({
      ...configuration,
      name: "Otro nombre",
      items: [{ ...configuration.items[0], customColor: "#f0f000" }],
    }),
  );
  await waitFor(() => expect(preview.load).toHaveBeenCalledTimes(2));
  client.clear();
});
