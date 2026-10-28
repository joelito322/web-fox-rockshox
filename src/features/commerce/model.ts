import { z } from "zod";
export const cents = z.number().int().min(0).max(1_000_000_000_000);
export const lineSchema = z.object({
  offer_id: z.guid(),
  quantity: z.number().int().min(1).max(99),
});
export type CartLine = z.infer<typeof lineSchema>;
export const identitySchema = z
  .object({ finish: z.string(), finish_id: z.string() })
  .catchall(z.unknown());
export const conditionLabels = { new: "Nuevo", used: "Segunda mano" } as const;
const itemCondition = z.enum(["new", "used"]);
export const offerSchema = z.object({
  offer_id: z.guid(),
  component_id: z.guid(),
  sku: z.string(),
  label: z.string(),
  item_condition: itemCondition.optional(),
  image_key: z.string().nullable().optional(),
  identity: identitySchema,
  unit: z.enum(["unit", "pair", "set"]),
  quantity: z.number().int(),
  currency: z.literal("PEN"),
  base_cents: cents,
  discount_cents: cents,
  unit_cents: cents,
  subtotal_cents: cents,
  promotion_id: z.guid().nullable(),
  promotion: z.unknown().nullable(),
  available: z.number().int(),
  choices: z
    .array(z.object({ variant_id: z.guid(), finish_id: z.string() }))
    .optional(),
});
export type Offer = z.infer<typeof offerSchema>;
export const cartSchema = z.object({
  id: z.guid(),
  revision: z.number().int(),
  items: z.array(
    z.object({
      offer_id: z.guid(),
      component_id: z.guid(),
      label: z.string(),
      item_condition: itemCondition.optional(),
      identity: identitySchema,
      quantity: z.number().int(),
      active: z.boolean(),
      unit: z.string(),
      currency: z.literal("PEN"),
      base_cents: cents,
      available: z.number().int(),
    }),
  ),
});
export const contactSchema = z.object({
  name: z.string().min(2).max(150),
  contact: z.string().min(5).max(200),
});
export type Contact = z.infer<typeof contactSchema>;
export type Address = { address?: string; city?: string; region?: string };
export const summarySchema = z.object({
  lines: z.array(offerSchema.omit({ available: true })),
  currency: z.literal("PEN"),
  assembly_fee_cents: cents,
  delivery_fee_cents: cents,
  total_cents: cents,
  hash: z.string(),
  contact: contactSchema,
  delivery: z.enum(["pickup", "shipping"]),
  address: z.record(z.string(), z.unknown()),
  quote_id: z.guid().nullable(),
});
export type Summary = z.infer<typeof summarySchema>;
export const orderHeader = z.object({
  id: z.guid(),
  user_id: z.guid(),
  total_cents: cents,
  currency: z.literal("PEN"),
  status: z.string(),
  delivery_method: z.string(),
  revision: z.number().int(),
  created_at: z.string(),
});
export const orderSchema = orderHeader.extend({
  reservation_expires_at: z.string(),
  assembly_fee_cents: cents,
  delivery_fee_cents: cents,
  contact_snapshot: contactSchema,
  delivery_snapshot: z.record(z.string(), z.unknown()),
  items: z.array(
    z.object({
      id: z.guid(),
      offer_id: z.guid(),
      quantity: z.number().int(),
      label_snapshot: z.string(),
      item_condition_snapshot: itemCondition.nullable().optional(),
      finish_snapshot: z.string(),
      base_unit_price_cents: cents,
      unit_discount_cents: cents,
    }),
  ),
  payments: z.array(
    z.object({
      id: z.guid(),
      method: z.string(),
      status: z.string(),
      created_at: z.string(),
    }),
  ),
  events: z.array(
    z.object({
      id: z.guid(),
      event_type: z.string(),
      from_status: z.string().nullable(),
      to_status: z.string().nullable(),
      created_at: z.string(),
    }),
  ),
});
export type Order = z.infer<typeof orderSchema>;
export const quoteHeader = z.object({
  id: z.guid(),
  version: z.number().int(),
  status: z.string(),
  revision: z.number().int(),
  assembly_requested: z.boolean(),
  technical_review: z.string(),
  delivery_method: z.string(),
  expires_at: z.string().nullable(),
  created_at: z.string(),
});
export const quoteSchema = quoteHeader.extend({
  contact_snapshot: contactSchema,
  delivery_snapshot: z.record(z.string(), z.unknown()),
  merchandise_snapshot: z.array(offerSchema.omit({ available: true })),
  selection_snapshot: z.array(z.unknown()),
  review_notes: z.string().nullable(),
  assembly_fee_cents: cents.nullable(),
  delivery_fee_cents: cents.nullable(),
  expired: z.boolean().nullable(),
});
export type Quote = z.infer<typeof quoteSchema>;
export const statusLabels: Record<string, string> = {
  requested: "Por cotizar",
  quoted: "Pendiente de aceptación",
  rejected: "Rechazada",
  superseded: "Sustituida",
  consumed: "Pedido creado",
  pending: "Pendiente de pago",
  confirmed: "Confirmado",
  preparing: "En preparación",
  ready: "Listo",
  delivered: "Entregado",
  cancelled: "Cancelado",
  expired: "Vencido",
  approved: "Aprobado",
};
export const unitLabels: Record<string, string> = {
  unit: "unidad",
  pair: "pareja",
  set: "conjunto",
};
export const money = (amount: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(
    amount / 100,
  );
export function parseMoney(value: string) {
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(value))
    throw new Error("sales_invalid_amount");
  const [whole, part = ""] = value.replace(",", ".").split(".");
  const result = Number(whole) * 100 + Number(part.padEnd(2, "0"));
  if (!Number.isSafeInteger(result) || result > 100000000)
    throw new Error("sales_invalid_amount");
  return result;
}
export function aggregateLines(lines: CartLine[]): CartLine[] {
  const quantities = new Map<string, number>();
  for (const line of z.array(lineSchema).max(100).parse(lines))
    quantities.set(
      line.offer_id,
      (quantities.get(line.offer_id) ?? 0) + line.quantity,
    );
  return z
    .array(lineSchema)
    .max(100)
    .parse(
      [...quantities].map(([offer_id, quantity]) => ({ offer_id, quantity })),
    );
}

const limaParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Lima",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
export function limaInput(iso: string): string {
  const parts = Object.fromEntries(
    limaParts.formatToParts(new Date(iso)).map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
export function fromLimaInput(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))
    throw new Error("sales_invalid_date");
  const intended = Date.parse(value + "Z");
  let time = intended;
  for (let attempt = 0; attempt < 3; attempt++)
    time +=
      intended - Date.parse(limaInput(new Date(time).toISOString()) + "Z");
  const result = new Date(time).toISOString();
  if (limaInput(result) !== value) throw new Error("sales_invalid_date");
  return result;
}
export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("es-PE", { timeZone: "America/Lima" });
export const dateOnly = (iso: string) =>
  new Date(iso).toLocaleDateString("es-PE", { timeZone: "America/Lima" });

export const orderStatusLabel = (status: string, delivery: string) =>
  status === "ready"
    ? delivery === "shipping"
      ? "Listo para despacho"
      : "Listo para recoger"
    : (statusLabels[status] ?? "Estado por actualizar");
