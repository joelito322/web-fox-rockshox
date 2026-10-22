import framesV30 from "../../supabase/catalog/frames-v30-reviewed.json";
import frameMappingV30 from "../../supabase/catalog/frames-v30-successors.json";
import framesV29 from "../../supabase/catalog/frames-v29-reviewed.json";
import frameMappingV29 from "../../supabase/catalog/frames-v29-successors.json";
import framesV28 from "../../supabase/catalog/frames-v28-reviewed.json";
import frameMappingV28 from "../../supabase/catalog/frames-v28-successors.json";
import framesV27 from "../../supabase/catalog/frames-v27-reviewed.json";
import frameMappingV27 from "../../supabase/catalog/frames-v27-successors.json";
import framesV26 from "../../supabase/catalog/frames-v26-reviewed.json";
import frameMappingV26 from "../../supabase/catalog/frames-v26-successors.json";
import framesV25 from "../../supabase/catalog/frames-v25-reviewed.json";
import frameMappingV25 from "../../supabase/catalog/frames-v25-successors.json";
import framesV24 from "../../supabase/catalog/frames-v24-reviewed.json";
import frameMappingV24 from "../../supabase/catalog/frames-v24-successors.json";
import framesV23 from "../../supabase/catalog/frames-v23-reviewed.json";
import frameMappingV23 from "../../supabase/catalog/frames-v23-successors.json";
import framesV22 from "../../supabase/catalog/frames-v22-reviewed.json";
import frameMappingV22 from "../../supabase/catalog/frames-v22-successors.json";
import framesV21 from "../../supabase/catalog/frames-v21-reviewed.json";
import frameMappingV21 from "../../supabase/catalog/frames-v21-successors.json";
import framesV20 from "../../supabase/catalog/frames-v20-reviewed.json";
import frameMappingV20 from "../../supabase/catalog/frames-v20-successors.json";
import framesV19 from "../../supabase/catalog/frames-v19-reviewed.json";
import frameMappingV19 from "../../supabase/catalog/frames-v19-successors.json";
import framesV18 from "../../supabase/catalog/frames-v18-reviewed.json";
import frameMappingV18 from "../../supabase/catalog/frames-v18-successors.json";
import framesV17 from "../../supabase/catalog/frames-v17-reviewed.json";
import frameMappingV17 from "../../supabase/catalog/frames-v17-successors.json";
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
import framesV16 from "../../supabase/catalog/frames-v16-reviewed.json";
import frameMappingV16 from "../../supabase/catalog/frames-v16-successors.json";
import framesV15 from "../../supabase/catalog/frames-v15-reviewed.json";
import frameMappingV15 from "../../supabase/catalog/frames-v15-successors.json";
import framesV14 from "../../supabase/catalog/frames-v14-reviewed.json";
import frameMappingV14 from "../../supabase/catalog/frames-v14-successors.json";
import framesV13 from "../../supabase/catalog/frames-v13-reviewed.json";
import frameMappingV13 from "../../supabase/catalog/frames-v13-successors.json";
import framesV12 from "../../supabase/catalog/frames-v12-reviewed.json";
import frameMappingV12 from "../../supabase/catalog/frames-v12-successors.json";
import framesV11 from "../../supabase/catalog/frames-v11-reviewed.json";
import frameMappingV11 from "../../supabase/catalog/frames-v11-successors.json";
import framesV10 from "../../supabase/catalog/frames-v10-reviewed.json";
import frameMapping from "../../supabase/catalog/frames-v10-successors.json";
import examples from "../../supabase/catalog/visual-v7-examples.json";
const sources = [old, gravity].map(parseCatalogImport);
if (new URLSearchParams(location.search).get("version") !== "previous") {
  const reviewed = parseCatalogImport(framesV10);
  for (const source of sources) {
    source.variants = source.variants.map(
      (v) =>
        reviewed.variants.find(
          (n) => n.id === frameMapping[v.id as keyof typeof frameMapping],
        ) ?? v,
    );
    source.assets.push(...reviewed.assets);
  }
}
if (
  !["previous", "v10"].includes(
    new URLSearchParams(location.search).get("version") ?? "",
  )
) {
  const reviewed = parseCatalogImport(framesV11);
  for (const source of sources) {
    source.variants = source.variants.map(
      (v) =>
        reviewed.variants.find(
          (n) => n.id === frameMappingV11[v.id as keyof typeof frameMappingV11],
        ) ?? v,
    );
    source.assets.push(...reviewed.assets);
  }
}
if (new URLSearchParams(location.search).get("version") === "v12") {
  const reviewed = parseCatalogImport(framesV12);
  for (const source of sources) {
    source.variants = source.variants.map(
      (v) =>
        reviewed.variants.find(
          (n) => n.id === frameMappingV12[v.id as keyof typeof frameMappingV12],
        ) ?? v,
    );
    source.assets.push(...reviewed.assets);
  }
}
if (
  !["previous", "v10", "v11", "v12"].includes(
    new URLSearchParams(location.search).get("version") ?? "",
  )
) {
  const reviewed = parseCatalogImport(framesV13);
  for (const source of sources) {
    source.variants = source.variants.map(
      (v) =>
        reviewed.variants.find(
          (n) => n.id === frameMappingV13[v.id as keyof typeof frameMappingV13],
        ) ?? v,
    );
    source.assets.push(...reviewed.assets);
  }
}
if (
  !["previous", "v10", "v11", "v12", "v13"].includes(
    new URLSearchParams(location.search).get("version") ?? "",
  )
) {
  const reviewed = parseCatalogImport(framesV14);
  for (const source of sources) {
    source.variants = source.variants.map(
      (v) =>
        reviewed.variants.find(
          (n) => n.id === frameMappingV14[v.id as keyof typeof frameMappingV14],
        ) ?? v,
    );
    source.assets.push(...reviewed.assets);
  }
}
if (
  !["previous", "v10", "v11", "v12", "v13", "v14"].includes(
    new URLSearchParams(location.search).get("version") ?? "",
  )
) {
  const reviewed = parseCatalogImport(framesV15);
  for (const source of sources) {
    source.variants = source.variants.map(
      (v) =>
        reviewed.variants.find(
          (n) => n.id === frameMappingV15[v.id as keyof typeof frameMappingV15],
        ) ?? v,
    );
    source.assets.push(...reviewed.assets);
  }
}
if (
  !["previous", "v10", "v11", "v12", "v13", "v14", "v15"].includes(
    new URLSearchParams(location.search).get("version") ?? "",
  )
) {
  const reviewed = parseCatalogImport(framesV16);
  for (const source of sources) {
    source.variants = source.variants.map(
      (v) =>
        reviewed.variants.find(
          (n) => n.id === frameMappingV16[v.id as keyof typeof frameMappingV16],
        ) ?? v,
    );
    source.assets.push(...reviewed.assets);
  }
}
if (
  !["previous", "v10", "v11", "v12", "v13", "v14", "v15", "v16"].includes(
    new URLSearchParams(location.search).get("version") ?? "",
  )
) {
  const reviewed = parseCatalogImport(framesV17);
  for (const source of sources) {
    source.variants = source.variants.map(
      (v) =>
        reviewed.variants.find(
          (n) => n.id === frameMappingV17[v.id as keyof typeof frameMappingV17],
        ) ?? v,
    );
    source.assets.push(...reviewed.assets);
  }
}
if (
  ![
    "previous",
    "v10",
    "v11",
    "v12",
    "v13",
    "v14",
    "v15",
    "v16",
    "v17",
  ].includes(new URLSearchParams(location.search).get("version") ?? "")
) {
  const reviewed = parseCatalogImport(framesV18);
  for (const source of sources) {
    source.variants = source.variants.map(
      (v) =>
        reviewed.variants.find(
          (n) => n.id === frameMappingV18[v.id as keyof typeof frameMappingV18],
        ) ?? v,
    );
    source.assets.push(...reviewed.assets);
  }
}
if (
  ![
    "previous",
    "v10",
    "v11",
    "v12",
    "v13",
    "v14",
    "v15",
    "v16",
    "v17",
    "v18",
  ].includes(new URLSearchParams(location.search).get("version") ?? "")
) {
  const reviewed = parseCatalogImport(framesV19);
  for (const source of sources) {
    source.variants = source.variants.map(
      (v) =>
        reviewed.variants.find(
          (n) => n.id === frameMappingV19[v.id as keyof typeof frameMappingV19],
        ) ?? v,
    );
    source.assets.push(...reviewed.assets);
  }
}
if (
  ![
    "previous",
    "v10",
    "v11",
    "v12",
    "v13",
    "v14",
    "v15",
    "v16",
    "v17",
    "v18",
    "v19",
  ].includes(new URLSearchParams(location.search).get("version") ?? "")
) {
  const reviewed = parseCatalogImport(framesV20);
  for (const source of sources) {
    source.variants = source.variants.map(
      (v) =>
        reviewed.variants.find(
          (n) => n.id === frameMappingV20[v.id as keyof typeof frameMappingV20],
        ) ?? v,
    );
    source.assets.push(...reviewed.assets);
  }
}
if (
  ![
    "previous",
    "v10",
    "v11",
    "v12",
    "v13",
    "v14",
    "v15",
    "v16",
    "v17",
    "v18",
    "v19",
    "v20",
  ].includes(new URLSearchParams(location.search).get("version") ?? "")
) {
  const reviewed = parseCatalogImport(framesV21);
  for (const source of sources) {
    source.variants = source.variants.map(
      (v) =>
        reviewed.variants.find(
          (n) => n.id === frameMappingV21[v.id as keyof typeof frameMappingV21],
        ) ?? v,
    );
    source.assets.push(...reviewed.assets);
  }
}
if (
  ![
    "previous",
    "v10",
    "v11",
    "v12",
    "v13",
    "v14",
    "v15",
    "v16",
    "v17",
    "v18",
    "v19",
    "v20",
    "v21",
  ].includes(new URLSearchParams(location.search).get("version") ?? "")
) {
  const reviewed = parseCatalogImport(framesV22);
  for (const source of sources) {
    source.variants = source.variants.map(
      (v) =>
        reviewed.variants.find(
          (n) => n.id === frameMappingV22[v.id as keyof typeof frameMappingV22],
        ) ?? v,
    );
    source.assets.push(...reviewed.assets);
  }
}
if (
  ![
    "previous",
    "v10",
    "v11",
    "v12",
    "v13",
    "v14",
    "v15",
    "v16",
    "v17",
    "v18",
    "v19",
    "v20",
    "v21",
    "v22",
  ].includes(new URLSearchParams(location.search).get("version") ?? "")
) {
  const reviewed = parseCatalogImport(framesV23);
  for (const source of sources) {
    source.variants = source.variants.map(
      (v) =>
        reviewed.variants.find(
          (n) => n.id === frameMappingV23[v.id as keyof typeof frameMappingV23],
        ) ?? v,
    );
    source.assets.push(...reviewed.assets);
  }
}
if (
  ![
    "previous",
    "v10",
    "v11",
    "v12",
    "v13",
    "v14",
    "v15",
    "v16",
    "v17",
    "v18",
    "v19",
    "v20",
    "v21",
    "v22",
    "v23",
  ].includes(new URLSearchParams(location.search).get("version") ?? "")
) {
  const reviewed = parseCatalogImport(framesV24);
  for (const source of sources) {
    source.variants = source.variants.map(
      (v) =>
        reviewed.variants.find(
          (n) => n.id === frameMappingV24[v.id as keyof typeof frameMappingV24],
        ) ?? v,
    );
    source.assets.push(...reviewed.assets);
  }
}
if (
  ![
    "previous",
    "v10",
    "v11",
    "v12",
    "v13",
    "v14",
    "v15",
    "v16",
    "v17",
    "v18",
    "v19",
    "v20",
    "v21",
    "v22",
    "v23",
    "v24",
  ].includes(new URLSearchParams(location.search).get("version") ?? "")
) {
  const reviewed = parseCatalogImport(framesV25);
  for (const source of sources) {
    source.variants = source.variants.map(
      (v) =>
        reviewed.variants.find(
          (n) => n.id === frameMappingV25[v.id as keyof typeof frameMappingV25],
        ) ?? v,
    );
    source.assets.push(...reviewed.assets);
  }
}
if (
  ![
    "previous",
    ...Array.from({ length: 16 }, (_, i) => "v" + (i + 10)),
  ].includes(new URLSearchParams(location.search).get("version") ?? "")
) {
  const reviewed = parseCatalogImport(framesV26);
  for (const source of sources) {
    source.variants = source.variants.map(
      (v) =>
        reviewed.variants.find(
          (n) => n.id === frameMappingV26[v.id as keyof typeof frameMappingV26],
        ) ?? v,
    );
    source.assets.push(...reviewed.assets);
  }
}
if (
  ![
    "previous",
    ...Array.from({ length: 17 }, (_, i) => "v" + (i + 10)),
  ].includes(new URLSearchParams(location.search).get("version") ?? "")
) {
  const reviewed = parseCatalogImport(framesV27);
  for (const source of sources) {
    source.variants = source.variants.map(
      (v) =>
        reviewed.variants.find(
          (n) => n.id === frameMappingV27[v.id as keyof typeof frameMappingV27],
        ) ?? v,
    );
    source.assets.push(...reviewed.assets);
  }
}
if (
  ![
    "previous",
    ...Array.from({ length: 18 }, (_, i) => "v" + (i + 10)),
  ].includes(new URLSearchParams(location.search).get("version") ?? "")
) {
  const reviewed = parseCatalogImport(framesV28);
  for (const source of sources) {
    source.variants = source.variants.map(
      (v) =>
        reviewed.variants.find(
          (n) => n.id === frameMappingV28[v.id as keyof typeof frameMappingV28],
        ) ?? v,
    );
    source.assets.push(...reviewed.assets);
  }
}
if (
  ![
    "previous",
    ...Array.from({ length: 19 }, (_, i) => "v" + (i + 10)),
  ].includes(new URLSearchParams(location.search).get("version") ?? "")
) {
  const reviewed = parseCatalogImport(framesV29);
  for (const source of sources) {
    source.variants = source.variants.map(
      (v) =>
        reviewed.variants.find(
          (n) => n.id === frameMappingV29[v.id as keyof typeof frameMappingV29],
        ) ?? v,
    );
    source.assets.push(...reviewed.assets);
  }
}
if (!['previous',...Array.from({length:20},(_,i)=>'v'+(i+10))].includes(new URLSearchParams(location.search).get('version')??'')) {
 const reviewed=parseCatalogImport(framesV30);
 for(const source of sources){source.variants=source.variants.map(v=>reviewed.variants.find(n=>n.id===frameMappingV30[v.id as keyof typeof frameMappingV30])??v);source.assets.push(...reviewed.assets);}
}
const models = sources.flatMap((s) => s.components),
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
            Object.assign(latestControls.current.inspection.state, {
              front,
              rear,
              playing: false,
            });
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
                const out: {
                  name: string;
                  matrix: number[];
                  scale: number[];
                }[] = [];
                c.traverse((n) => {
                  if (n.name.startsWith("motion_") && n instanceof T.Group)
                    out.push({
                      name: n.name,
                      matrix: n.matrixWorld.toArray(),
                      scale: n.scale.toArray(),
                    });
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
