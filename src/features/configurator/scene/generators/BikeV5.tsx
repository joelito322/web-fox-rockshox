import { useEffect, useMemo } from "react";
import type { ComponentProps } from "react";
import BikeV3, { buildModel } from "./BikeV3";
import { SpatialMeshBuilder } from "./v4/mesh";
import { assemblyV2, resolveAssembly } from "../../model/assemblyV2";
import type { Slot } from "../../model";
import {
  brake,
  rotor,
  derailleur,
  cranks,
  tire,
  rim,
  pedals,
} from "./v5/components";
import { mm } from "./v3/wheels";

export default function BikeV5({
  slot,
  color,
  configuration,
  variants,
  onSelect,
}: Omit<ComponentProps<typeof BikeV3>, "Builder">) {
  const mountingKey = configuration.items
    .map((i) => `${i.slot}:${i.variantId}`)
    .join("|");
  const surfaces = useMemo(() => {
    const get = (s: Slot) =>
      variants[configuration.items.find((i) => i.slot === s)?.variantId ?? ""];
    const v = get(slot);
    if (!v) return [];
    const a = {
      ...assemblyV2(configuration, variants),
      ...resolveAssembly(configuration, variants),
    };
    const key = v.visual_assets?.manifest.parameters.profile_key;
    if (!key) throw Error("missing_visual_profile");
    const b = new SpatialMeshBuilder(),
      at = slot.startsWith("front") ? a.front : a.rear;
    switch (v.component.category) {
      case "brake":
        return brake(
          key,
          v,
          a,
          slot.startsWith("front"),
          color,
          mm(get("handlebar")?.specs.width_mm, 0.78),
        );
      case "rotor":
        rotor(b, key, v, at);
        break;
      case "rear_derailleur":
        derailleur(b, key, v, a, color);
        break;
      case "crankset":
        cranks(b, key, v, color);
        break;
      case "tire":
        tire(b, key, v, at);
        break;
      case "rim":
        rim(b, v, at);
        break;
      case "pedals":
        pedals(b, v, get("crankset"), color);
        break;
      default:
        return buildModel(slot, v, a, get, color, b);
    }
    return b.finish();
  }, [slot, color, mountingKey, variants]);
  useEffect(
    () => () => surfaces.forEach((s) => s.geometry.dispose()),
    [surfaces],
  );
  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onSelect(slot);
      }}
    >
      {surfaces.map((s, i) => (
        <mesh key={i} geometry={s.geometry} castShadow>
          <meshStandardMaterial
            color={s.color}
            roughness={s.roughness}
            metalness={s.metalness}
            side={2}
          />
        </mesh>
      ))}
    </group>
  );
}
