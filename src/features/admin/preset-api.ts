import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { requireSupabase } from "../../lib/supabase";
import { variantSchema, type Category } from "../catalog/model";
import { useAuth } from "../auth/provider";
import { adminStaleTime } from "./api";
import { useSearchFilters } from "./useSearchFilters";
const optionsSchema = z.object({
  count: z.number(),
  brands: z.array(z.object({ id: z.uuid(), name: z.string() })),
  components: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
      category: z.string(),
      brands: z.object({ name: z.string() }),
      component_variants: z.array(variantSchema.omit({ visual_assets: true })),
    }),
  ),
});
export function usePresetOptions(
  category?: Category,
  search = "",
  page = 0,
  ids?: string[],
) {
  const auth = useAuth();
  const filters = useSearchFilters(search, page, category ?? "");
  const stableIds = ids ? [...new Set(ids)].sort() : undefined;
  return useQuery({
    queryKey: ["preset-options", auth.user?.id, category, filters.search, filters.page, stableIds],
    staleTime: adminStaleTime,
    enabled: stableIds === undefined || stableIds.length > 0,
    queryFn: async ({ signal }) => {
      const { data, error } = await requireSupabase()
        .rpc("preset_options", {
          p_category: category ?? null,
          p_search: filters.search,
          p_page: filters.page,
          p_ids: stableIds ?? null,
        })
        .abortSignal(signal);
      if (error) throw error;
      return optionsSchema.parse(data);
    },
  });
}

// An empty ID set asks the existing RPC for brands without any component rows.
// The gallery needs brand names to create a reference, not the historical inventory.
export function usePresetBrands() {
  const auth = useAuth();
  return useQuery({
    queryKey: ["preset-options", auth.user?.id, "brands"],
    staleTime: adminStaleTime,
    queryFn: async ({ signal }) => {
      const { data, error } = await requireSupabase().rpc("preset_options", {
        p_category: null, p_search: "", p_page: 0, p_ids: [],
      }).abortSignal(signal);
      if (error) throw error;
      return optionsSchema.parse(data);
    },
  });
}
