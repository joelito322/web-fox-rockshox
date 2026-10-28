import { describe, expect, it } from "vitest";
import { parseCatalogImport } from "../../catalog/model/ingestion";
import type { SelectedVariant } from "../../catalog/model";
import initial from "../../../../supabase/catalog/initial-reviewed.json";
import nomad from "../../../../supabase/catalog/frames-v22-reviewed.json";
import {
  choose,
  emptyConfiguration,
  warnings,
  slotCategories,
  type Slot,
  type VariantMap,
} from "./index";
import { evaluateAlternative } from "./alternatives";
const batch = parseCatalogImport(initial);
let sequence = 0;
function variant(slot: Slot, specs: Record<string, unknown>): SelectedVariant {
  const component = batch.components.find(
    (item) => item.category === slotCategories[slot],
  )!;
  const source = batch.variants.find(
    (item) => item.component_id === component.id,
  )!;
  const asset = batch.assets.find(
    (item) => item.id === source.visual_asset_id,
  )!;
  return {
    ...structuredClone(source),
    id: `00000000-0000-4000-8000-${String(++sequence).padStart(12, "0")}`,
    specs,
    published: true,
    selectable: true,
    component: {
      ...component,
      published: true,
      brands: batch.brands.find((brand) => brand.id === component.brand_id)!,
    },
    visual_assets: { ...asset, published: true },
  };
}
function setup(entries: [Slot, SelectedVariant][]) {
  const map: VariantMap = {};
  let configuration = emptyConfiguration();
  for (const [slot, value] of entries) {
    map[value.id] = value;
    configuration = choose(configuration, slot, value);
  }
  return { configuration, map };
}
const cases: [
  string,
  Slot,
  Record<string, unknown>,
  Slot,
  Record<string, unknown>,
  Record<string, unknown>,
][] = [
  [
    "front_wheel_mismatch",
    "front_rim",
    { wheel_bsd_mm: 622 },
    "front_tire",
    { wheel_bsd_mm: 584 },
    { wheel_bsd_mm: 622 },
  ],
  [
    "rear_wheel_mismatch",
    "rear_rim",
    { wheel_bsd_mm: 584 },
    "rear_tire",
    { wheel_bsd_mm: 622 },
    { wheel_bsd_mm: 584 },
  ],
  [
    "front_frame_wheel",
    "frame",
    { wheel_front: "29" },
    "front_rim",
    { wheel_bsd_mm: 584 },
    { wheel_bsd_mm: 622 },
  ],
  [
    "rear_frame_wheel",
    "frame",
    { wheel_rear: "27.5" },
    "rear_rim",
    { wheel_bsd_mm: 622 },
    { wheel_bsd_mm: 584 },
  ],
  [
    "fork_wheel",
    "fork",
    { wheel_bsd_mm: 622 },
    "front_rim",
    { wheel_bsd_mm: 584 },
    { wheel_bsd_mm: 622 },
  ],
  [
    "front_rotor_mount",
    "front_hub",
    { rotor_mount: "6-bolt" },
    "front_rotor",
    { rotor_mount: "Center Lock" },
    { rotor_mount: "6 bolt" },
  ],
  [
    "rear_rotor_mount",
    "rear_hub",
    { rotor_mount: "Center Lock" },
    "rear_rotor",
    { rotor_mount: "6-bolt" },
    { rotor_mount: "Center Lock" },
  ],
  [
    "front_rotor_thickness",
    "front_brake",
    { rotor_thickness_mm: 2 },
    "front_rotor",
    { rotor_thickness_mm: 1.8 },
    { rotor_thickness_mm: 2 },
  ],
  [
    "rear_rotor_thickness",
    "rear_brake",
    { rotor_thickness_mm: 2 },
    "rear_rotor",
    { rotor_thickness_mm: 1.8 },
    { rotor_thickness_mm: 2 },
  ],
  [
    "front_axle",
    "fork",
    { axle_standard: "20x110 Boost" },
    "front_hub",
    { axle_standard: "15x110 Boost" },
    { axle_standard: "20x110 Boost" },
  ],
  [
    "rear_axle",
    "frame",
    { rear_axle_standard: "12x148 Boost" },
    "rear_hub",
    { axle_standard: "12x157" },
    { axle_standard: "12x148 Boost" },
  ],
  [
    "front_el freno_rotor_range",
    "front_brake",
    { rotor_min_mm: 180, rotor_max_mm: 203 },
    "front_rotor",
    { rotor_diameter_mm: 220 },
    { rotor_diameter_mm: 203 },
  ],
  [
    "rear_el freno_rotor_range",
    "rear_brake",
    { rotor_max_mm: 203 },
    "rear_rotor",
    { rotor_diameter_mm: 220 },
    { rotor_diameter_mm: 203 },
  ],
  [
    "front_la horquilla_rotor_range",
    "fork",
    { rotor_min_mm: 180, rotor_max_mm: 220 },
    "front_rotor",
    { rotor_diameter_mm: 160 },
    { rotor_diameter_mm: 203 },
  ],
  [
    "shock_length",
    "frame",
    { shock_fit: { eye_to_eye_mm: 230 } },
    "shock",
    { eye_to_eye_mm: 250 },
    { eye_to_eye_mm: 230 },
  ],
  [
    "shock_stroke",
    "frame",
    { shock_fit: { eye_to_eye_mm: 230, stroke_mm: 65 } },
    "shock",
    { eye_to_eye_mm: 230, stroke_mm: 60 },
    { eye_to_eye_mm: 230, stroke_mm: 65 },
  ],
  [
    "bb_shell",
    "frame",
    { bb_shell: { standard: "BSA" } },
    "bottom_bracket",
    { shell_standard: "PF92" },
    { shell_standard: "BSA" },
  ],
  [
    "bb_width",
    "frame",
    { bb_shell: { width_mm: 73 } },
    "bottom_bracket",
    { shell_width_mm: 83 },
    { shell_width_mm: 73 },
  ],
  [
    "crank_spindle",
    "bottom_bracket",
    { spindle_standard: "DUB" },
    "crankset",
    { spindle_standard: "Hollowtech II" },
    { spindle_standard: "DUB" },
  ],
  [
    "crank_diameter",
    "bottom_bracket",
    { spindle_diameter_mm: 24 },
    "crankset",
    { spindle_diameter_mm: 30 },
    { spindle_diameter_mm: 24 },
  ],
  [
    "freehub",
    "rear_hub",
    { freehub_standard: "Micro Spline" },
    "cassette",
    { freehub_standard: "XD" },
    { freehub_standard: "Micro Spline" },
  ],
  [
    "drivetrain_speeds",
    "cassette",
    { speed_count: 12 },
    "rear_derailleur",
    { speed_count: 10 },
    { speed_count: 12 },
  ],
  [
    "bar_clamp",
    "stem",
    { bar_clamp_diameter_mm: 35 },
    "handlebar",
    { clamp_diameter_mm: 31.8 },
    { clamp_diameter_mm: 35 },
  ],
  [
    "seatpost_diameter",
    "frame",
    { seatpost_diameter_mm: 31.6 },
    "seatpost",
    { diameter_mm: 30.9 },
    { diameter_mm: 31.6 },
  ],
  [
    "stem_mount",
    "fork",
    { crown_type: "single" },
    "stem",
    { mount_type: "direct_mount" },
    { mount_type: "steerer_clamp" },
  ],
];
describe("documented replacement recommendations", () => {
  it.each(cases)(
    "resolves %s using explicit data and rejects a missing-data escape",
    (code, left, leftSpecs, right, bad, good) => {
      const a = variant(left, leftSpecs),
        b = variant(right, bad),
        replacement = variant(right, good);
      const { configuration, map } = setup([
        [left, a],
        [right, b],
      ]);
      expect(
        warnings(configuration, map).some(
          (warning) => warning.code === code && warning.level === "conflict",
        ),
      ).toBe(true);
      expect(
        evaluateAlternative(configuration, map, code, right, replacement)
          ?.resolved,
      ).toContain(code);
      expect(
        evaluateAlternative(
          configuration,
          map,
          code,
          right,
          variant(right, {}),
        ),
      ).toBeNull();
    },
  );
  it.each(["front", "rear"] as const)("checks %s hub position", (position) => {
    const slot = `${position}_hub` as Slot,
      wrong = variant(slot, {
        position: position === "front" ? "rear" : "front",
      });
    const { configuration, map } = setup([[slot, wrong]]);
    expect(
      evaluateAlternative(
        configuration,
        map,
        `${position}_hub_position`,
        slot,
        variant(slot, { position }),
      ),
    ).not.toBeNull();
  });
  it.each(["upper", "lower"] as const)(
    "checks all %s shock mounting dimensions",
    (end) => {
      for (const key of ["type", "width_mm", "bolt_diameter_mm"]) {
        const expected = { type: "eyelet", width_mm: 30, bolt_diameter_mm: 8 };
        const frame = variant("frame", {
          shock_fit: { eye_to_eye_mm: 230, [`${end}_mount`]: expected },
        });
        const wrong = { ...expected, [key]: key === "type" ? "trunnion" : 99 };
        const shock = variant("shock", {
          eye_to_eye_mm: 230,
          mount_standard: { [end]: wrong },
        });
        const candidate = variant("shock", {
          eye_to_eye_mm: 230,
          mount_standard: { [end]: expected },
        });
        const { configuration, map } = setup([
          ["frame", frame],
          ["shock", shock],
        ]);
        expect(
          evaluateAlternative(
            configuration,
            map,
            `shock_${end}_${key}`,
            "shock",
            candidate,
          ),
        ).not.toBeNull();
        delete (
          candidate.specs.mount_standard as Record<
            string,
            Record<string, unknown>
          >
        )[end][key];
        expect(
          evaluateAlternative(
            configuration,
            map,
            `shock_${end}_${key}`,
            "shock",
            candidate,
          ),
        ).toBeNull();
      }
    },
  );
  it("does not solve a wheel mismatch by keeping a frame mismatch or introducing another conflict", () => {
    const frame = variant("frame", { wheel_front: "29" }),
      rim = variant("front_rim", { wheel_bsd_mm: 584 }),
      tire = variant("front_tire", { wheel_bsd_mm: 622 });
    const { configuration, map } = setup([
      ["frame", frame],
      ["front_rim", rim],
      ["front_tire", tire],
    ]);
    expect(
      evaluateAlternative(
        configuration,
        map,
        "front_wheel_mismatch",
        "front_tire",
        variant("front_tire", { wheel_bsd_mm: 584 }),
      ),
    ).toBeNull();
    expect(
      evaluateAlternative(
        configuration,
        map,
        "front_wheel_mismatch",
        "front_rim",
        variant("front_rim", { wheel_bsd_mm: 622 }),
      ),
    ).not.toBeNull();
  });
  it("keeps the other side unchanged and rejects retired/unpublished/wrong-category variants", () => {
    const rim = variant("front_rim", { wheel_bsd_mm: 584 }),
      tire = variant("front_tire", { wheel_bsd_mm: 622 }),
      rear = variant("rear_rim", { wheel_bsd_mm: 584 });
    const { configuration, map } = setup([
      ["front_rim", rim],
      ["front_tire", tire],
      ["rear_rim", rear],
    ]);
    const good = variant("front_rim", { wheel_bsd_mm: 622 });
    expect(
      evaluateAlternative(
        configuration,
        map,
        "front_wheel_mismatch",
        "front_rim",
        good,
      ),
    ).not.toBeNull();
    expect(
      choose(configuration, "front_rim", good).items.find(
        (item) => item.slot === "rear_rim",
      )?.variantId,
    ).toBe(rear.id);
    for (const candidate of [
      { ...good, selectable: false },
      { ...good, published: false },
      { ...good, component: { ...good.component, published: false } },
      { ...good, visual_assets: { ...good.visual_assets!, published: false } },
      tire,
    ])
      expect(
        evaluateAlternative(
          configuration,
          map,
          "front_wheel_mismatch",
          "front_rim",
          candidate,
        ),
      ).toBeNull();
  });
  it("does not equate undocumented 20x110 to Boost or recommend for an already-resolved code", () => {
    const fork = variant("fork", { axle_standard: "20x110 Boost" }),
      hub = variant("front_hub", { axle_standard: "15x110" });
    const { configuration, map } = setup([
      ["fork", fork],
      ["front_hub", hub],
    ]);
    expect(
      evaluateAlternative(
        configuration,
        map,
        "front_axle",
        "front_hub",
        variant("front_hub", { axle_standard: "20x110" }),
      ),
    ).toBeNull();
    expect(
      evaluateAlternative(
        configuration,
        map,
        "rear_axle",
        "front_hub",
        variant("front_hub", { axle_standard: "20x110 Boost" }),
      ),
    ).toBeNull();
  });
  it("uses the exact reviewed Nomad generation and rejects an unreviewed frame as a disappearance of travel conflict", () => {
    const reviewed = parseCatalogImport(nomad),
      source = reviewed.variants[0],
      component = reviewed.components.find(
        (item) => item.id === source.component_id,
      )!;
    const frame: SelectedVariant = {
      ...source,
      published: true,
      selectable: true,
      component: {
        ...component,
        brands: reviewed.brands.find((item) => item.id === component.brand_id)!,
      },
      visual_assets: {
        ...reviewed.assets.find((item) => item.id === source.visual_asset_id)!,
        published: true,
      },
    };
    const fork = variant("fork", { travel_mm: 203 });
    const { configuration, map } = setup([
      ["frame", frame],
      ["fork", fork],
    ]);
    expect(
      evaluateAlternative(
        configuration,
        map,
        "fork_frame_travel_mm",
        "fork",
        variant("fork", { travel_mm: 180 }),
      ),
    ).not.toBeNull();
    expect(
      evaluateAlternative(
        configuration,
        map,
        "fork_frame_travel_mm",
        "fork",
        variant("fork", { travel_mm: 169 }),
      ),
    ).toBeNull();
    const other = {
      ...frame,
      id: variant("frame", {}).id,
      generation: "unknown",
    };
    expect(
      evaluateAlternative(
        configuration,
        map,
        "fork_frame_travel_mm",
        "frame",
        other,
      ),
    ).toBeNull();
  });
});
