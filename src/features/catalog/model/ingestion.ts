import { z } from "zod";
import {
  assetSchema,
  componentSchema,
  variantSchema,
  sourceSchema,
} from "./index.ts";
import { specificationSchemas } from "./specifications.ts";
import { modelProfiles } from "./visual-profiles.ts";
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
  for (const asset of data.assets) {
    const {
      mount_space: space,
      assembly_version: version,
      profile_key: profile,
    } = asset.manifest.parameters;
    if (version && space !== "frame")
      throw Error("Assembly version requires a frame mounting space");
    if (!space) continue;
    if (asset.kind !== "glb" || !profile || modelProfiles[profile] !== space)
      throw Error("GLB mounting space has an invalid profile");
    const required =
      space === "frame"
        ? [
            "rear_axle",
            "head_tube",
            "head_tube_lower",
            "seat_tube",
            "shock_upper",
            "shock_lower",
          ]
        : space === "fork"
          ? ["axle", "lower_crown"]
          : ["upper_eye", "lower_eye"];
    if (required.some((key) => !asset.manifest.anchors[key]))
      throw Error("GLB mounting anchors are incomplete");
    if (space === "frame" && version !== "atlas-assembly-v5")
      throw Error("GLB frame assembly is missing");
  }
  for (const component of data.components)
    if (!brands.has(component.brand_id))
      throw new Error("Missing source brand");
  for (const variant of data.variants) {
    const component = components.get(variant.component_id);
    if (!component) throw new Error("Missing source model");
    specificationSchemas[component.category].parse(variant.specs);
    const visual = assets.get(variant.visual_asset_id ?? "");
    if (
      [
        "atlas-bike-v3",
        "atlas-bike-v4",
        "atlas-bike-v5",
        "atlas-bike-v6",
        "atlas-bike-v7",
      ].includes(visual?.generator_key ?? "")
    ) {
      const profile = visual!.manifest.parameters.profile_key;
      if (!profile || modelProfiles[profile] !== component.category)
        throw Error("Visual profile does not match component category");
    }
    if (
      visual?.manifest.parameters.mount_space !== undefined &&
      visual.manifest.parameters.mount_space !== component.category
    )
      throw Error("GLB mount does not match component category");
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
