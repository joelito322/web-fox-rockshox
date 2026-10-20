import { z } from "zod";
import { manifestSchema } from "./visual.ts";

export const categories = [
  "frame",
  "fork",
  "shock",
  "rim",
  "tire",
  "hub",
  "brake",
  "rotor",
  "cassette",
  "chain",
  "rear_derailleur",
  "bottom_bracket",
  "crankset",
  "pedals",
  "handlebar",
  "stem",
  "seatpost",
  "saddle",
] as const;
export type Category = (typeof categories)[number];
export const categoryLabels: Record<Category, string> = {
  frame: "Cuadros",
  fork: "Horquillas",
  shock: "Amortiguadores",
  rim: "Aros",
  tire: "Neumáticos",
  hub: "Bujes",
  brake: "Frenos",
  rotor: "Discos",
  cassette: "Cassettes",
  chain: "Cadenas",
  rear_derailleur: "Cambios traseros",
  bottom_bracket: "Pedalieres",
  crankset: "Bielas y plato",
  pedals: "Pedales",
  handlebar: "Manillares",
  stem: "Potencias",
  seatpost: "Tijas",
  saddle: "Sillines",
};
export const categoryGroups: { label: string; categories: Category[] }[] = [
  { label: "Cuadros", categories: ["frame"] },
  { label: "Suspensión", categories: ["fork", "shock"] },
  { label: "Ruedas", categories: ["rim", "tire", "hub"] },
  { label: "Frenos", categories: ["brake", "rotor"] },
  {
    label: "Transmisión",
    categories: [
      "rear_derailleur",
      "cassette",
      "chain",
      "bottom_bracket",
      "crankset",
      "pedals",
    ],
  },
  { label: "Manillar y potencia", categories: ["handlebar", "stem"] },
  { label: "Sillín y tija", categories: ["saddle", "seatpost"] },
];
export const sourceSchema = z.strictObject({
  url: z
    .string()
    .max(2048)
    .regex(/^https?:\/\/[^\s]+$/),
  consulted_at: z.iso.date(),
  note: z.string().nullish(),
  fields: z.array(z.string()).optional(),
});
export const finishesSchema = z.object({
  default_finish_id: z.string(),
  custom_color_enabled: z.boolean(),
  options: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        image_key: z.string().nullish(),
        material: z.object({
          color: z.string().regex(/^#[0-9a-f]{6}$/i),
          metalness: z.number().min(0).max(1).optional(),
          roughness: z.number().min(0).max(1).optional(),
        }),
      }),
    )
    .min(1),
});
export const assetSchema = z.object({
  id: z.uuid(),
  kind: z.enum(["glb", "procedural"]),
  storage_path: z.string().nullish(),
  generator_key: z.string().nullish(),
  manifest: manifestSchema,
  published: z.boolean(),
});
export const variantSchema = z.object({
  id: z.uuid(),
  component_id: z.uuid(),
  label: z.string(),
  model_year: z.number().nullable(),
  generation: z.string().nullable(),
  manufacturer_code: z.string().nullish(),
  image_key: z.string().nullish(),
  sources: z.array(sourceSchema).default([]),
  specs_schema_version: z.number().int().positive(),
  specs: z.record(z.string(), z.unknown()),
  allowed_finishes: finishesSchema,
  representation: z.enum(["reference", "approximate", "generic"]),
  published: z.boolean(),
  selectable: z.boolean(),
  visual_asset_id: z.uuid().nullable(),
  price_reference: z
    .object({
      amount: z.number().positive(),
      currency: z.string().length(3),
      market: z.string(),
      source_url: z
        .string()
        .max(2048)
        .regex(/^https?:\/\/[^\s]+$/),
      as_of: z.string(),
    })
    .nullable(),
  visual_assets: assetSchema.nullable(),
});
export const componentSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  category: z.enum(categories),
  description: z.string(),
  technical_notes: z.string().nullable(),
  image_key: z.string().nullable(),
  disciplines: z.array(z.string()),
  published: z.boolean(),
  brand_id: z.uuid(),
  brands: z.object({ id: z.uuid(), name: z.string(), slug: z.string() }),
  component_variants: z.array(variantSchema),
});
export type VisualAsset = z.infer<typeof assetSchema>;
export type Variant = z.infer<typeof variantSchema>;
export type ComponentModel = z.infer<typeof componentSchema>;
export type SelectedVariant = Variant & {
  component: Omit<ComponentModel, "component_variants">;
};

export const specLabels: Record<string, string> = {
  size_label: "Talla",
  material: "Material",
  wheel_format: "Aro",
  wheel_front: "Aro delantero",
  wheel_rear: "Aro trasero",
  wheel_bsd_mm: "Diámetro del aro (mm)",
  travel_mm: "Recorrido (mm)",
  rear_travel_mm: "Recorrido trasero (mm)",
  axle_to_crown_mm: "Eje a corona (mm)",
  offset_mm: "Offset (mm)",
  stanchion_diameter_mm: "Barras (mm)",
  spring_type: "Resorte",
  damping_system: "Hidráulico",
  axle_standard: "Eje",
  steerer_standard: "Dirección",
  eye_to_eye_mm: "Entreojos (mm)",
  stroke_mm: "Carrera (mm)",
  piston_count: "Pistones",
  fluid: "Fluido",
  rotor_diameter_mm: "Diámetro (mm)",
  rotor_thickness_mm: "Espesor (mm)",
  rotor_mount: "Anclaje del disco",
  speed_count: "Velocidades",
  sprocket_teeth: "Dentado",
  freehub_standard: "Núcleo",
  ecosystem: "Sistema",
  crank_length_mm: "Longitud de biela (mm)",
  chainline_mm: "Línea de cadena (mm)",
  shell_standard: "Caja de pedalier",
  spindle_standard: "Eje de bielas",
  casing: "Carcasa",
  compound: "Compuesto",
  etrto: "Medida ETRTO",
  terrain_tags: "Terreno",
  tire_width_mm: "Anchura (mm)",
  width_mm: "Anchura (mm)",
  clamp_diameter_mm: "Abrazadera (mm)",
  length_mm: "Longitud (mm)",
  diameter_mm: "Diámetro (mm)",
  weight_g: "Peso (g)",
  fork_layout: "Diseño",
  crown_type: "Pletina",
  pedal_type: "Tipo de pedal",
  actuation: "Accionamiento",
};
const valueLabels: Record<string, string> = {
  air: "Aire",
  coil: "Muelle",
  single: "Simple",
  dual: "Doble",
  inverted: "Invertida",
  conventional: "Convencional",
  hydraulic: "Hidráulico",
  mechanical: "Mecánico",
  flat: "Plataforma",
  clipless: "Automático",
  hybrid: "Mixto",
  front: "Delantero",
  rear: "Trasero",
  both: "Ambos",
  enduro: "Enduro",
  downhill: "Descenso",
};
export function displaySpec(value: unknown): string {
  if (value === null || value === undefined) return "Sin confirmar";
  if (Array.isArray(value)) return value.map(displaySpec).join(" · ");
  if (typeof value === "string") return valueLabels[value] ?? value;
  if (typeof value === "number")
    return new Intl.NumberFormat("es").format(value);
  if (typeof value === "boolean") return value ? "Sí" : "No";
  return "Consultar fuente";
}
export function selectVariant(
  component: ComponentModel,
  variant: Variant,
): SelectedVariant {
  const { component_variants: _, ...model } = component;
  return { ...variant, component: model };
}
