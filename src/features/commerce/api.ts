import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { requireSupabase } from "../../lib/supabase";
import {
  offerSchema,
  cartSchema,
  summarySchema,
  orderHeader,
  orderSchema,
  quoteHeader,
  quoteSchema,
  type CartLine,
  type Contact,
  type Address,
} from "./model";
export async function salesRpc<T>(
  name: string,
  args: Record<string, unknown>,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
  account?: string,
): Promise<T> {
  let request = requireSupabase().rpc(name, args);
  if (account) request = request.setHeader("x-atlas-account", account);
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw error;
  return schema.parse(data);
}
export function useOffers(componentIds: string[], variantIds?: string[]) {
  return useQuery({
    queryKey: ["sales", "offers", componentIds, variantIds],
    enabled: !!componentIds.length || !!variantIds?.length,
    staleTime: 30_000,
    queryFn: ({ signal }) =>
      salesRpc(
        "sales_offers",
        {
          p_component_ids: componentIds.length ? componentIds : null,
          p_variant_ids: variantIds ?? null,
        },
        z.array(offerSchema),
        signal,
      ),
  });
}
export const servicePolicySchema = z.object({
  assembly_fee_cents: z.number().int().nonnegative(),
  service_revision: z.number().int().positive(),
});
export function useServicePolicy() {
  return useQuery({
    queryKey: ["sales", "service-policy"],
    queryFn: ({ signal }) =>
      salesRpc("sales_policy", {}, servicePolicySchema, signal),
    staleTime: 60_000,
  });
}
export const getCart = (signal?: AbortSignal, account?: string) =>
  salesRpc("sales_cart", {}, cartSchema, signal, account);
export const saveCart = (
  revision: number,
  lines: CartLine[],
  account?: string,
) =>
  salesRpc(
    "sales_save_cart",
    { p_revision: revision, p_lines: lines },
    cartSchema,
    undefined,
    account,
  );
export const summarize = (
  lines: CartLine[],
  contact: Contact,
  delivery: string,
  address: Address,
  quoteId?: string,
  account?: string,
) =>
  salesRpc(
    "sales_summary",
    {
      p_lines: lines,
      p_contact: contact,
      p_delivery: delivery,
      p_address: address,
      p_quote_id: quoteId ?? null,
    },
    summarySchema,
    undefined,
    account,
  );
export const createOrder = (
  key: string,
  hash: string,
  lines: CartLine[],
  contact: Contact,
  delivery: string,
  address: Address,
  revision?: number,
  quoteId?: string,
  account?: string,
  method = "yape_demo",
) =>
  salesRpc(
    "sales_create_order_with_payment",
    {
      p_key: key,
      p_method: method,
      p_hash: hash,
      p_lines: lines,
      p_contact: contact,
      p_delivery: delivery,
      p_address: address,
      p_cart_revision: revision ?? null,
      p_quote_id: quoteId ?? null,
    },
    z.guid(),
    undefined,
    account,
  );
export const getOrder = (id: string, signal?: AbortSignal) =>
  salesRpc("sales_order", { p_id: id }, orderSchema, signal);
export const getQuote = (id: string, signal?: AbortSignal) =>
  salesRpc("sales_quote", { p_id: id }, quoteSchema, signal);
export const listOrders = (
  admin: boolean,
  page: number,
  signal?: AbortSignal,
) =>
  salesRpc(
    "sales_orders",
    { p_admin: admin, p_page: page },
    z.object({ count: z.number(), items: z.array(orderHeader) }),
    signal,
  );
export const listQuotes = (
  admin: boolean,
  page: number,
  signal?: AbortSignal,
) =>
  salesRpc(
    "sales_quotes",
    { p_admin: admin, p_page: page },
    z.object({ count: z.number(), items: z.array(quoteHeader) }),
    signal,
  );
export const demoPayment = (
  id: string,
  key: string,
  method: string,
  result: string,
  account?: string,
) =>
  salesRpc(
    "sales_pay_demo",
    { p_order: id, p_key: key, p_method: method, p_result: result },
    orderSchema,
    undefined,
    account,
  );
export const transition = (
  id: string,
  revision: number,
  status: string,
  reason = "",
  account?: string,
) =>
  salesRpc(
    "sales_transition",
    { p_order: id, p_revision: revision, p_status: status, p_reason: reason },
    orderSchema,
    undefined,
    account,
  );
