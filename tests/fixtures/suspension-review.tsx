import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import * as T from "three";
import Scene, {
  prepareVisual,
} from "../../src/features/configurator/scene/BikeScene";
import {
  useSuspensionInspection,
  SuspensionControls,
} from "../../src/features/configurator/SuspensionControls";
import { parseCatalogImport } from "../../src/features/catalog/model/ingestion";
import { selectVariant } from "../../src/features/catalog/model";
import type {
  Configuration,
  Slot,
  VariantMap,
} from "../../src/features/configurator/model";
import old from "../../supabase/catalog/visual-v7-reviewed.json";
import gravity from "../../supabase/catalog/gravity-reviewed.json";
import examples from "../../supabase/catalog/visual-v7-examples.json";
const sources = [old, gravity].map(parseCatalogImport),
  models = sources.flatMap((s) => s.components),
  variants = sources.flatMap((s) => s.variants),
  assets = sources.flatMap((s) => s.assets),
  brands = sources.flatMap((s) => s.brands);
const byId: VariantMap = Object.fromEntries(
  variants.map((v) => {
    const c = models.find((c) => c.id === v.component_id)!;
    return [
      v.id,
      selectVariant(
        {
          ...c,
          brands: brands.find((b) => b.id === c.brand_id)!,
          component_variants: [],
        },
        {
          ...v,
          visual_assets: assets.find((a) => a.id === v.visual_asset_id)!,
        },
      ),
    ];
  }),
);
const frames = models.filter((c) => c.category === "frame");
const scenes: T.Scene[] = [];
(window as any).atlasMotionScenes = scenes;
(window as any).__THREE_DEVTOOLS__ = {
  dispatchEvent(event: { detail: unknown }) {
    if (event.detail instanceof T.Scene) scenes.push(event.detail);
  },
};
function Review() {
  const params = new URLSearchParams(location.search);
  const [forkSlug, setForkSlug] = useState(""),
    [shockSlug, setShockSlug] = useState("");
  const [slug, setSlug] = useState(params.get("model") ?? frames[0].slug),
    [view, setView] = useState(params.get("view") ?? "lateral"),
    [readyFor, setReadyFor] = useState("");
  const configuration = useMemo(() => {
    const frame = models.find((m) => m.slug === slug)!,
      choice = variants.find(
        (v) => v.component_id === frame.id && v.published && v.selectable,
      )!;
    const preset =
      examples.presets.find((p) =>
        p.name.includes(
          frame.disciplines.includes("downhill") ? "SUPREME" : "META",
        ),
      ) ?? examples.presets[0];
    const items = structuredClone(preset.items).map((i) => ({
      slot: i.slot as Slot,
      variantId: i.slot === "frame" ? choice.id : i.variantId,
      finishId:
        i.slot === "frame"
          ? choice.allowed_finishes.default_finish_id
          : i.finishId,
      customColor: i.customColor,
    }));
    for (const [slot, slug] of [
      ["fork", forkSlug],
      ["shock", shockSlug],
    ]) {
      if (!slug) continue;
      const model = models.find((m) => m.slug === slug)!;
      const choices = variants.filter(
        (v) => v.component_id === model.id && v.published && v.selectable,
      );
      const fit = choice.specs.shock_fit as
        | { eye_to_eye_mm?: number; stroke_mm?: number }
        | undefined;
      const selected =
        (slot === "shock"
          ? choices.find(
              (v) =>
                v.specs.eye_to_eye_mm === fit?.eye_to_eye_mm &&
                v.specs.stroke_mm === fit?.stroke_mm,
            )
          : undefined) ?? choices[0];
      const item = items.find((i) => i.slot === slot)!;
      item.variantId = selected.id;
      item.finishId = selected.allowed_finishes.default_finish_id;
    }
    return { schemaVersion: 1, name: "Motion review", items } as Configuration;
  }, [slug, forkSlug, shockSlug]);
  const selection = useMemo(
    () =>
      Object.fromEntries(
        configuration.items.map((i) => [i.variantId, byId[i.variantId]]),
      ),
    [configuration],
  );
  const signature = configuration.items.map((i) => i.variantId).join(":");
  const ready = readyFor === signature;
  const controls = useSuspensionInspection(configuration, selection);
  const latestControls = useRef(controls);
  latestControls.current = controls;
  useEffect(() => {
    let active = true;
    setReadyFor("");
    Promise.all(
      Object.values(selection).map((v) => prepareVisual(v.visual_assets!)),
    ).then(() => {
      if (active) setReadyFor(signature);
    });
    return () => {
      active = false;
    };
  }, [selection]);
  useEffect(() => {
    (window as any).atlasMotionReview = {
      ready,
      slug,
      fork: forkSlug,
      shock: shockSlug,
      definition: controls.definition
        ? {
            angle: controls.definition.maxAngle,
            available: controls.definition.rearAvailable,
            architecture: controls.definition.architecture,
          }
        : null,
      setModel: setSlug,
      setView,
      pose(front: number, rear: number) {
        if (!controls.open) controls.toggle();
        setTimeout(() => {
          controls.change("front", front);
          controls.change("rear", rear);
          // Internal still-pose capture, independent from product playback controls.
          if (latestControls.current.inspection) {
            Object.assign(latestControls.current.inspection.state, { front, rear, playing: false });
            window.dispatchEvent(new Event("atlas:suspension-inspection"));
          }
        }, 0);
      },
      inspect() {
        const scene = scenes.findLast((s) =>
          s.getObjectByName("motion_bicycle"),
        );
        const group = scene?.getObjectByName("motion_bicycle");
        if (!group) return null;
        group.updateWorldMatrix(true, true);
        return {
          rotation: group.rotation.z,
          position: group.position.toArray(),
          parts: group.children
            .filter((p) => p.userData.motionSlot)
            .map((p) => ({
              slot: p.userData.motionSlot,
              position: p.position.toArray(),
              bodies: p.children.flatMap((c) => {
                const out: { name: string; matrix: number[]; scale: number[] }[] = [];
                c.traverse((n) => {
                  if (n.name.startsWith("motion_") && n instanceof T.Group)
                    out.push({ name: n.name, matrix: n.matrixWorld.toArray(), scale: n.scale.toArray() });
                });
                return out;
              }),
            })),
        };
      },
    };
  }, [ready, slug, controls]);
  return (
    <>
      <header>
        <select
          aria-label="Cuadro"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        >
          {frames.map((f) => (
            <option key={f.id} value={f.slug}>
              {f.name}
            </option>
          ))}
        </select>
        {(["fork", "shock"] as const).map((category) => (
          <select
            key={category}
            aria-label={category === "fork" ? "Horquilla" : "Amortiguador"}
            value={category === "fork" ? forkSlug : shockSlug}
            onChange={(e) =>
              (category === "fork" ? setForkSlug : setShockSlug)(e.target.value)
            }
          >
            <option value="">Composición</option>
            {models
              .filter((m) => m.category === category)
              .map((m) => (
                <option key={m.id} value={m.slug}>
                  {m.name}
                </option>
              ))}
          </select>
        ))}
        <select
          aria-label="Cámara"
          value={view}
          onChange={(e) => setView(e.target.value)}
        >
          {["lateral", "perspectiva", "frontal", "superior"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <button onClick={controls.toggle}>Suspensión</button>
        <output>
          {controls.definition?.architecture} ·{" "}
          {Math.round(((controls.definition?.maxAngle ?? 0) * 180) / Math.PI)}°
          · Aproximación exterior
        </output>
      </header>
      <section className="viewer">
        {ready ? (
          <Scene
            configuration={configuration}
            variants={selection}
            onSelect={() => {}}
            onUnavailable={() => {
              throw Error("Motion scene unavailable");
            }}
            view={view}
            inspection={controls.inspection}
          />
        ) : (
          <p>Cargando…</p>
        )}
        <SuspensionControls controls={controls} />
      </section>
    </>
  );
}
createRoot(document.getElementById("root")!).render(<Review />);
