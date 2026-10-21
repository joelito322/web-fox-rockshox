import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { z } from "zod";
import { requireSupabase } from "../../lib/supabase";
import {
  componentSchema,
  variantSchema,
  type Category,
  type ComponentModel,
  type SelectedVariant,
  selectVariant,
} from "./model";

export const catalogProjection =
  "id,brand_id,name,slug,category,disciplines,description,technical_notes,image_key,published,brands!inner(id,name,slug),component_variants!inner(id,component_id,label,model_year,generation,manufacturer_code,image_key,sources,specs_schema_version,specs,price_reference,allowed_finishes,visual_asset_id,representation,published,selectable,visual_assets(id,kind,storage_path,generator_key,manifest,published))";
export const catalogCardSchema = componentSchema
  .pick({
    id: true,
    brand_id: true,
    name: true,
    slug: true,
    category: true,
    disciplines: true,
    image_key: true,
    brands: true,
  })
  .extend({
    component_variants: z.array(
      variantSchema.pick({ id: true, image_key: true, specs: true }),
    ),
  });
export type CatalogCard = z.infer<typeof catalogCardSchema>;
export const catalogCardProjection =
  "id,brand_id,name,slug,category,disciplines,image_key,brands!inner(id,name,slug),component_variants!inner(id,image_key,specs)";
