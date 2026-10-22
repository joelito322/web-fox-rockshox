import { readFileSync, existsSync, readdirSync } from "node:fs";
const read = (p) => JSON.parse(readFileSync(p));
export function inventory() {
  const bases = ["visual-v7-reviewed", "gravity-reviewed"].map((n) =>
    read("supabase/catalog/" + n + ".json"),
  );
  let variants = bases.flatMap((s) => s.variants);
  const assets = bases.flatMap((s) => s.assets),
    components = bases.flatMap((s) => s.components),
    brands = bases.flatMap((s) => s.brands);
  for (const v of readdirSync("supabase/catalog")
    .map((n) => /^frames-v(\d+)-reviewed\.json$/.exec(n))
    .filter(Boolean)
    .map((m) => Number(m[1]))
    .filter((v) => v >= 10)
    .sort((a, b) => a - b)) {
    if (v === 12) continue;
    const s = read(`supabase/catalog/frames-v${v}-reviewed.json`),
      m = read(`supabase/catalog/frames-v${v}-successors.json`);
    variants = variants.filter((x) => !m[x.id]).concat(s.variants);
    assets.push(...s.assets);
  }
  const captures = new Map();
  for (const v of readdirSync("models")
    .map((n) => /^catalog-v(\d+)$/.exec(n))
    .filter(Boolean)
    .map((m) => Number(m[1]))
    .filter((v) => v >= 5)
    .sort((a, b) => a - b)) {
    const p = `models/catalog-v${v}/uploads.json`;
    if (!existsSync(p)) continue;
    for (const c of read(p))
      captures.set(
        c.asset_id,
        c.file.startsWith("models/")
          ? c.file
          : `models/catalog-v${v}/exports/${c.file}`,
      );
  }
  const rows = variants
    .filter((v) => v.published && v.selectable)
    .map((v) => ({
      ...v,
      component: components.find((c) => c.id === v.component_id),
      asset: assets.find((a) => a.id === v.visual_asset_id),
    }));
  const legacy = read("supabase/catalog/frames-v11-reviewed.json"),
    ids = new Set(
      read("supabase/catalog/frames-v11-examples.json").presets.flatMap((p) =>
        p.items.filter((i) => i.slot === "frame").map((i) => i.variantId),
      ),
    );
  const presetFrames = legacy.variants
    .filter((v) => ids.has(v.id))
    .map((v) => ({
      ...v,
      component: legacy.components.find((c) => c.id === v.component_id),
      asset: legacy.assets.find((a) => a.id === v.visual_asset_id),
    }));
  return { rows, brands, captures, presetFrames };
}
