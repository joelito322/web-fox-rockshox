import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import source from "../../../../supabase/catalog/visual-v5-reviewed.json";
import { parseCatalogImport } from "../../catalog/model/ingestion";
import type { Configuration, VariantMap } from "../model";

const calls = vi.hoisted(() => ({ resolve: vi.fn(), canvas: vi.fn(), clone: vi.fn() }));
vi.mock("../model/assemblyV2", async (original) => {
  const actual = await original<typeof import("../model/assemblyV2")>();
  return { ...actual, resolveAssembly: (...args: Parameters<typeof actual.resolveAssembly>) => {
    calls.resolve();
    return actual.resolveAssembly(...args);
  }};
});
vi.mock("./imported-instance", async (original) => {
  const actual = await original<typeof import("./imported-instance")>();
  return { instantiateVisual: (...args: Parameters<typeof actual.instantiateVisual>) => {
    calls.clone();
    return actual.instantiateVisual(...args);
  }};
});
vi.mock("./loadGlb", async () => {
  const T = await import("three");
  return { loadGlb: async () => new T.Group(), disposeVisual: vi.fn() };
});
vi.mock("../../../lib/supabase", () => ({ supabase: { storage: { from: () => ({ getPublicUrl: () => ({ data: { publicUrl: "https://assets.test/frame.glb" } }) }) } } }));
vi.mock("@react-three/fiber", async () => {
  const T = await import("three");
  const state = { gl: { shadowMap: { autoUpdate: true, needsUpdate: false } }, invalidate: () => {}, size: { width: 1000, height: 600 }, setDpr: () => {}, camera: new T.PerspectiveCamera() };
  return { Canvas: ({ children }: { children: import("react").ReactNode }) => { calls.canvas(); return <>{children}</>; }, useThree: (selector?: (value: typeof state) => unknown) => selector ? selector(state) : state };
});
vi.mock("./Selection", () => ({ default: ({ children }: { children: import("react").ReactNode }) => <>{children}</> }));
vi.mock("@react-three/drei", () => ({ OrbitControls: () => null }));
import BikeScene, { prepareVisual } from "./BikeScene";
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it("isolates unrelated panel updates and reuses assembly and GLB instances on selection/name changes", async () => {
  // React DOM is used only to count component work; no WebGL acceptance is inferred.
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  const catalog = parseCatalogImport(source);
  const variant = catalog.variants.find(v => catalog.components.find(c => c.id === v.component_id)?.category === "frame")!;
  const component = catalog.components.find(c => c.id === variant.component_id)!;
  const asset = catalog.assets.find(a => a.id === variant.visual_asset_id)!;
  await prepareVisual(asset);
  const configuration: Configuration = { schemaVersion: 1, name: "Bike", items: [{ slot: "frame", variantId: variant.id, finishId: variant.allowed_finishes.options[0].id, customColor: null }] };
  const variants: VariantMap = { [variant.id]: { ...variant, visual_assets: asset, component: { ...component, brands: catalog.brands.find(b => b.id === component.brand_id)! } } };
  const onSelect = vi.fn(), onUnavailable = vi.fn();
  const props = { configuration, variants, onSelect, onUnavailable, view: "lateral", selectedSlot: "frame" as const };
  const mounted = render(<BikeScene {...props} />);
  const initial = { canvas: calls.canvas.mock.calls.length, assembly: calls.resolve.mock.calls.length, clones: calls.clone.mock.calls.length };
  expect(initial.assembly).toBe(1);
  expect(initial.clones).toBe(1);
  // Same references are what the editor supplies when search/loading/save state changes.
  for (let i = 0; i < 10; i++) mounted.rerender(<BikeScene {...props} />);
  expect(calls.canvas).toHaveBeenCalledTimes(initial.canvas);
  expect(calls.resolve).toHaveBeenCalledTimes(initial.assembly);
  mounted.rerender(<BikeScene {...props} selectedSlot="fork" />);
  mounted.rerender(<BikeScene {...props} configuration={{ ...configuration, name: "Renamed" }} />);
  expect(calls.resolve).toHaveBeenCalledTimes(initial.assembly);
  expect(calls.clone).toHaveBeenCalledTimes(initial.clones);
  mounted.rerender(<BikeScene {...props} configuration={{ ...configuration, items: configuration.items.map(item => ({ ...item, customColor: "#123456" })) }} />);
  expect(calls.clone).toHaveBeenCalledTimes(initial.clones);
  expect(calls.resolve.mock.calls.length).toBeGreaterThan(initial.assembly);
});
