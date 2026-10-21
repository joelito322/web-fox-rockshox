import { useEffect, useMemo } from "react";
import type { ComponentProps } from "react";
import BikeV5 from "./BikeV5";
import { assemblyV2, resolveAssembly } from "../../model/assemblyV2";
import { brake } from "./v6/brake";
import { mm } from "./v3/wheels";

// Only the brake resources changed procedurally. Other slots keep their frozen renderers.
export default function BikeV6({
  slot,
  color,
  configuration,
  variants,
  onSelect,
  completeBody = false,
}: ComponentProps<typeof BikeV5> & { completeBody?: boolean }) {
  const mountingKey = configuration.items
    .map((i) => `${i.slot}:${i.variantId}`)
    .join("|");
  const surfaces = useMemo(() => {
    const variant =
      variants[
        configuration.items.find((i) => i.slot === slot)?.variantId ?? ""
      ];
    if (!variant) return [];
    const profile = variant.visual_assets?.manifest.parameters.profile_key;
    if (!profile || variant.component.category !== "brake")
      throw Error("invalid_v6_brake_profile");
    const handlebar =
      variants[
        configuration.items.find((i) => i.slot === "handlebar")?.variantId ?? ""
      ];
    const assembly = {
      ...assemblyV2(configuration, variants),
      ...resolveAssembly(configuration, variants),
    };
    return brake(
      profile,
      variant,
      assembly,
      slot.startsWith("front"),
      color,
      mm(handlebar?.specs.width_mm, 0.78),
      completeBody,
    );
  }, [slot, color, mountingKey, variants, completeBody]);
  useEffect(
    () => () => surfaces.forEach((s) => s.geometry.dispose()),
    [surfaces],
  );
  return (
    <group
      onClick={(event) => {
        event.stopPropagation();
        onSelect(slot);
      }}
    >
      {surfaces.map((surface, index) => (
        <mesh key={index} geometry={surface.geometry} castShadow>
          <meshStandardMaterial
            color={surface.color}
            roughness={surface.roughness}
            metalness={surface.metalness}
            side={2}
          />
        </mesh>
      ))}
    </group>
  );
}
