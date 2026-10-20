import { z } from "zod";
import type { Category, SelectedVariant } from "../../catalog/model";

export const slotCategories = {
  frame: "frame",
  fork: "fork",
  shock: "shock",
  front_rim: "rim",
  rear_rim: "rim",
  front_tire: "tire",
  rear_tire: "tire",
  front_hub: "hub",
  rear_hub: "hub",
  front_brake: "brake",
  rear_brake: "brake",
  front_rotor: "rotor",
  rear_rotor: "rotor",
  cassette: "cassette",
  chain: "chain",
  rear_derailleur: "rear_derailleur",
  bottom_bracket: "bottom_bracket",
  crankset: "crankset",
  pedals: "pedals",
  handlebar: "handlebar",
  stem: "stem",
  seatpost: "seatpost",
  saddle: "saddle",
} as const satisfies Record<string, Category>;
export type Slot = keyof typeof slotCategories;
export const slots = Object.keys(slotCategories) as Slot[];
export const slotLabels: Record<Slot, string> = {
  frame: "Cuadro",
  fork: "Horquilla",
  shock: "Amortiguador",
  front_rim: "Aro delantero",
  rear_rim: "Aro trasero",
  front_tire: "Neumático delantero",
  rear_tire: "Neumático trasero",
  front_hub: "Buje delantero",
  rear_hub: "Buje trasero",
  front_brake: "Freno delantero",
  rear_brake: "Freno trasero",
  front_rotor: "Disco delantero",
  rear_rotor: "Disco trasero",
  cassette: "Cassette",
  chain: "Cadena",
  rear_derailleur: "Cambio trasero",
  bottom_bracket: "Pedalier",
  crankset: "Bielas y plato",
  pedals: "Pedales",
  handlebar: "Manillar",
  stem: "Potencia",
  seatpost: "Tija",
  saddle: "Sillín",
};
export const itemSchema = z
  .object({
    slot: z.enum(slots as [Slot, ...Slot[]]),
    variantId: z.uuid(),
    finishId: z.string().min(1),
    customColor: z
      .string()
      .regex(/^#[0-9a-f]{6}$/i)
      .nullable(),
  })
  .strict();
export const configurationSchema = z
  .object({
    schemaVersion: z.literal(1),
    name: z.string().trim().min(1).max(80),
    items: z.array(itemSchema).max(slots.length),
  })
  .strict()
  .refine(
    (c) => new Set(c.items.map((i) => i.slot)).size === c.items.length,
    "Solo se admite una pieza por posición",
  );
export const draftConfigurationSchema = configurationSchema.safeExtend({
  name: z.string().max(80),
});
export type BuildItem = z.infer<typeof itemSchema>;
export type Configuration = z.infer<typeof configurationSchema>;
export type VariantMap = Record<string, SelectedVariant>;
export const emptyConfiguration = (): Configuration => ({
  schemaVersion: 1,
  name: "Mi montaje",
  items: [],
});
export function canonical(configuration: Configuration): string {
  const parsed = {
    ...configuration,
    name: configuration.name.trim(),
    items: configuration.items.map((item) => itemSchema.parse(item)),
  };
  return JSON.stringify({
    ...parsed,
    items: parsed.items
      .map((i) => ({
        slot: i.slot,
        variantId: i.variantId,
        finishId: i.finishId,
        customColor: i.customColor?.toUpperCase() ?? null,
      }))
      .sort((a, b) => a.slot.localeCompare(b.slot)),
  });
}
export function choose(
  configuration: Configuration,
  slot: Slot,
  variant: SelectedVariant,
): Configuration {
  if (slotCategories[slot] !== variant.component.category)
    throw new Error("invalid_category");
  if (
    !variant.selectable ||
    !variant.published ||
    !variant.visual_assets?.published
  )
    throw new Error("variant_unavailable");
  return {
    ...configuration,
    items: [
      ...configuration.items.filter((i) => i.slot !== slot),
      {
        slot,
        variantId: variant.id,
        finishId: variant.allowed_finishes.default_finish_id,
        customColor: null,
      },
    ],
  };
}
export function paint(
  configuration: Configuration,
  slot: Slot,
  color: string,
  variant: SelectedVariant,
): Configuration {
  if (
    !variant.allowed_finishes.custom_color_enabled ||
    !/^#[0-9a-f]{6}$/i.test(color)
  )
    throw new Error("invalid_color");
  return {
    ...configuration,
    items: configuration.items.map((i) =>
      i.slot === slot ? { ...i, customColor: color.toUpperCase() } : i,
    ),
  };
}
export function remove(
  configuration: Configuration,
  slot: Slot,
): Configuration {
  if (slot === "frame") throw new Error("frame_required");
  return {
    ...configuration,
    items: configuration.items.filter((i) => i.slot !== slot),
  };
}
export type MountWarning = {
  code: string;
  message: string;
  level: "conflict" | "unknown";
};
export function warnings(
  configuration: Configuration,
  variants: VariantMap,
): MountWarning[] {
  const get = (slot: Slot) => {
    const item = configuration.items.find((i) => i.slot === slot);
    return item ? variants[item.variantId] : undefined;
  };
  const result: MountWarning[] = [];
  const add = (
    code: string,
    message: string,
    level: MountWarning["level"] = "conflict",
  ) => result.push({ code, message, level });
  const object = (value: unknown): Record<string, unknown> =>
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const compare = (code: string, a: unknown, b: unknown, message: string) => {
    if (a != null && b != null && a !== b) add(code, message);
  };
  const bsd = (value: unknown) =>
    value === "29" || value === "29-inch"
      ? 622
      : value === "27.5" || value === "27.5-inch"
        ? 584
        : value === "26"
          ? 559
          : null;
  const standard = (value: unknown) =>
    typeof value === "string"
      ? value.toLowerCase().replace(/[^a-z0-9]/g, "")
      : null;
  const frame = get("frame"),
    fork = get("fork"),
    shock = get("shock"),
    bb = get("bottom_bracket"),
    cranks = get("crankset");
  if (configuration.items.length && !frame)
    add("frame_missing", "Falta seleccionar el cuadro.", "unknown");
  for (const position of ["front", "rear"] as const) {
    const label = position === "front" ? "delantero" : "trasero";
    const tire = get(`${position}_tire`),
      rim = get(`${position}_rim`),
      hub = get(`${position}_hub`),
      rotor = get(`${position}_rotor`),
      brake = get(`${position}_brake`);
    compare(
      `${position}_wheel_mismatch`,
      tire?.specs.wheel_bsd_mm,
      rim?.specs.wheel_bsd_mm,
      `El aro y el neumático ${label}s tienen diámetros distintos.`,
    );
    const actualBSD = tire?.specs.wheel_bsd_mm ?? rim?.specs.wheel_bsd_mm;
    const frameBSD = bsd(
      frame?.specs[position === "front" ? "wheel_front" : "wheel_rear"],
    );
    compare(
      `${position}_frame_wheel`,
      frameBSD,
      actualBSD,
      `El aro ${label} difiere del formato indicado para el cuadro.`,
    );
    if (position === "front")
      compare(
        "fork_wheel",
        fork?.specs.wheel_bsd_mm,
        actualBSD,
        "La horquilla y la rueda delantera indican diámetros distintos.",
      );
    if (rotor && hub)
      compare(
        `${position}_rotor_mount`,
        standard(rotor.specs.rotor_mount),
        standard(hub.specs.rotor_mount),
        `El disco y el buje ${label}s usan anclajes distintos.`,
      );
    const axle =
      position === "front"
        ? fork?.specs.axle_standard
        : frame?.specs.rear_axle_standard;
    if (hub)
      compare(
        `${position}_axle`,
        standard(axle),
        standard(hub.specs.axle_standard),
        `El eje del buje ${label} difiere de la interfaz indicada en ${position === "front" ? "la horquilla" : "el cuadro"}.`,
      );
    const limits: [SelectedVariant | undefined, string][] = [
      [brake, "el freno"],
    ];
    if (position === "front") limits.push([fork, "la horquilla"]);
    for (const [part, source] of limits) {
      const diameter = rotor?.specs.rotor_diameter_mm,
        min = part?.specs.rotor_min_mm,
        max = part?.specs.rotor_max_mm;
      if (
        typeof diameter === "number" &&
        ((typeof min === "number" && diameter < min) ||
          (typeof max === "number" && diameter > max))
      )
        add(
          `${position}_${source}_rotor_range`,
          `El diámetro del disco ${label} queda fuera del intervalo documentado para ${source}.`,
        );
    }
    compare(
      `${position}_rotor_thickness`,
      rotor?.specs.rotor_thickness_mm,
      brake?.specs.rotor_thickness_mm,
      `El espesor del disco ${label} difiere del indicado para el freno.`,
    );
    if (
      rotor &&
      brake?.specs.rotor_thickness_mm != null &&
      rotor.specs.rotor_thickness_mm == null
    )
      add(
        `${position}_rotor_thickness_unknown`,
        `Falta confirmar el espesor del disco ${label} para comprobarlo con el freno.`,
        "unknown",
      );
    if (
      hub &&
      hub.specs.position &&
      hub.specs.position !== "both" &&
      hub.specs.position !== position
    )
      add(
        `${position}_hub_position`,
        `El buje elegido no está indicado para la rueda ${position === "front" ? "delantera" : "trasera"}.`,
      );
  }
  if (
    frame &&
    fork &&
    frame.specs.headset_standard &&
    fork.specs.steerer_standard
  )
    add(
      "steerer",
      "Revisa la dirección y sus adaptadores: las referencias publicadas no certifican el conjunto.",
      "unknown",
    );
  if (frame && shock) {
    const fit = object(frame.specs.shock_fit);
    if (typeof fit.restrictions === "string" && fit.restrictions.trim())
      add(
        "shock_frame_restrictions",
        `Amortiguador del cuadro: ${fit.restrictions}`,
        "unknown",
      );
    compare(
      "shock_length",
      fit.eye_to_eye_mm,
      shock.specs.eye_to_eye_mm,
      "La distancia entreojos del amortiguador difiere de la indicada para el cuadro.",
    );
    compare(
      "shock_stroke",
      fit.stroke_mm,
      shock.specs.stroke_mm,
      "La carrera del amortiguador difiere de la indicada para el cuadro.",
    );
    const mounts = object(shock.specs.mount_standard);
    for (const end of ["upper", "lower"] as const) {
      const expected = object(fit[`${end}_mount`]),
        actual = object(mounts[end]);
      for (const key of ["type", "width_mm", "bolt_diameter_mm"])
        compare(
          `shock_${end}_${key}`,
          expected[key],
          actual[key],
          `El anclaje ${end === "upper" ? "superior" : "inferior"} del amortiguador difiere del indicado en el cuadro.`,
        );
    }
    if (!fit.eye_to_eye_mm || !mounts.upper || !mounts.lower)
      add(
        "shock_unknown",
        "Faltan medidas o herrajes documentados para comprobar el montaje del amortiguador.",
        "unknown",
      );
  }
  if (frame && bb) {
    const shell = object(frame.specs.bb_shell);
    compare(
      "bb_shell",
      standard(shell.standard),
      standard(bb.specs.shell_standard),
      "El pedalier y el cuadro indican cajas distintas.",
    );
    compare(
      "bb_width",
      shell.width_mm,
      bb.specs.shell_width_mm,
      "La anchura de la caja y la del pedalier son distintas.",
    );
  }
  if (bb && cranks) {
    compare(
      "crank_spindle",
      standard(bb.specs.spindle_standard),
      standard(cranks.specs.spindle_standard),
      "El pedalier y las bielas indican sistemas de eje distintos.",
    );
    compare(
      "crank_diameter",
      bb.specs.spindle_diameter_mm,
      cranks.specs.spindle_diameter_mm,
      "El diámetro del eje de bielas y el del pedalier son distintos.",
    );
  }
  const cassette = get("cassette"),
    derailleur = get("rear_derailleur"),
    rearHub = get("rear_hub");
  if (cassette && rearHub)
    compare(
      "freehub",
      standard(cassette.specs.freehub_standard),
      standard(rearHub.specs.freehub_standard),
      "El cassette y el buje trasero indican núcleos distintos.",
    );
  if (cassette && derailleur) {
    compare(
      "drivetrain_speeds",
      cassette.specs.speed_count,
      derailleur.specs.speed_count,
      "El cassette y el cambio indican números de velocidades distintos.",
    );
    if (
      cassette.specs.ecosystem &&
      derailleur.specs.ecosystem &&
      cassette.specs.ecosystem !== derailleur.specs.ecosystem
    )
      add(
        "drivetrain_system",
        "Revisa el sistema de transmisión: las referencias elegidas indican familias diferentes.",
        "unknown",
      );
  }
  const bar = get("handlebar"),
    stem = get("stem"),
    post = get("seatpost");
  if (bar && stem)
    compare(
      "bar_clamp",
      bar.specs.clamp_diameter_mm,
      stem.specs.bar_clamp_diameter_mm,
      "El manillar y la potencia indican diámetros de abrazadera distintos.",
    );
  if (frame && post)
    compare(
      "seatpost_diameter",
      frame.specs.seatpost_diameter_mm,
      post.specs.diameter_mm,
      "El cuadro y la tija indican diámetros distintos. Revisa si existe un adaptador válido.",
    );
  if (
    stem?.specs.mount_type === "direct_mount" &&
    fork?.specs.crown_type === "single"
  )
    add(
      "stem_mount",
      "La potencia de montaje directo requiere una pletina compatible.",
    );
  for (const item of configuration.items) {
    const variant = variants[item.variantId];
    if (!variant)
      add(
        `missing_${item.slot}`,
        `No se pudo resolver ${slotLabels[item.slot].toLowerCase()}.`,
        "unknown",
      );
    else if (!variant.selectable)
      add(
        `retired_${item.slot}`,
        `${slotLabels[item.slot]} retirado del catálogo: se conserva en este montaje.`,
        "unknown",
      );
  }
  if (configuration.items.length)
    add(
      "visual_reference",
      "Montaje visual aproximado. No certifica el encaje mecánico de las piezas.",
      "unknown",
    );
  return result;
}
