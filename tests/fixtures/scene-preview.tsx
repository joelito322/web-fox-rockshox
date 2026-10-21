import { createRoot } from "react-dom/client";
import { Suspense, useState } from "react";
import Scene, {
  prepareVisual,
} from "../../src/features/configurator/scene/BikeScene";
import { parseCatalogImport } from "../../src/features/catalog/model/ingestion";
import { presetImportSchema } from "../../src/features/catalog/model/presets";
import {
  slotCategories,
  slotLabels,
  type Slot,
} from "../../src/features/configurator/model";
import type {
  VariantMap,
  Configuration,
} from "../../src/features/configurator/model";
import source from "../../supabase/catalog/initial-reviewed.json";
import examples from "../../supabase/catalog/enduro-examples.json";
import downhill from "../../supabase/catalog/downhill-examples.json";
import braking from "../../supabase/catalog/braking-reviewed.json";
import suspension from "../../supabase/catalog/suspension-reviewed.json";
import frames from "../../supabase/catalog/frames-reviewed.json";
import tyres from "../../supabase/catalog/tyres-reviewed.json";
import catalogV7 from "../../supabase/catalog/visual-v7-reviewed.json";
import examplesV7 from "../../supabase/catalog/visual-v7-examples.json";
import catalogV6 from "../../supabase/catalog/visual-v6-reviewed.json";
import examplesV6 from "../../supabase/catalog/visual-v6-examples.json";
import catalogV5 from "../../supabase/catalog/visual-v5-reviewed.json";
import examplesV5 from "../../supabase/catalog/visual-v5-examples.json";
import catalogV4 from "../../supabase/catalog/visual-v4-reviewed.json";
import examplesV4 from "../../supabase/catalog/visual-v4-examples.json";
const generation = new URLSearchParams(location.search).get("generation");
const v5 = generation === "v5";
const v6 = generation === "v6";
const v7 = generation === "v7";
const visualCatalog = v7
  ? catalogV7
  : v6
    ? catalogV6
    : v5
      ? catalogV5
      : catalogV4;
const visualExamples = v7
  ? examplesV7
  : v6
    ? examplesV6
    : v5
      ? examplesV5
      : examplesV4;
const legacy = new URLSearchParams(location.search).has("legacy");
const catalogue = parseCatalogImport(
  legacy
    ? {
        brands: [
          ...new Map(
            [
              ...source.brands,
              ...braking.brands,
              ...suspension.brands,
              ...frames.brands,
              ...tyres.brands,
            ].map((b) => [b.id, b]),
          ).values(),
        ],
        components: [
          ...source.components,
          ...braking.components,
          ...suspension.components,
          ...frames.components,
          ...tyres.components,
        ],
        assets: [
          ...source.assets,
          ...braking.assets,
          ...suspension.assets,
          ...frames.assets,
          ...tyres.assets,
        ],
        variants: [
          ...source.variants,
          ...braking.variants,
          ...suspension.variants,
          ...frames.variants,
          ...tyres.variants,
        ],
      }
    : visualCatalog,
);
const params = new URLSearchParams(location.search);
const discipline =
  params.get("discipline") === "downhill" ? "downhill" : "enduro";
