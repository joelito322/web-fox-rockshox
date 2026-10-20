import { z } from "zod";
import { sourceSchema } from "./index.ts";
import { itemSchema, slots } from "../../configurator/model/index.ts";
export const presetSchema = z
  .object({
    id: z.uuid(),
    brand_id: z.uuid(),
    name: z.string().trim().min(1).max(150),
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    family_key: z.string().min(1).max(150),
    label: z.string().trim().min(1).max(150),
    model_year: z.number().int().min(1990).max(2200).nullable(),
    image_key: z.string().nullable(),
    kind: z.enum(["factory", "example"]),
    sources: z.array(sourceSchema),
    published: z.boolean(),
    selectable: z.boolean(),
    items: z.array(itemSchema).max(slots.length),
  })
  .superRefine((preset, ctx) => {
    if (new Set(preset.items.map((i) => i.slot)).size !== preset.items.length)
      ctx.addIssue({
        code: "custom",
        path: ["items"],
        message: "Solo se admite una pieza por posición",
      });
    if (preset.published && preset.items.length !== slots.length)
      ctx.addIssue({
        code: "custom",
        path: ["items"],
        message: "Completa todas las posiciones antes de publicar",
      });
    if (preset.published && preset.kind === "factory" && !preset.sources.length)
      ctx.addIssue({
        code: "custom",
        path: ["sources"],
        message: "Añade la fuente del montaje de fábrica",
      });
  });
export const presetImportSchema = z
  .strictObject({ presets: z.array(presetSchema) })
  .superRefine(({ presets }, ctx) => {
    if (
      new Set(presets.map((p) => p.id)).size !== presets.length ||
      new Set(presets.map((p) => p.slug)).size !== presets.length
    )
      ctx.addIssue({
        code: "custom",
        message: "Las referencias no pueden repetir identidad o enlace",
      });
  });
