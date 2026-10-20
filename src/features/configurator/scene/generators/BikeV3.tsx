import Decal from "./v3/Decal";
import { useEffect, useMemo } from "react";
import type { Configuration, Slot, VariantMap } from "../../model";
import { assemblyV2, resolveAssembly } from "../../model/assemblyV2";
import { MeshBuilder } from "./v3/mesh";
import { buildFrame } from "./v3/frames";
import { buildFork, buildShock } from "./v3/suspension";
import { buildTire, buildRim, buildHub, buildRotor, mm } from "./v3/wheels";
import {
  buildCassette,
  buildCranks,
  buildPedals,
  buildDerailleur,
  buildChain,
} from "./v3/drivetrain";
import { buildBrake, buildControls } from "./v3/controls";
import { modelProfiles } from "../../../catalog/model/visual-profiles";
import type { SelectedVariant } from "../../../catalog/model";
import type { AssemblyV2 } from "../../model/assemblyV2";
export function buildModel(
  slot: Slot,
  variant: SelectedVariant,
  a: AssemblyV2,
  get: (s: Slot) => SelectedVariant | undefined,
  color: string,
  builder: MeshBuilder = new MeshBuilder(),
) {
  const key = variant.visual_assets?.manifest.parameters.profile_key;
  if (!key || modelProfiles[key] !== variant.component.category)
    throw Error("invalid_visual_profile");
  const b = builder,
    category = variant.component.category,
    at = slot.startsWith("front") ? a.front : a.rear;
  switch (category) {
    case "frame":
      buildFrame(b, key, a, color);
      break;
    case "fork":
      buildFork(b, key, variant, a, color);
      break;
    case "shock":
      buildShock(b, key, variant, a, color);
      break;
    case "rim":
      buildRim(b, variant, at);
      break;
    case "tire":
      buildTire(b, key, variant, at);
      break;
    case "hub":
      buildHub(b, variant, at, color);
      break;
    case "rotor":
      buildRotor(b, key, variant, at);
      break;
    case "brake":
      buildBrake(
        b,
        key,
        variant,
        a,
        slot.startsWith("front"),
        color,
        mm(get("handlebar")?.specs.width_mm, 0.78),
      );
      break;
    case "cassette":
      buildCassette(b, key, variant, a);
      break;
    case "crankset":
      buildCranks(b, key, variant, color);
      break;
    case "pedals":
      buildPedals(b, variant, get("crankset"), color);
      break;
    case "rear_derailleur":
      buildDerailleur(b, key, variant, a, color);
      break;
    case "chain":
      buildChain(
        b,
        a,
        get("crankset"),
        get("cassette"),
        get("rear_derailleur"),
      );
      break;
    default:
      buildControls(b, category, variant, a, color);
  }
  const result = b.finish();
  if (!result.length) throw Error("empty_visual_profile");
  return result;
}
export default function BikeV3({
  slot,
  color,
  configuration,
  variants,
  onSelect,
  Builder = MeshBuilder,
}: {
  slot: Slot;
  color: string;
  configuration: Configuration;
  variants: VariantMap;
  onSelect: (slot: Slot) => void;
  Builder?: typeof MeshBuilder;
}) {
  const mountingKey = configuration.items
    .map((i) => `${i.slot}:${i.variantId}`)
    .join("|");
  const resolve = () => ({
    ...assemblyV2(configuration, variants),
    ...resolveAssembly(configuration, variants),
  });
  const surfaces = useMemo(() => {
    const get = (s: Slot) =>
      variants[configuration.items.find((i) => i.slot === s)?.variantId ?? ""];
    const variant = get(slot);
    return variant
      ? buildModel(slot, variant, resolve(), get, color, new Builder())
      : [];
    // Color/name edits in other slots do not rebuild every detailed mesh.
  }, [slot, color, mountingKey, variants, Builder]);
  useEffect(
    () => () => surfaces.forEach((s) => s.geometry.dispose()),
    [surfaces],
  );
  const get = (s: Slot) =>
    variants[configuration.items.find((i) => i.slot === s)?.variantId ?? ""];
  const v = get(slot),
    a = resolve(),
    key = v?.visual_assets?.manifest.parameters.profile_key ?? "";
  const brands: Record<string, string> = {
    commencal: "COMMENCAL",
    santa: "SANTA CRUZ",
    canyon: "CANYON",
    specialized: "SPECIALIZED",
    da: "DA BOMB",
    scott: "SCOTT",
    trek: "TREK",
  };
  const brand = brands[key.split("-")[0]] ?? "";
  const forkText = key.startsWith("fox-40")
    ? "FOX 40"
    : key.startsWith("fox-38")
      ? "FOX 38"
      : key.startsWith("ohlins")
        ? "ÖHLINS"
        : key.startsWith("rockshox")
          ? "ZEB"
          : "BOMBER";
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
      {slot === "frame" && (
        <Decal
          text={brand}
          at={[a.lower[0] * 0.64, a.lower[1] * 0.62, 0.038]}
          length={0.23}
          angle={Math.atan2(a.lower[1], a.lower[0])}
        />
      )}
      {slot === "fork" && (
        <Decal
          text={forkText}
          at={[
            a.front[0] + (a.lower[0] - a.front[0]) * 0.4 + 0.014,
            a.front[1] + (a.lower[1] - a.front[1]) * 0.4,
            0.094,
          ]}
          length={0.11}
          angle={Math.atan2(a.lower[1] - a.front[1], a.lower[0] - a.front[0])}
          light
        />
      )}
    </group>
  );
}
