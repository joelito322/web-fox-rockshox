import { z } from "zod";
import { modelProfileKeys } from "./visual-profiles.ts";
export const proceduralGeneratorKeys = [
  "atlas-bike-v1",
  "atlas-bike-v2",
  "atlas-bike-v3",
  "atlas-bike-v4",
  "atlas-bike-v5",
  "atlas-bike-v6",
  "atlas-bike-v7",
] as const;
export type ProceduralGeneratorKey = (typeof proceduralGeneratorKeys)[number];
export function knownProceduralGenerator(
  key: string | null | undefined,
): key is ProceduralGeneratorKey {
  return proceduralGeneratorKeys.some((value) => value === key);
}
const coordinate = z.number().min(-5).max(5);
const angle = z
  .number()
  .min(-2 * Math.PI)
  .max(2 * Math.PI);
export const manifestSchema = z.strictObject({
  manifest_version: z.literal(1),
  units: z.literal("meters"),
  origin: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z][a-z0-9_]*$/),
  parameters: z
    .strictObject({
      size_scale: z.number().min(0.7).max(1.4).optional(),
      profile_key: z.enum(modelProfileKeys).optional(),
      assembly_version: z.literal("atlas-assembly-v5").optional(),
      mount_space: z.enum(["frame", "fork", "shock"]).optional(),
    })
    .default({}),
  anchors: z
    .record(
      z.string().regex(/^[a-z][a-z0-9_]*$/),
      z.strictObject({
        position: z.tuple([coordinate, coordinate, coordinate]),
        rotation: z.tuple([angle, angle, angle]),
        estimated: z.boolean(),
      }),
    )
    .default({}),
  paintable_nodes: z.array(z.string().min(1).max(150)).max(128).default([]),
  selectable_nodes: z.array(z.string().min(1).max(150)).max(128).default([]),
});
