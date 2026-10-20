import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { requireSupabase } from "../../lib/supabase";
import {
  componentSchema,
  type Category,
  type SelectedVariant,
  selectVariant,
} from "./model";

export const catalogProjection =
  "id,brand_id,name,slug,category,disciplines,description,technical_notes,image_key,published,brands!inner(id,name,slug),component_variants!inner(id,component_id,label,model_year,generation,manufacturer_code,image_key,sources,specs_schema_version,specs,price_reference,allowed_finishes,visual_asset_id,representation,published,selectable,visual_assets(id,kind,storage_path,generator_key,manifest,published))";
export const filterKeys = [
  "size_label",
  "wheel_bsd_mm",
  "spring_type",
  "crown_type",
  "piston_count",
  "terrain_tags",
  "casing",
  "compound",
  "speed_count",
  "etrto",
  "travel_mm",
  "eye_to_eye_mm",
  "stroke_mm",
  "rotor_diameter_mm",
  "rotor_mount",
  "freehub_standard",
  "shell_standard",
  "spindle_standard",
  "pedal_type",
  "commercial_size",
] as const;
export type CatalogFilters = {
  brand?: string;
  discipline?: string;
  specs?: Record<string, string>;
};
export function useFacets(category?: Category) {
  return useQuery({
    queryKey: ["catalog-facets", category ?? "all"],
    staleTime: 300_000,
    queryFn: async () => {
      const { data, error } = await requireSupabase().rpc("catalog_facets", {
        p_category: category ?? null,
      });
      if (error) throw error;
      return z
        .object({
          brands: z.array(z.object({ id: z.uuid(), name: z.string() })),
          disciplines: z.array(z.string()),
          specs: z.record(
            z.string(),
            z.array(z.union([z.string(), z.number(), z.boolean()])),
          ),
        })
        .parse(data);
    },
  });
}
export function useCatalog(
  category?: Category,
  search = "",
  page = 0,
  filters: CatalogFilters = {},
) {
  return useQuery({
    queryKey: ["catalog", category ?? "all", search.trim(), page, filters],
    staleTime: 300_000,
    queryFn: async ({ signal }) => {
      let query = requireSupabase()
        .from("components")
        .select(catalogProjection, { count: "exact" })
        .eq("published", true)
        .eq("component_variants.published", true)
        .eq("component_variants.selectable", true)
        .order("name")
        .order("id")
        .range(page * 24, page * 24 + 23)
        .abortSignal(signal);
      if (category) query = query.eq("category", category);
      if (filters.brand && z.uuid().safeParse(filters.brand).success)
        query = query.eq("brand_id", filters.brand);
      if (
        filters.discipline &&
        ["enduro", "downhill"].includes(filters.discipline)
      )
        query = query.contains("disciplines", [filters.discipline]);
      for (const [key, value] of Object.entries(filters.specs ?? {})) {
        if (!filterKeys.includes(key as (typeof filterKeys)[number]) || !value)
          continue;
        if (key === "terrain_tags")
          query = query.contains("component_variants.specs", {
            terrain_tags: [value],
          });
        else query = query.eq(`component_variants.specs->>${key}`, value);
      }
      if (search.trim())
        query = query.ilike("name", `%${search.trim().replace(/[%_]/g, "")}%`);
      const { data, error, count } = await query;
      if (error) throw error;
      return {
        components: z.array(componentSchema).parse(data),
        count: count ?? 0,
      };
    },
  });
}
export function useComponent(slug?: string) {
  return useQuery({
    queryKey: ["component", slug],
    enabled: !!slug,
    staleTime: 300_000,
    queryFn: async ({ signal }) => {
      const { data, error } = await requireSupabase()
        .from("components")
        .select(catalogProjection)
        .eq("slug", slug!)
        .eq("published", true)
        .abortSignal(signal)
        .single();
      if (error) throw error;
      return componentSchema.parse(data);
    },
  });
}
export async function readVariants(
  ids: string[],
  signal?: AbortSignal,
): Promise<SelectedVariant[]> {
  if (!ids.length) return [];
  let query = requireSupabase()
    .from("components")
    .select(catalogProjection)
    .in("component_variants.id", ids);
  if (signal) query = query.abortSignal(signal);
  const { data, error } = await query;
  if (error) throw error;
  return z
    .array(componentSchema)
    .parse(data)
    .flatMap((c) =>
      c.component_variants
        .filter((v) => ids.includes(v.id))
        .map((v) => selectVariant(c, v)),
    );
}
