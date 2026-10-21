// Assemble new immutable captures from the locally rebuilt/reference-reviewed resource sources.
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { v5 as uuid } from "./lib/uuid.mjs";
import { parseCatalogImport } from "../src/features/catalog/model/ingestion.ts";
const base = JSON.parse(
  readFileSync("supabase/catalog/visual-v5-reviewed.json", "utf8"),
);
const exports = JSON.parse(
  readFileSync("models/catalog-v6/exports/report.json", "utf8"),
);
const oldAssets = new Map(base.assets.map((a) => [a.id, a]));
const models = new Map(base.components.map((m) => [m.id, m]));
const mapping = {},
  uploads = [],
  assets = [];
const ns = "df29e6ee-1845-5df4-80e7-c9f5ac4169c0";
const id = (text) => uuid(text, ns);
const copy = structuredClone(base);
for (const variant of copy.variants) {
  const predecessor = variant.id,
    model = models.get(variant.component_id),
    old = oldAssets.get(variant.visual_asset_id);
  if (!exports[predecessor] && model.category !== "brake") {
    mapping[predecessor] = predecessor;
    assets.push(structuredClone(old));
    continue;
  }
  variant.id = id("variant-v6:" + predecessor);
  mapping[predecessor] = variant.id;
  const asset = structuredClone(old);
  asset.id = id("asset-v6:" + predecessor);
  asset.manifest.parameters = { profile_key: model.slug };
  const source = exports[predecessor];
  if (source) {
    variant.representation = "approximate";
    const file = "models/catalog-v6/exports/" + source.file,
      bytes = readFileSync(file),
      hash = createHash("sha256").update(bytes).digest("hex");
    asset.kind = "glb";
    asset.generator_key = null;
    asset.storage_path = `catalog/v6/${model.slug}/${hash.slice(0, 24)}.glb`;
    asset.manifest.origin =
      model.category === "frame"
        ? "bottom_bracket"
        : model.category === "fork"
          ? "lower_crown"
          : "upper_eye";
    asset.manifest.parameters.mount_space = model.category;
    if (model.category === "frame")
      asset.manifest.parameters.assembly_version = "atlas-assembly-v5";
    asset.manifest.anchors = Object.fromEntries(
      Object.entries(source.anchors).map(([key, position]) => [
        key,
        {
          position,
          rotation: source.anchor_rotations?.[key] ?? [0, 0, 0],
          estimated: true,
        },
      ]),
    );
    if (model.category === "frame") {
      const rear = source.anchors.rear_axle;
      asset.manifest.anchors.front_axle = {
        position: [
          rear[0] + variant.specs.geometry.wheelbase_mm / 1000,
          rear[1] + 0.02,
          0,
        ],
        rotation: [0, 0, 0],
        estimated: true,
      };
    }
    asset.manifest.paintable_nodes = source.paintable_nodes;
    asset.manifest.selectable_nodes = []; // Whole resource selectable by slot, without internal fabrication-level selectors.
    asset.reference_notes = `Exterior multivista v6 de ${model.name}; fuentes y conexiones en models/catalog-v6. Medidas comerciales conservadas. Cierres ocultos inferidos por arquitectura del modelo; sin certificación CAD ni porcentaje de fidelidad.`;
    uploads.push({
      asset_id: asset.id,
      file,
      path: asset.storage_path,
      bytes: bytes.length,
      sha256: hash,
      published: asset.published,
    });
  } else {
    asset.generator_key = "atlas-bike-v6";
    asset.reference_notes = `Pinza con montaje corregido v6 de ${model.name}; dimensiones del catálogo y detalles exteriores contrastados. Genéricos ATLAS conservan su identidad. No implica certificación de fabricación.`;
  }
  variant.visual_asset_id = asset.id;
  assets.push(asset);
}
copy.assets = assets;
for (const model of copy.components) {
  if (!["frame", "fork", "shock"].includes(model.category)) continue;
  model.technical_notes = model.technical_notes
    ?.replace(
      "Silueta genérica identificada; no reproduce carenados, logotipos ni cinemática de fábrica.",
      "Exterior aproximado del modelo; acabados y superficies ocultas simplificados, sin simulación de suspensión.",
    )
    .replace(
      "Representación genérica identificada.",
      "Representación exterior aproximada del modelo.",
    );
}

parseCatalogImport(copy);
const presets = JSON.parse(
  readFileSync("supabase/catalog/visual-v5-examples.json", "utf8"),
);
for (const p of presets.presets) {
  p.slug = p.slug.replace(/-v5$/, "-v6");
  p.family_key = p.family_key.replace(/-v5$/, "-v6");
  for (const i of p.items) i.variantId = mapping[i.variantId];
}
for (const [file, data] of Object.entries({
  "visual-v6-reviewed": copy,
  "visual-v6-successors": mapping,
  "visual-v6-examples": presets,
}))
  writeFileSync(
    "supabase/catalog/" + file + ".json",
    JSON.stringify(data, null, 2) + "\n",
  );
writeFileSync(
  "models/catalog-v6/uploads.json",
  JSON.stringify(uploads, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    models: copy.components.length,
    variants: copy.variants.length,
    glb: uploads.length,
    bytes: uploads.reduce((n, u) => n + u.bytes, 0),
  }),
);