const presets = presetImportSchema.parse(
  legacy
    ? discipline === "downhill"
      ? downhill
      : examples
    : {
        presets: visualExamples.presets.filter((p) =>
          discipline === "downhill"
            ? p.slug.includes("supreme")
            : p.slug.includes("meta"),
        ),
      },
).presets;
const index = new URLSearchParams(location.search).get("size") === "L" ? 1 : 0;
const preset = presets[index];
const configuration: Configuration = {
  schemaVersion: 1,
  name: preset.name,
  items: preset.items.map((item) => ({ ...item })),
};
const reviewedVariant = catalogue.variants.find(
  (v) => v.id === params.get("variant"),
);
if (reviewedVariant) {
  const model = catalogue.components.find(
    (c) => c.id === reviewedVariant.component_id,
  )!;
  const item = configuration.items.find(
    (i) => slotCategories[i.slot] === model.category,
  );
  if (item) {
    item.variantId = reviewedVariant.id;
    item.finishId = reviewedVariant.allowed_finishes.default_finish_id;
  }
}
for (const [key, positions] of [
  ["brake", ["front_brake", "rear_brake"]],
  ["rotor", ["front_rotor", "rear_rotor"]],
] as const) {
  const model = catalogue.components.find((c) => c.slug === params.get(key));
  if (!model) continue;
  const choices = catalogue.variants.filter((v) => v.component_id === model.id);
  const choice =
    key === "rotor"
      ? (choices.find((v) => v.specs.rotor_diameter_mm === 203) ?? choices[0])
      : choices[0];
  for (const item of configuration.items)
    if ((positions as readonly string[]).includes(item.slot)) {
      item.variantId = choice.id;
      item.finishId = choice.allowed_finishes.default_finish_id;
    }
}
const variants: VariantMap = {};
for (const item of configuration.items) {
  const variant = catalogue.variants.find((v) => v.id === item.variantId)!;
  const component = catalogue.components.find(
    (c) => c.id === variant.component_id,
  )!;
  const brand = catalogue.brands.find((b) => b.id === component.brand_id)!;
  const asset = catalogue.assets.find((a) => a.id === variant.visual_asset_id)!;
  // Internal visual review of draft resources; these flags never enter an import payload.
  variants[variant.id] = {
    ...variant,
    visual_assets: { ...asset, published: true },
    component: { ...component, brands: brand },
  };
}
await Promise.all(
  Object.values(variants).map((v) => prepareVisual(v.visual_assets!)),
);
function Proof() {
  const [view, setView] = useState("lateral");
  const [selectedSlot, setSelectedSlot] = useState<Slot>();
  const [renderConfiguration, setRenderConfiguration] = useState(configuration);
  return (
    <>
      <div className="proof-label">
        <strong>ATLAS MTB · Revisión de montaje {preset.label}</strong>
        {reviewedVariant && <div>{reviewedVariant.label}</div>}
        <p>
          Composición documentada de 23 posiciones. Auxiliares ATLAS
          identificados; representación aproximada. Composición propia de ATLAS,
          sin atribución a un montaje de fábrica.
        </p>
        <select
          aria-label="Cámara de revisión"
          value={view}
          onChange={(event) => setView(event.target.value)}
        >
          {["lateral", "perspectiva", "frontal", "superior"].map((camera) => (
            <option key={camera}>{camera}</option>
          ))}
        </select>
        {params.has("controls") && (
          <>
            <button
              onClick={() =>
                setRenderConfiguration({
                  ...configuration,
                  items: configuration.items.filter(
                    (i) => i.slot !== "front_tire",
                  ),
                })
              }
            >
              Retirar neumático
            </button>
            <button onClick={() => setRenderConfiguration(configuration)}>
              Restaurar montaje
            </button>
          </>
        )}
        <output aria-label="Pieza seleccionada">
          {selectedSlot ? slotLabels[selectedSlot] : "Sin selección"}
        </output>
        <a
          href={`?discipline=${discipline}&size=${index ? "M" : "L"}&generation=${v7 ? "v7" : v6 ? "v6" : v5 ? "v5" : "v4"}${legacy ? "&legacy=1" : ""}`}
        >
          Cambiar talla
        </a>
        <a
          href={`?discipline=${discipline === "downhill" ? "enduro" : "downhill"}&generation=${v7 ? "v7" : v6 ? "v6" : v5 ? "v5" : "v4"}${legacy ? "&legacy=1" : ""}`}
        >
          Cambiar disciplina
        </a>
      </div>
      <Suspense fallback={null}>
        <Scene
          configuration={renderConfiguration}
          variants={variants}
          view={view}
          onSelect={setSelectedSlot}
          selectedSlot={selectedSlot}
          onUnavailable={() => {
            throw new Error("Scene unavailable");
          }}
        />
      </Suspense>
    </>
  );
}
createRoot(document.getElementById("root")!).render(<Proof />);
