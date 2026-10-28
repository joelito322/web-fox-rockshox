import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { parseCatalogImport } from "../catalog/model/ingestion";
import source from "../../../supabase/catalog/initial-reviewed.json";
import { choose, emptyConfiguration, type VariantMap } from "./model";
import { selectVariant } from "../catalog/model";
import { CompatibilityAlternatives } from "./CompatibilityAlternatives";
const mocked = vi.hoisted(() => ({ catalog: vi.fn(), offers: vi.fn() }));
vi.mock("../catalog/api", () => ({
  useCatalog: (...args: unknown[]) => mocked.catalog(...args),
}));
vi.mock("../commerce/api", () => ({
  useOffers: (...args: unknown[]) => mocked.offers(...args),
}));
const batch = parseCatalogImport(source);
function fixture() {
  const make = (category: string) => {
    const component = batch.components.find(
      (item) => item.category === category,
    )!;
    const variant = batch.variants.find(
      (item) => item.component_id === component.id,
    )!;
    return selectVariant(
      {
        ...component,
        brands: batch.brands.find((item) => item.id === component.brand_id)!,
        component_variants: [],
      },
      {
        ...structuredClone(variant),
        published: true,
        selectable: true,
        visual_assets: {
          ...batch.assets.find((item) => item.id === variant.visual_asset_id)!,
          published: true,
        },
      },
    );
  };
  const rim = make("rim"),
    tire = make("tire");
  rim.specs = { wheel_bsd_mm: 584 };
  tire.specs = { wheel_bsd_mm: 622 };
  const replacement = {
    ...structuredClone(rim),
    id: "90000000-0000-4000-8000-000000000001",
    label: "29 pulgadas",
    specs: { wheel_bsd_mm: 622 },
  };
  const variants: VariantMap = { [rim.id]: rim, [tire.id]: tire };
  const configuration = choose(
    choose(emptyConfiguration(), "front_rim", rim),
    "front_tire",
    tire,
  );
  const { component, ...variant } = replacement;
  return {
    rim,
    replacement,
    variants,
    configuration,
    component: { ...component, component_variants: [variant] },
  };
}
const state = fixture();
const warning = {
  code: "front_wheel_mismatch",
  message: "Diámetros distintos",
  level: "conflict" as const,
  slots: ["front_rim", "front_tire"] as const,
};
const props = () => ({
  configuration: state.configuration,
  variants: state.variants,
  warning: { ...warning, slots: [...warning.slots] },
  slot: "front_rim" as const,
  disabled: false,
  onApply: vi.fn(),
});
function price(id: string, amount: number, finish: string, unit = "unit") {
  return {
    offer_id: id,
    choices: [{ variant_id: id, finish_id: finish }],
    unit_cents: amount,
    currency: "PEN",
    unit,
    available: 2,
    item_condition: "new",
  };
}
beforeEach(() => {
  mocked.catalog.mockReturnValue({
    data: { components: [state.component], count: 1 },
    isPending: false,
    error: null,
    refetch: vi.fn(),
  });
  mocked.offers.mockReturnValue({
    data: [
      price(state.rim.id, 10000, state.rim.allowed_finishes.default_finish_id),
      price(
        state.replacement.id,
        13000,
        state.replacement.allowed_finishes.default_finish_id,
      ),
    ],
    isPending: false,
    error: null,
    refetch: vi.fn(),
  });
});
it("prices exact variants/finishes in one batch and applies one selected position", () => {
  const input = props();
  render(<CompatibilityAlternatives {...input} />);
  expect(screen.getByText(/\+S\/ 30.00/)).toBeInTheDocument();
  expect(mocked.offers).toHaveBeenLastCalledWith(
    [],
    [state.rim.id, state.replacement.id].sort(),
  );
  fireEvent.click(screen.getByRole("button", { name: "Usar esta pieza" }));
  expect(input.onApply).toHaveBeenCalledWith(
    "front_rim",
    expect.objectContaining({ id: state.replacement.id }),
    warning.code,
  );
});
it("does not invent a delta for another finish or another unit of sale", () => {
  for (const current of [
    price(state.rim.id, 10000, "another-finish"),
    price(
      state.rim.id,
      10000,
      state.rim.allowed_finishes.default_finish_id,
      "pair",
    ),
  ]) {
    mocked.offers.mockReturnValue({
      data: [
        current,
        price(
          state.replacement.id,
          13000,
          state.replacement.allowed_finishes.default_finish_id,
        ),
      ],
      isPending: false,
      error: null,
    });
    const view = render(<CompatibilityAlternatives {...props()} />);
    expect(
      screen.getByText("Diferencia de precio no disponible"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/\+S\//)).not.toBeInTheDocument();
    view.unmount();
  }
});
it("keeps technical replacement available after a price failure", () => {
  mocked.offers.mockReturnValue({
    data: undefined,
    isPending: false,
    error: new Error("offline"),
    refetch: vi.fn(),
  });
  render(<CompatibilityAlternatives {...props()} />);
  expect(screen.getByRole("button", { name: "Usar esta pieza" })).toBeEnabled();
  expect(
    screen.getByText(/No se pudieron consultar los precios/),
  ).toBeInTheDocument();
});
it("does not fetch a current-price-only batch while catalogue candidates are loading", () => {
  mocked.catalog.mockReturnValue({
    isPending: true,
    data: undefined,
    error: null,
  });
  render(<CompatibilityAlternatives {...props()} />);
  expect(mocked.offers).toHaveBeenLastCalledWith([], []);
  expect(
    screen.queryByRole("button", { name: "Usar esta pieza" }),
  ).not.toBeInTheDocument();
});

it("bounds each price batch to six visible options plus the current piece", () => {
  const component = {
    ...state.component,
    component_variants: Array.from({ length: 7 }, (_, index) => ({
      ...state.component.component_variants[0],
      id: `90000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      label: `Opción ${index + 1}`,
    })),
  };
  mocked.catalog.mockReturnValue({
    data: { components: [component], count: 1 },
    isPending: false,
    error: null,
  });
  render(<CompatibilityAlternatives {...props()} />);
  expect(
    screen.getAllByRole("button", { name: "Usar esta pieza" }),
  ).toHaveLength(6);
  expect(mocked.offers.mock.lastCall?.[1]).toHaveLength(7);
  fireEvent.click(screen.getByRole("button", { name: "Más opciones" }));
  expect(
    screen.getAllByRole("button", { name: "Usar esta pieza" }),
  ).toHaveLength(1);
  expect(mocked.offers.mock.lastCall?.[1]).toHaveLength(2);
});

it("advances model pages independently of the local option page", () => {
  mocked.catalog.mockReturnValue({
    data: { components: [state.component], count: 25 },
    isPending: false,
    error: null,
  });
  render(<CompatibilityAlternatives {...props()} />);
  fireEvent.click(screen.getByRole("button", { name: "Siguientes modelos" }));
  expect(mocked.catalog).toHaveBeenLastCalledWith("rim", "", 1);
  fireEvent.click(screen.getByRole("button", { name: "Modelos anteriores" }));
  expect(mocked.catalog).toHaveBeenLastCalledWith("rim", "", 0);
});
