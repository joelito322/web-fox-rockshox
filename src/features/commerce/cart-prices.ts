import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { salesRpc } from "./api";
import { offerSchema, type CartLine } from "./model";

export function useCartPrices(lines: CartLine[]) {
  const ids = lines.map((line) => line.offer_id).sort();
  return useQuery({
    queryKey: ["sales", "cart-prices", ids],
    enabled: !!ids.length,
    queryFn: ({ signal }) =>
      salesRpc(
        "sales_cart_prices",
        {
          p_lines: ids.map((offer_id) => ({ offer_id, quantity: 1 })),
        },
        z.array(offerSchema),
        signal,
      ),
    staleTime: 15_000,
  });
}
