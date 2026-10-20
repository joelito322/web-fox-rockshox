import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { requireSupabase } from "../../lib/supabase";
import { variantSchema, type Category } from "../catalog/model";
import { useAuth } from "../auth/provider";
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
  return useQuery({
    queryKey: ["preset-options", auth.user?.id, category, search, page, ids],
    queryFn: async ({ signal }) => {
      const { data, error } = await requireSupabase()
        .rpc("preset_options", {
          p_category: category ?? null,
          p_search: search,
          p_page: page,
          p_ids: ids ?? null,
        })
        .abortSignal(signal);
      if (error) throw error;
      return optionsSchema.parse(data);
    },
  });
}
