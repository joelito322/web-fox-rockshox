import { useMemo, useEffect } from "react";
import type { ComponentProps } from "react";
import BikeV5 from "./BikeV5";
import { assemblyV2, resolveAssembly } from "../../model/assemblyV2";
import { buildCockpit, isCockpitProfile } from "./v8/cockpit";

/** New commercial cockpit resources only. Versions 1–7 retain their renderers. */
export default function BikeV8({ slot, color, configuration, variants, onSelect }: ComponentProps<typeof BikeV5>) {
  const mountingKey = configuration.items.map(item => `${item.slot}:${item.variantId}`).join("|");
  const surfaces = useMemo(() => {
    const variant = variants[configuration.items.find(item => item.slot === slot)?.variantId ?? ""];
    const profile = variant?.visual_assets?.manifest.parameters.profile_key;
    if (!variant || !isCockpitProfile(profile)) throw new Error("invalid_v8_profile");
    return buildCockpit(profile, variant, { ...assemblyV2(configuration, variants), ...resolveAssembly(configuration, variants) }, color);
  }, [slot, color, mountingKey, variants]);
  useEffect(() => () => surfaces.forEach(surface => surface.geometry.dispose()), [surfaces]);
  return <group onClick={event => { event.stopPropagation(); onSelect(slot); }}>
    {surfaces.map((surface, index) => <mesh key={index} geometry={surface.geometry} castShadow>
      <meshStandardMaterial color={surface.color} roughness={surface.roughness} metalness={surface.metalness} side={2} />
    </mesh>)}
  </group>;
}
