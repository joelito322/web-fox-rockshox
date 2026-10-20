import { z } from "zod";
import type { Category } from "./index";

// One finite dictionary drives input controls and both browser/database contracts.
// Missing manufacturer data stays null; visual estimates never enter these fields.
export type SpecField = {
  key: string;
  label: string;
  kind: "text" | "number" | "boolean" | "list" | "group" | "records";
  options?: { value: string; label: string }[];
  children?: SpecField[];
  integer?: boolean;
  min?: number;
  max?: number;
};
const text = (key: string, label: string): SpecField => ({
  key,
  label,
  kind: "text",
});
const number = (
  key: string,
  label: string,
  min = 0.000001,
  integer = false,
  max = 100000,
): SpecField => ({ key, label, kind: "number", min, integer, max });
const list = (key: string, label: string): SpecField => ({
  key,
  label,
  kind: "list",
});
const group = (
  key: string,
  label: string,
  children: SpecField[],
): SpecField => ({ key, label, kind: "group", children });
const records = (
  key: string,
  label: string,
  children: SpecField[],
): SpecField => ({ key, label, kind: "records", children });
const choice = (key: string, label: string, pairs: string[][]): SpecField => ({
  ...text(key, label),
  options: pairs.map(([value, label]) => ({ value, label })),
});
const spring = choice("spring_type", "Resorte", [
  ["air", "Aire"],
  ["coil", "Muelle"],
]);
const weight = number("weight_g", "Peso (g)");
const travel = number("travel_mm", "Recorrido (mm)", 0);
const maintenance = group("maintenance", "Mantenimiento", [
  records("documents", "Manuales", [
    text("title", "Título"),
    text("url", "Enlace oficial"),
    text("revision", "Revisión"),
  ]),
  records("tasks", "Operaciones", [
    text("name", "Operación"),
    number("interval_hours", "Intervalo (horas)"),
    number("interval_months", "Intervalo (meses)"),
    text("interval_text", "Indicación original"),
    text("conditions", "Condiciones"),
    text("source_url", "Fuente oficial"),
  ]),
]);
const mount = (key: string, label: string) =>
  group(key, label, [
    text("type", "Tipo de anclaje"),
    number("width_mm", "Anchura (mm)"),
    number("bolt_diameter_mm", "Tornillo (mm)"),
  ]);
const material = text("material", "Material"),
  brakeMount = text("brake_mount", "Anclaje del freno"),
  axle = text("axle_standard", "Eje"),
  wheel = number("wheel_bsd_mm", "Diámetro BSD (mm)", 1, true),
  speeds = number("speed_count", "Velocidades", 1, true),
  rotorMount = text("rotor_mount", "Anclaje del disco"),
  freehub = text("freehub_standard", "Núcleo"),
  spindle = text("spindle_standard", "Eje de bielas"),
  spindleDiameter = number(
    "spindle_diameter_mm",
    "Diámetro del eje de bielas (mm)",
  ),
  adjustments = list("adjustments", "Ajustes"),
  damping = text("damping_system", "Hidráulico"),
  rotorMin = number("rotor_min_mm", "Disco mínimo (mm)"),
  rotorMax = number("rotor_max_mm", "Disco máximo (mm)"),
  tubeless: SpecField = { key: "tubeless", label: "Tubeless", kind: "boolean" },
  width = number("width_mm", "Anchura (mm)"),
  length = number("length_mm", "Longitud (mm)");
const position = (key: string, label: string) =>
  choice(key, label, [
    ["front", "Delantero"],
    ["rear", "Trasero"],
    ["both", "Ambos"],
  ]);
