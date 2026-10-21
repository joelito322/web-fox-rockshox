// Internal capture entry only. Vite's product build does not include test fixtures.
import { renderPreview } from "../../src/features/bike-preview/render";
import { presetPreviewPath } from "../../src/features/bike-preview/model";
import { readPresetPreviewSource } from "../../src/features/bike-preview/api";
import { readVariants } from "../../src/features/catalog/api";
import type { Configuration } from "../../src/features/configurator/model";
const base64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
async function capture(configuration: Configuration, transparent = false) {
  const variants = await readVariants(
    configuration.items.map((i) => i.variantId),
  );
  const blob = await renderPreview(
    configuration,
    Object.fromEntries(variants.map((v) => [v.id, v])),
    undefined,
    transparent,
  );
  return blob
    ? { data: await base64(blob), bytes: blob.size, type: blob.type }
    : null;
}
Object.assign(window, {
  atlasCapturePreset: async (id: string) => {
    const configuration = await readPresetPreviewSource(id);
    return {
      path: await presetPreviewPath(id, configuration),
      image: await capture(configuration),
    };
  },
  atlasCaptureConfiguration: capture,
  atlasCaptureComponent: (configuration: Configuration) =>
    capture(configuration, true),
});
