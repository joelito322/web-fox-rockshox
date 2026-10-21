import { choose, slotCategories, type Configuration, type Slot } from "./index";
import type { SelectedVariant } from "../../catalog/model";

export const assemblyGroups = [
  {
    id: "frame",
    label: "Cuadro",
    entries: [{ label: "Cuadro", slots: ["frame"] }],
  },
  {
    id: "suspension",
    label: "Suspensión",
    entries: [
      { label: "Horquilla", slots: ["fork"] },
      { label: "Amortiguador", slots: ["shock"] },
    ],
  },
  {
    id: "wheels",
    label: "Ruedas",
    entries: [
      { label: "Aros", slots: ["front_rim", "rear_rim"] },
      { label: "Neumáticos", slots: ["front_tire", "rear_tire"] },
      { label: "Bujes", slots: ["front_hub", "rear_hub"] },
    ],
  },
  {
    id: "brakes",
    label: "Frenos",
    entries: [
      { label: "Frenos", slots: ["front_brake", "rear_brake"] },
      { label: "Discos", slots: ["front_rotor", "rear_rotor"] },
    ],
  },
  {
    id: "drivetrain",
    label: "Transmisión",
    entries: [
      { label: "Cambio", slots: ["rear_derailleur"] },
      { label: "Cassette", slots: ["cassette"] },
      { label: "Cadena", slots: ["chain"] },
      { label: "Pedalier", slots: ["bottom_bracket"] },
      { label: "Bielas y plato", slots: ["crankset"] },
      { label: "Pedales", slots: ["pedals"] },
    ],
  },
  {
    id: "contact",
    label: "Contacto",
    entries: [
      { label: "Manillar", slots: ["handlebar"] },
      { label: "Potencia", slots: ["stem"] },
      { label: "Tija", slots: ["seatpost"] },
      { label: "Sillín", slots: ["saddle"] },
    ],
  },
] satisfies {
  id: string;
  label: string;
  entries: { label: string; slots: Slot[] }[];
}[];
export const groupFor = (slot: Slot) =>
  assemblyGroups.find((g) =>
    g.entries.some((e) => (e.slots as Slot[]).includes(slot)),
  )!;
export const entryFor = (slot: Slot) =>
  groupFor(slot).entries.find((e) => (e.slots as Slot[]).includes(slot))!;
export const pairedSlot = (slot: Slot): Slot | undefined => {
  if (!["rim", "tire", "brake", "rotor"].includes(slotCategories[slot]))
    return undefined;
  return (entryFor(slot).slots as Slot[]).find((s) => s !== slot);
};
export type WheelSetup = "all" | "29" | "27.5" | "mixed";
export const wheelSetups: { value: WheelSetup; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "29", label: '29"' },
  { value: "27.5", label: '27,5"' },
  { value: "mixed", label: "Mixto" },
];
export function wheelBSD(setup: WheelSetup, slot: Slot): number | undefined {
  if (setup === "all") return undefined;
  return setup === "29" || (setup === "mixed" && !slot.startsWith("rear_"))
    ? 622
    : 584;
}
export function wheelFilters(
  setup: WheelSetup,
  slot: Slot,
): Record<string, string> {
  if (setup === "all") return {};
  if (slot === "frame")
    return {
      wheel_front: setup === "27.5" ? "27.5" : "29",
      wheel_rear: setup === "29" ? "29" : "27.5",
    };
  return ["rim", "tire", "fork"].includes(slotCategories[slot])
    ? { wheel_bsd_mm: String(wheelBSD(setup, slot)) }
    : {};
}
export function counterpart(
  variant: SelectedVariant,
  targetBSD: number,
  options: SelectedVariant[],
): SelectedVariant | undefined {
  const keys =
    variant.component.category === "tire"
      ? ["tire_width_mm", "casing", "compound", "bead_type", "tubeless", "tpi"]
      : [
          "inner_width_mm",
          "outer_width_mm",
          "profile_height_mm",
          "spoke_hole_count",
          "material",
          "bead_type",
          "tubeless",
        ];
  const candidates = options.filter(
    (v) =>
      v.component.id === variant.component.id &&
      v.generation === variant.generation &&
      v.model_year === variant.model_year &&
      v.published &&
      v.selectable &&
      v.visual_assets?.published &&
      v.specs.wheel_bsd_mm === targetBSD &&
      keys.every(
        (k) => JSON.stringify(v.specs[k]) === JSON.stringify(variant.specs[k]),
      ),
  );
  return candidates.length === 1 ? candidates[0] : undefined;
}
/** Resolve every asset before committing this pure, atomic operation. */
export function chooseTogether(
  configuration: Configuration,
  choices: { slot: Slot; variant: SelectedVariant }[],
) {
  return choices.reduce(
    (next, choice) => choose(next, choice.slot, choice.variant),
    configuration,
  );
}
export const quickColors = [
  ["Negro", "#202420"],
  ["Blanco", "#F4F4EF"],
  ["Gris", "#87918D"],
  ["Rojo", "#CC332F"],
  ["Naranja", "#EC702C"],
  ["Amarillo", "#E5D348"],
  ["Verde", "#56634D"],
  ["Azul", "#2863A0"],
  ["Violeta", "#785699"],
] as const;
