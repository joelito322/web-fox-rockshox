import { z } from "zod";
import {
  assetSchema,
  componentSchema,
  variantSchema,
  sourceSchema,
} from "./index.ts";
import { specificationSchemas } from "./specifications.ts";
import { knownProceduralGenerator } from "./visual.ts";
export const catalogImportSchema = z.strictObject({
  brands: z.array(
    z.strictObject({
      id: z.uuid(),
      name: z.string().min(1).max(100),
      slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
      region: z.string().nullable(),
      published: z.boolean(),
    }),
  ),
  assets: z.array(
    assetSchema.extend({ reference_notes: z.string().nullable() }),
  ),
  components: z.array(
    componentSchema
      .omit({ brands: true, component_variants: true })
      .extend({ sources: z.array(sourceSchema) }),
  ),
  variants: z.array(variantSchema.omit({ visual_assets: true })),
});
export function parseCatalogImport(input: unknown) {
  const data = catalogImportSchema.parse(input);
  const brands = new Map(data.brands.map((b) => [b.id, b]));
  const assets = new Map(data.assets.map((a) => [a.id, a]));
  const components = new Map(data.components.map((c) => [c.id, c]));
  for (const asset of data.assets)
    if (
      asset.published &&
      asset.kind === "procedural" &&
      !knownProceduralGenerator(asset.generator_key)
    )
      throw new Error("Published resource uses an unsupported generator");
  for (const rows of [data.brands, data.assets, data.components, data.variants])
    if (new Set(rows.map((r) => r.id)).size !== rows.length)
      throw new Error("Duplicate catalogue identity");
  for (const component of data.components)
    if (!brands.has(component.brand_id))
      throw new Error("Missing source brand");
  for (const variant of data.variants) {
    const component = components.get(variant.component_id);
    if (!component) throw new Error("Missing source model");
    specificationSchemas[component.category].parse(variant.specs);
    if (variant.visual_asset_id && !assets.has(variant.visual_asset_id))
      throw new Error("Missing source visual resource");
    if (
      variant.published &&
      variant.selectable &&
      (!component.published ||
        !brands.get(component.brand_id)?.published ||
        !assets.get(variant.visual_asset_id ?? "")?.published)
    )
      throw new Error("Publication dependencies are not ready");
  }
  return data;
}
