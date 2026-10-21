import {
  renderHook,
  act,
  render,
  screen,
  fireEvent,
  cleanup,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import source from "../../../supabase/catalog/visual-v7-reviewed.json";
import { parseCatalogImport } from "../catalog/model/ingestion";
import { selectVariant } from "../catalog/model";
import {
  SuspensionControls,
  useSuspensionInspection,
} from "./SuspensionControls";
import type { Configuration } from "./model";
const catalog = parseCatalogImport(source),
  component = catalog.components.find((c) => c.category === "frame")!,
  variant = catalog.variants.find(
    (v) => v.component_id === component.id && v.selectable,
  )!;
const frame = selectVariant(
  {
    ...component,
    brands: catalog.brands.find((b) => b.id === component.brand_id)!,
    component_variants: [],
  },
  {
    ...variant,
    visual_assets: catalog.assets.find(
      (a) => a.id === variant.visual_asset_id,
    )!,
  },
);
const configuration: Configuration = {
  schemaVersion: 1,
  name: "Bike",
  items: [
    {
      slot: "frame",
      variantId: frame.id,
      finishId: frame.allowed_finishes.default_finish_id,
      customColor: null,
    },
  ],
};
const variants = { [frame.id]: frame };
beforeEach(() =>
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  ),
);
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe("temporary suspension inspection", () => {
  it("keeps percentage selection at rest when reduced motion disables playback", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    const { result } = renderHook(() =>
      useSuspensionInspection(configuration, variants),
    );
    act(() => result.current.toggle());
    act(() => result.current.play());
    expect(result.current.playing).toBe(false);
    act(() => result.current.change("rear", 0.4));
    expect(result.current.rear).toBe(0.4);
    expect(result.current.inspection?.state.rear).toBe(0);
  });
  it("opens stopped, pauses at the drawn position and resets on close", () => {
    const { result } = renderHook(() =>
      useSuspensionInspection(configuration, variants),
    );
    expect(result.current.inspection).toBeUndefined();
    act(() => result.current.toggle());
    expect(result.current.playing).toBe(false);
    act(() => result.current.change("rear", 0.7));
    expect(result.current.rear).toBe(0.7);
    expect(result.current.inspection?.state.rear).toBe(0);
    act(() => result.current.play());
    const state = result.current.inspection!.state;
    state.currentRear = 0.23;
    act(() => result.current.play());
    expect(result.current.rear).toBe(0.7);
    expect(result.current.inspection?.state.rear).toBe(0.23);
    act(() => result.current.change("rear", 0.4));
    expect(result.current.inspection?.state.rear).toBe(0);
    act(() => result.current.play());
    expect(result.current.inspection?.state.rear).toBe(0.4);
    expect(result.current.playing).toBe(true);
    act(() => result.current.toggle());
    expect(result.current.inspection).toBeUndefined();
    expect(result.current.rear).toBe(0);
  });
  it("resets the temporary posture when the selected pieces change", () => {
    const { result, rerender } = renderHook(
      ({ config }) => useSuspensionInspection(config, variants),
      { initialProps: { config: configuration } },
    );
    act(() => result.current.toggle());
    act(() => result.current.change("rear", 0.5));
    rerender({ config: { ...configuration, items: [] } });
    expect(result.current.rear).toBe(0);
    expect(result.current.playing).toBe(false);
    expect(result.current.definition).toBeNull();
  });
  it("offers manual controls without requiring a shock selection and identifies absent fork", () => {
    function Panel() {
      const controls = useSuspensionInspection(configuration, variants);
      return (
        <>
          <button onClick={controls.toggle}>Abrir</button>
          <SuspensionControls controls={controls} />
        </>
      );
    }
    render(<Panel />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir" }));
    expect(screen.getByLabelText("Compresión delantera")).toBeDisabled();
    expect(screen.getByLabelText("Compresión trasera")).toBeEnabled();
  });
});