const categories: Record<Category, SpecField[]> = {
  frame: [
    text("size_label", "Talla original"),
    material,
    text("suspension_type", "Sistema de suspensión"),
    text("wheel_front", "Aro delantero"),
    text("wheel_rear", "Aro trasero"),
    group("geometry", "Geometría", [
      number("reach_mm", "Reach (mm)"),
      number("stack_mm", "Stack (mm)"),
      number("effective_top_tube_mm", "Tubo superior efectivo (mm)"),
      number("seat_tube_mm", "Tubo del sillín (mm)"),
      number("head_tube_mm", "Tubo de dirección (mm)"),
      number("chainstay_mm", "Vainas (mm)"),
      number("wheelbase_mm", "Distancia entre ejes (mm)"),
      number(
        "head_angle_deg",
        "Ángulo de dirección (°)",
        0.000001,
        false,
        179.999999,
      ),
      number(
        "seat_angle_deg",
        "Ángulo del sillín (°)",
        0.000001,
        false,
        179.999999,
      ),
      number("bb_height_mm", "Altura de pedalier (mm)"),
      number("bb_drop_mm", "Caída del pedalier (mm)", -100000),
      text("reference_position", "Posición de referencia"),
    ]),
    number("rear_travel_mm", "Recorrido trasero (mm)", 0),
    group("shock_fit", "Amortiguador del cuadro", [
      number("eye_to_eye_mm", "Entreojos (mm)"),
      number("stroke_mm", "Carrera (mm)"),
      mount("upper_mount", "Anclaje superior"),
      mount("lower_mount", "Anclaje inferior"),
      text("restrictions", "Restricciones"),
    ]),
    text("headset_standard", "Dirección"),
    text("rear_axle_standard", "Eje trasero"),
    text("derailleur_mount", "Anclaje del cambio"),
    group("bb_shell", "Caja de pedalier", [
      text("standard", "Estándar"),
      width,
      number("diameter_mm", "Diámetro (mm)"),
      text("thread", "Rosca"),
    ]),
    number("seatpost_diameter_mm", "Diámetro de tija (mm)"),
    number("seat_clamp_diameter_mm", "Abrazadera del sillín (mm)"),
    brakeMount,
    text("fork_restrictions", "Restricciones de horquilla"),
    text("tire_clearance_notes", "Paso de neumático"),
  ],
  fork: [
    text("wheel_format", "Formato de aro"),
    wheel,
    travel,
    number("axle_to_crown_mm", "Eje a corona (mm)"),
    number("offset_mm", "Offset (mm)", 0),
    number("stanchion_diameter_mm", "Barras (mm)"),
    choice("crown_type", "Pletina", [
      ["single", "Simple"],
      ["dual", "Doble"],
    ]),
    choice("fork_layout", "Diseño", [
      ["conventional", "Convencional"],
      ["inverted", "Invertida"],
    ]),
    text("steerer_standard", "Tubo de dirección"),
    axle,
    brakeMount,
    rotorMin,
    rotorMax,
    spring,
    damping,
    adjustments,
  ],
  shock: [
    number("eye_to_eye_mm", "Entreojos (mm)"),
    number("stroke_mm", "Carrera (mm)"),
    spring,
    group("mount_standard", "Anclajes", [
      mount("upper", "Superior"),
      mount("lower", "Inferior"),
    ]),
    damping,
    adjustments,
    group("coil", "Muelle", [
      number("rate_value", "Tasa"),
      text("rate_unit", "Unidad original"),
      number("free_length_mm", "Longitud libre (mm)"),
      number("max_stroke_mm", "Carrera máxima (mm)"),
    ]),
    group("reservoir", "Depósito", [
      text("orientation_notes", "Orientación"),
      text("documented_dimensions_mm", "Dimensiones documentadas (mm)"),
    ]),
  ],
  brake: [
    text("caliper_model", "Pinza"),
    text("lever_model", "Maneta"),
    number("piston_count", "Pistones", 1, true),
    choice("actuation", "Accionamiento", [
      ["hydraulic", "Hidráulico"],
      ["mechanical", "Mecánico"],
    ]),
    text("fluid", "Fluido"),
    choice("lever_side", "Lado de maneta", [
      ["left", "Izquierda"],
      ["right", "Derecha"],
      ["reversible", "Reversible"],
    ]),
    brakeMount,
    rotorMin,
    rotorMax,
    number("rotor_thickness_mm", "Espesor de disco (mm)"),
    group("hose", "Latiguillo", [
      text("reference", "Referencia"),
      text("connection", "Conexión"),
      length,
    ]),
    adjustments,
    list("pad_references", "Pastillas"),
  ],
  rotor: [
    number("rotor_diameter_mm", "Diámetro (mm)"),
    number("rotor_thickness_mm", "Espesor (mm)"),
    number("minimum_thickness_mm", "Espesor mínimo (mm)"),
    rotorMount,
    text("construction", "Construcción"),
    material,
    list("restrictions", "Restricciones"),
  ],
  rear_derailleur: [
    speeds,
    text("ecosystem", "Sistema"),
    text("actuation", "Accionamiento"),
    text("mount_standard", "Anclaje"),
    text("cage", "Caja"),
    number("total_capacity_teeth", "Capacidad total (dientes)", 1, true),
    number("min_sprocket_teeth", "Piñón mínimo (dientes)", 1, true),
    number("max_sprocket_teeth", "Piñón máximo (dientes)", 1, true),
    text("chain_system", "Cadena compatible"),
    group("associated_shifter", "Mando incluido", [
      text("brand", "Marca"),
      text("model", "Modelo"),
      text("manufacturer_code", "Referencia del fabricante"),
      speeds,
      text("actuation", "Accionamiento"),
      text("clamp_standard", "Abrazadera"),
      records("sources", "Fuentes", [
        text("url", "Enlace oficial"),
        text("consulted_at", "Fecha de consulta"),
        text("note", "Referencia"),
      ]),
    ]),
  ],
  cassette: [
    speeds,
    list("sprocket_teeth", "Dentado, de menor a mayor"),
    freehub,
    text("ecosystem", "Sistema"),
    text("construction", "Construcción"),
    material,
    text("spacer_notes", "Separadores"),
  ],
  chain: [
    list("supported_systems", "Sistemas compatibles"),
    number("nominal_speed_count", "Velocidades nominales", 1, true),
    number("link_count", "Eslabones", 1, true),
    text("connector", "Cierre"),
    text("direction_notes", "Sentido de montaje"),
  ],
  bottom_bracket: [
    text("shell_standard", "Caja de pedalier"),
    number("shell_width_mm", "Anchura de caja (mm)"),
    number("shell_diameter_mm", "Diámetro de caja (mm)"),
    text("shell_thread", "Rosca"),
    spindle,
    spindleDiameter,
    text("cup_type", "Cazoletas"),
    text("bearing_notes", "Rodamientos"),
    text("spacer_notes", "Separadores"),
    text("restrictions", "Restricciones"),
    material,
  ],
  crankset: [
    number("crank_length_mm", "Longitud de biela (mm)"),
    spindle,
    spindleDiameter,
    list("bb_shell_fit", "Cajas compatibles"),
    number("chainline_mm", "Línea de cadena (mm)"),
    group("chainring", "Plato incluido", [
      text("brand", "Marca"),
      text("model", "Modelo"),
      text("manufacturer_code", "Referencia del fabricante"),
      number("teeth", "Dientes", 1, true),
      text("mount_standard", "Anclaje"),
      text("chain_system", "Cadena compatible"),
      number("offset_mm", "Offset (mm)", -100000),
    ]),
    text("pedal_thread", "Rosca de pedal"),
    material,
  ],
  pedals: [
    choice("pedal_type", "Tipo", [
      ["flat", "Plataforma"],
      ["clipless", "Automático"],
      ["hybrid", "Mixto"],
    ]),
    number("platform_width_mm", "Anchura de plataforma (mm)"),
    number("platform_length_mm", "Longitud de plataforma (mm)"),
    number("platform_thickness_mm", "Espesor de plataforma (mm)"),
    text("thread_standard", "Rosca"),
    text("body_material", "Material del cuerpo"),
    text("spindle_material", "Material del eje"),
    text("cleat_system", "Calas"),
    text("pin_notes", "Pines"),
    text("bearing_notes", "Rodamientos"),
    choice("weight_basis", "Peso declarado por", [
      ["pair", "Par"],
      ["unit", "Unidad"],
    ]),
  ],
  rim: [
    wheel,
    text("commercial_size", "Medida comercial"),
    number("inner_width_mm", "Anchura interior (mm)"),
    number("outer_width_mm", "Anchura exterior (mm)"),
    number("profile_height_mm", "Altura de perfil (mm)"),
    number("erd_mm", "ERD (mm)"),
    number("spoke_hole_count", "Radios", 1, true),
    number("profile_offset_mm", "Offset de perfil (mm)", -100000),
    material,
    text("bead_type", "Talón"),
    tubeless,
    text("tire_restrictions", "Restricciones del neumático"),
  ],
  hub: [
    position("position", "Posición"),
    axle,
    number("axle_diameter_mm", "Diámetro de eje (mm)"),
    number("axle_width_mm", "Anchura de eje (mm)"),
    number("spoke_hole_count", "Radios", 1, true),
    rotorMount,
    freehub,
    group("flange_dimensions", "Bridas", [
      number("left_pcd_mm", "Diámetro izquierdo (mm)"),
      number("right_pcd_mm", "Diámetro derecho (mm)"),
      number("center_to_left_mm", "Centro a brida izquierda (mm)"),
      number("center_to_right_mm", "Centro a brida derecha (mm)"),
    ]),
    text("bearing_notes", "Rodamientos"),
  ],
  tire: [
    text("etrto", "Medida ETRTO"),
    text("commercial_size", "Medida comercial"),
    wheel,
    number("tire_width_mm", "Anchura (mm)"),
    number("outer_diameter_mm", "Diámetro exterior (mm)"),
    text("casing", "Carcasa"),
    text("compound", "Compuesto"),
    text("bead_type", "Talón"),
    number("tpi", "TPI", 1, true),
    tubeless,
    position("recommended_position", "Posición recomendada"),
    text("rotation_notes", "Sentido de giro"),
    list("terrain_tags", "Terreno"),
    list("condition_tags", "Condiciones"),
    group("pressure_limits", "Presión", [
      number("min_value", "Mínima"),
      number("max_value", "Máxima"),
      text("unit", "Unidad"),
      text("conditions", "Condiciones"),
    ]),
    group("rim_width_limits_mm", "Anchura de aro admitida", [
      number("min", "Mínima (mm)"),
      number("max", "Máxima (mm)"),
      text("conditions", "Condiciones"),
    ]),
  ],
  handlebar: [
    width,
    number("clamp_diameter_mm", "Abrazadera (mm)"),
    number("rise_mm", "Elevación (mm)", -100000),
    number("upsweep_deg", "Ángulo vertical (°)", -180, false, 180),
    number("backsweep_deg", "Retroceso (°)", -180, false, 180),
  ],
  stem: [
    choice("mount_type", "Montaje", [
      ["steerer_clamp", "Al tubo de dirección"],
      ["direct_mount", "Directo a la pletina"],
    ]),
    number("steerer_diameter_mm", "Tubo de dirección (mm)"),
    number("bar_clamp_diameter_mm", "Abrazadera de manillar (mm)"),
    length,
    number("angle_deg", "Ángulo (°)", -180, false, 180),
    text("direct_mount_interface", "Interfaz de montaje directo"),
  ],
  saddle: [length, width, text("rail_interface", "Raíles")],
  seatpost: [
    number("diameter_mm", "Diámetro (mm)"),
    length,
    number("insertion_mm", "Inserción (mm)", 0),
    travel,
    text("actuation", "Accionamiento"),
  ],
};
export const specificationFields = Object.fromEntries(
  Object.entries(categories).map(([key, fields]) => [
    key,
    [...fields, weight, maintenance],
  ]),
) as Record<Category, SpecField[]>;
export function fieldSchema(field: SpecField): z.ZodType {
  let schema: z.ZodType;
  if (field.kind === "group" || field.kind === "records") {
    const object = z.strictObject(
      Object.fromEntries(
        field.children!.map((f) => [f.key, fieldSchema(f).optional()]),
      ),
    );
    schema = field.kind === "records" ? z.array(object).max(50) : object;
  } else if (field.kind === "number") {
    let numeric = z
      .number()
      .min(field.min ?? 0)
      .max(field.max ?? 100000);
    if (field.integer) numeric = numeric.int();
    schema = numeric;
  } else if (field.kind === "boolean") schema = z.boolean();
  else if (field.kind === "list")
    schema = z
      .array(
        field.key === "sprocket_teeth"
          ? z.number().int().positive().max(1000)
          : z.string().min(1).max(500),
      )
      .max(100);
  else if (field.options)
    schema = z.enum(field.options.map((o) => o.value) as [string, ...string[]]);
  else if (["url", "source_url"].includes(field.key))
    schema = z
      .string()
      .max(2048)
      .regex(/^https?:\/\/[^\s]+$/);
  else schema = z.string().max(2000);
  return schema.nullable();
}
export const specificationSchemas = Object.keys(specificationFields).reduce(
  (schemas, key) => {
    const category = key as Category;
    schemas[category] = z.strictObject(
      Object.fromEntries(
        specificationFields[category].map((f) => [
          f.key,
          fieldSchema(f).optional(),
        ]),
      ),
    );
    return schemas;
  },
  {} as Record<Category, z.ZodType<Record<string, unknown>>>,
);