const catalogStaleTime = 300_000;
export const filterKeys = [
  "size_label",
  "wheel_bsd_mm",
  "wheel_front",
  "wheel_rear",
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
    queryFn: async ({ signal }) => {
      const { data, error } = await requireSupabase()
        .rpc("catalog_facets", {
          p_category: category ?? null,
        })
        .abortSignal(signal);
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
function catalogQuery(
  category: Category | undefined,
  search: string,
  page: number,
  filters: CatalogFilters,
  projection: string,
  signal: AbortSignal,
) {
  let query = requireSupabase()
    .from("components")
    .select(projection, { count: "exact" })
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
  if (filters.discipline && ["enduro", "downhill"].includes(filters.discipline))
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

  return query;
}
export function useCatalogCards(
  category?: Category,
  search = "",
  page = 0,
  filters: CatalogFilters = {},
) {
  return useQuery({
    queryKey: [
      "catalog",
      "cards",
      category ?? "all",
      search.trim(),
      page,
      filters,
    ],
    staleTime: catalogStaleTime,
    queryFn: async ({ signal }) => {
      const { data, error, count } = await catalogQuery(
        category,
        search,
        page,
        filters,
        catalogCardProjection,
        signal,
      );
      if (error) throw error;
      return {
        components: z.array(catalogCardSchema).parse(data),
        count: count ?? 0,
      };
    },
  });
}
function cacheComponentVariants(
  client: QueryClient,
  components: ComponentModel[],
) {
  for (const component of components)
    for (const variant of component.component_variants)
      client.setQueryData(
        ["catalog", "variant", variant.id],
        selectVariant(component, variant),
      );
}
export function useCatalog(
  category?: Category,
  search = "",
  page = 0,
  filters: CatalogFilters = {},
) {
  const client = useQueryClient();
  return useQuery({
    queryKey: ["catalog", category ?? "all", search.trim(), page, filters],
    staleTime: catalogStaleTime,
    queryFn: async ({ signal }) => {
      const { data, error, count } = await catalogQuery(
        category,
        search,
        page,
        filters,
        catalogProjection,
        signal,
      );
      if (error) throw error;
      const components = z.array(componentSchema).parse(data);
      cacheComponentVariants(client, components);
      return { components, count: count ?? 0 };
    },
  });
}
export async function readCachedComponent(client: QueryClient, slug: string) {
  return client.fetchQuery({
    queryKey: ["component", slug],
    staleTime: catalogStaleTime,
    queryFn: async ({ signal }) => readComponent(client, slug, signal),
  });
}
async function readComponent(
  client: QueryClient,
  slug: string,
  signal: AbortSignal,
) {
  const { data, error } = await requireSupabase()
    .from("components")
    // A component can still be opened from an old saved version even when
    // it no longer has current choices. Keep the parent row in that case.
    .select(
      catalogProjection.replace(
        "component_variants!inner",
        "component_variants",
      ),
    )
    .eq("slug", slug)
    .eq("published", true)
    .eq("component_variants.published", true)
    .eq("component_variants.selectable", true)
    .abortSignal(signal)
    .single();
  if (error) throw error;
  const component = componentSchema.parse(data);
  cacheComponentVariants(client, [component]);
  return component;
}
export function useComponent(slug?: string) {
  const client = useQueryClient();
  return useQuery({
    queryKey: ["component", slug],
    enabled: !!slug,
    staleTime: catalogStaleTime,
    queryFn: ({ signal }) => readComponent(client, slug!, signal),
  });
}
/** Resolve only an explicitly requested old version, not the model's entire history. */
export function useHistoricalVariant(
  component: ComponentModel,
  id?: string | null,
) {
  return useQuery({
    queryKey: ["catalog", "variant", id],
    enabled: !!id && z.uuid().safeParse(id).success &&
      !component.component_variants.some((variant) => variant.id === id),
    staleTime: catalogStaleTime,
    queryFn: async ({ signal }) => {
      const variants = await readVariants([id!], signal);
      return variants.find((variant) => variant.id === id) ?? null;
    },
    select: (variant) => (variant?.component.id === component.id ? variant : null),
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

/** Share immutable versioned variants within this account's QueryClient, never across sessions. */
export async function readCachedVariants(
  client: QueryClient,
  ids: string[],
  signal?: AbortSignal,
): Promise<SelectedVariant[]> {
  signal?.throwIfAborted();
  const unique = [...new Set(ids)];
  const cached = new Map<string, SelectedVariant>();
  const missing = unique
    .filter((id) => {
      const state = client.getQueryState<SelectedVariant>([
        "catalog",
        "variant",
        id,
      ]);
      if (
        state?.data &&
        !state.isInvalidated &&
        Date.now() - state.dataUpdatedAt < catalogStaleTime
      ) {
        cached.set(id, state.data);
        return false;
      }
      return true;
    })
    .sort();
  if (missing.length) {
    // Different callers often overlap (e.g. a preview and an open assembly).
    // Reuse the in-flight coverage instead of requesting that intersection twice.
    const uncovered = new Set(missing);
    const pending: Promise<SelectedVariant[]>[] = [];
    for (const query of client.getQueryCache().findAll({
      queryKey: ["catalog", "variant-batch"],
      fetchStatus: "fetching",
    })) {
      const batchIds = query.queryKey[2];
      if (
        !Array.isArray(batchIds) || !query.promise ||
        !batchIds.some((id) => uncovered.has(id))
      ) continue;
      pending.push(query.promise as Promise<SelectedVariant[]>);
      batchIds.forEach((id) => uncovered.delete(id));
    }
    const remaining = [...uncovered].sort();
    if (remaining.length)
      pending.push(client.fetchQuery({
        queryKey: ["catalog", "variant-batch", remaining],
        staleTime: 0,
        queryFn: async ({ signal: querySignal }) => {
          // Cancellation of one consumer must not reject another sharing this batch.
          // Account changes cancel the QueryClient request itself.
          const values = await readVariants(remaining, querySignal);
          querySignal.throwIfAborted();
          for (const value of values)
            client.setQueryData(["catalog", "variant", value.id], value);
          return values;
        },
      }));
    const batches = await Promise.all(pending);
    for (const variants of batches)
      for (const variant of variants)
        if (unique.includes(variant.id)) cached.set(variant.id, variant);
  }
  signal?.throwIfAborted();
  return unique.flatMap((id) => (cached.has(id) ? [cached.get(id)!] : []));
}
