import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import catalogue from "../../../supabase/catalog/initial-reviewed.json";
import { componentSchema, selectVariant } from "./model";
import {
  readCachedVariants,
  useCatalogCards,
  useComponent,
  useHistoricalVariant,
  catalogCardProjection,
  useCatalog,
} from "./api";

const request = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
  ids: [] as string[],
  projection: "",
  calls: 0,
  batches: [] as string[][],
  filters: [] as [string, unknown][],
  data: [] as unknown,
}));
vi.mock("../../lib/supabase", () => ({
  requireSupabase: () => ({ from: request.from, rpc: request.rpc }),
}));

const component = componentSchema.parse({
  ...catalogue.components[0],
  brands: catalogue.brands.find(
    (brand) => brand.id === catalogue.components[0].brand_id,
  ),
  component_variants: catalogue.variants
    .filter((variant) => variant.component_id === catalogue.components[0].id)
    .map((variant) => ({
      ...variant,
      visual_assets: catalogue.assets.find(
        (asset) => asset.id === variant.visual_asset_id,
      ),
    })),
});
const variants = component.component_variants.map((variant) =>
  selectVariant(component, variant),
);
function client() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}
beforeEach(() => {
  request.from.mockClear();
  request.rpc.mockReset();
  request.ids = [];
  request.calls = 0;
  request.batches = [];
  request.filters = [];
  request.projection = "";
  request.data = [component];
  request.from.mockImplementation(() => {
    request.calls++;
    const query = {
      select: (projection: string) => {
        request.projection = projection;
        return query;
      },
      in: (_column: string, ids: string[]) => {
        request.ids = ids;
        request.batches.push(ids);
        return query;
      },
      eq: (column: string, value: unknown) => {
        request.filters.push([column, value]);
        return query;
      },
      order: () => query,
      range: () => query,
      single: () => {
        request.data = component;
        return query;
      },
      abortSignal: () => query,
      then: (resolve: (value: unknown) => void) =>
        Promise.resolve({ data: request.data, error: null, count: 1 }).then(
          resolve,
        ),
    };
    return query;
  });
});
describe("catalogue request reuse", () => {
  it("filters variants before pagination and shares price discovery across pages and card/full projections", async () => {
    request.rpc.mockReturnValue({ abortSignal: () => Promise.resolve({ data: [{ variant_id: variants[0].id, unit_cents: 8000 }], error: null }) });
    const cache = client();
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={cache}>{children}</QueryClientProvider>;
    const filters = { price: { max: 8000 } };
    const cards = renderHook(({ page }) => useCatalogCards("frame", "", page, filters), { initialProps: { page: 0 }, wrapper });
    await waitFor(() => expect(cards.result.current.isSuccess).toBe(true));
    expect(request.ids).toEqual([variants[0].id]);
    cards.rerender({ page: 1 });
    await waitFor(() => expect(request.calls).toBe(2));
    const full = renderHook(() => useCatalog("frame", "", 0, filters), { wrapper });
    await waitFor(() => expect(full.result.current.isSuccess).toBe(true));
    expect(request.rpc).toHaveBeenCalledTimes(1);
    expect(full.result.current.data?.prices).toEqual({ [variants[0].id]: 8000 });
  });
  it("returns a true empty result without querying a catalog page when no prices qualify", async () => {
    request.rpc.mockReturnValue({ abortSignal: () => Promise.resolve({ data: [], error: null }) });
    const cache = client();
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={cache}>{children}</QueryClientProvider>;
    const result = renderHook(() => useCatalogCards("frame", "", 0, { price: { max: 1 } }), { wrapper });
    await waitFor(() => expect(result.result.current.isSuccess).toBe(true));
    expect(result.result.current.data).toEqual({ components: [], count: 0 });
    expect(request.from).not.toHaveBeenCalled();
  });
  it("reads only missing variants and deduplicates repeated positions", async () => {
    const cache = client();
    cache.setQueryData(["catalog", "variant", variants[0].id], variants[0]);
    const values = await readCachedVariants(cache, [
      variants[0].id,
      variants[1].id,
      variants[1].id,
    ]);
    expect(request.ids).toEqual([variants[1].id]);
    expect(values.map((value) => value.id)).toEqual([
      variants[0].id,
      variants[1].id,
    ]);
    await readCachedVariants(cache, [variants[1].id, variants[0].id]);
    expect(request.calls).toBe(1);
  });
  it("coalesces simultaneous requests for the same missing set", async () => {
    const cache = client(),
      ids = variants.map((variant) => variant.id);
    const [first, second] = await Promise.all([
      readCachedVariants(cache, ids),
      readCachedVariants(cache, [...ids].reverse()),
    ]);
    expect(request.calls).toBe(1);
    expect(new Set(first.map((value) => value.id))).toEqual(
      new Set(second.map((value) => value.id)),
    );
  });
  it("keeps a shared request alive when only one consumer is cancelled", async () => {
    const cache = client(),
      controller = new AbortController(),
      ids = variants.map((variant) => variant.id);
    const cancelled = readCachedVariants(cache, ids, controller.signal);
    const active = readCachedVariants(cache, ids);
    controller.abort();
    await expect(cancelled).rejects.toMatchObject({ name: "AbortError" });
    await expect(active).resolves.toHaveLength(variants.length);
    expect(request.calls).toBe(1);
  });
  it("reuses an overlapping in-flight batch and fetches only uncovered IDs", async () => {
    const cache = client();
    const first = readCachedVariants(cache, [variants[0].id]);
    const second = readCachedVariants(cache, [variants[0].id, variants[1].id]);
    const [one, two] = await Promise.all([first, second]);
    expect(request.batches).toEqual([[variants[0].id], [variants[1].id]]);
    expect(one.map((variant) => variant.id)).toEqual([variants[0].id]);
    expect(two.map((variant) => variant.id)).toEqual([variants[0].id, variants[1].id]);
  });
  it("does not restore variants after an account clears an overlapping request", async () => {
    const cache = client();
    const pending = readCachedVariants(cache, [variants[0].id]);
    const overlapping = readCachedVariants(cache, [variants[0].id, variants[1].id]);
    cache.clear();
    await expect(pending).rejects.toBeDefined();
    await expect(overlapping).rejects.toBeDefined();
    expect(cache.getQueryCache().getAll()).toHaveLength(0);
  });
  it("keeps overlapping consumers alive when one caller leaves", async () => {
    const cache = client();
    const controller = new AbortController();
    const departing = readCachedVariants(cache, [variants[0].id], controller.signal);
    const active = readCachedVariants(cache, [variants[0].id, variants[1].id]);
    controller.abort();
    await expect(departing).rejects.toMatchObject({ name: "AbortError" });
    await expect(active).resolves.toHaveLength(2);
    expect(request.batches).toEqual([[variants[0].id], [variants[1].id]]);
  });
  it("does not reuse variants after catalogue invalidation or account cache clearing", async () => {
    const cache = client(),
      id = variants[0].id;
    await readCachedVariants(cache, [id]);
    await cache.invalidateQueries({ queryKey: ["catalog"] });
    await readCachedVariants(cache, [id]);
    cache.clear();
    await readCachedVariants(cache, [id]);
    expect(request.calls).toBe(3);
  });
  it("reuses a full component detail when that piece is opened in the 3D editor", async () => {
    const cache = client();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={cache}>{children}</QueryClientProvider>
    );
    const result = renderHook(() => useComponent(component.slug), { wrapper });
    await waitFor(() => expect(result.result.current.isSuccess).toBe(true));
    expect(request.filters).toContainEqual(["component_variants.selectable", true]);
    expect(request.filters).toContainEqual(["component_variants.published", true]);
    expect(request.projection).not.toContain("component_variants!inner");
    expect(await readCachedVariants(cache, [variants[0].id])).toEqual([
      variants[0],
    ]);
    expect(request.calls).toBe(1);
    result.unmount();
    cache.clear();
  });
  it("resolves an explicit historical version even without current choices", async () => {
    const cache = client();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={cache}>{children}</QueryClientProvider>
    );
    const result = renderHook(() => useHistoricalVariant(
      { ...component, component_variants: [] }, variants[0].id,
    ), { wrapper });
    await waitFor(() => expect(result.result.current.isSuccess).toBe(true));
    expect(request.ids).toEqual([variants[0].id]);
    expect(result.result.current.data?.id).toBe(variants[0].id);
    result.unmount();
    cache.clear();
  });
  it("does not expose a cached historical choice from another component", async () => {
    const cache = client();
    cache.setQueryData(["catalog", "variant", variants[0].id], variants[0]);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={cache}>{children}</QueryClientProvider>
    );
    const result = renderHook(() => useHistoricalVariant(
      { ...component, id: "00000000-0000-4000-8000-000000000099", component_variants: [] },
      variants[0].id,
    ), { wrapper });
    await waitFor(() => expect(result.result.current.isSuccess).toBe(true));
    expect(result.result.current.data).toBeNull();
    expect(request.calls).toBe(0);
    result.unmount();
    cache.clear();
  });
  it("loads card summaries without geometry manifests, sources or finishes", async () => {
    const cache = client();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={cache}>{children}</QueryClientProvider>
    );
    const result = renderHook(() => useCatalogCards("frame"), { wrapper });
    await waitFor(() => expect(result.result.current.isSuccess).toBe(true));
    expect(request.projection).toBe(catalogCardProjection);
    expect(request.projection).not.toMatch(
      /manifest|sources|allowed_finishes|visual_assets/,
    );
    expect(
      result.result.current.data?.components[0].component_variants[0],
    ).not.toHaveProperty("visual_assets");
    result.unmount();
    cache.clear();
  });
});
