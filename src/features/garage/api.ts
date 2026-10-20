import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { requireSupabase } from "../../lib/supabase";
import { useAuth } from "../auth/provider";
import { configurationSchema, type Configuration } from "../configurator/model";
export const headerSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  revision: z.number().int(),
  updated_at: z.string(),
});
export type BuildHeader = z.infer<typeof headerSchema>;
export function useBuilds(page = 0) {
  const { user, permissions } = useAuth();
  return useQuery({
    queryKey: ["builds", user?.id, page],
    enabled: !!user && permissions.includes("builds.read_own"),
    staleTime: 0,
    queryFn: async ({ signal }) => {
      const { data, error, count } = await requireSupabase()
        .from("builds")
        .select("id,name,revision,updated_at,build_items(count)", {
          count: "exact",
        })
        .order("updated_at", { ascending: false })
        .order("id")
        .range(page * 24, page * 24 + 23)
        .abortSignal(signal);
      if (error) throw error;
      return {
        builds: z
          .array(
            headerSchema.extend({
              build_items: z.array(z.object({ count: z.number() })),
            }),
          )
          .parse(data)
          .map(({ build_items, ...header }) => ({
            ...header,
            part_count: build_items[0]?.count ?? 0,
          })),
        count: count ?? 0,
      };
    },
  });
}
export async function readBuild(id: string) {
  const { data, error } = await requireSupabase()
    .from("builds")
    .select(
      "id,name,revision,updated_at,schema_version,build_items(slot,variant_id,finish_id,custom_color)",
    )
    .eq("id", id)
    .single();
  if (error) throw error;
  return {
    ...headerSchema.parse(data),
    configuration: configurationSchema.parse({
      schemaVersion: data.schema_version,
      name: data.name,
      items: data.build_items.map(
        (i: {
          slot: string;
          variant_id: string;
          finish_id: string;
          custom_color: string | null;
        }) => ({
          slot: i.slot,
          variantId: i.variant_id,
          finishId: i.finish_id,
          customColor: i.custom_color,
        }),
      ),
    }),
  };
}
export async function saveBuild(
  id: string,
  revision: number,
  configuration: Configuration,
) {
  const { data, error } = await requireSupabase().rpc("save_build", {
    p_build_id: id,
    p_expected_revision: revision,
    p_configuration: configurationSchema.parse(configuration),
  });
  if (error) throw error;
  return headerSchema.parse(data);
}
export async function deleteBuild(id: string) {
  const { error } = await requireSupabase()
    .from("builds")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
