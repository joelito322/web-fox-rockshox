import type { QueryClient } from "@tanstack/react-query";
import { requireSupabase } from "../../lib/supabase";
import { readBuild, readCachedBuild, savedBuildKey } from "../garage/api";
import { readVariants, readCachedVariants } from "../catalog/api";
import {
  configurationSchema,
  type Configuration,
  type VariantMap,
} from "../configurator/model";
import { buildPreviewPath, presetPreviewPath, previewBucket } from "./model";

const pending = new Map<
  string,
  { task: Promise<Blob | null>; signal?: AbortSignal }
>();
function once(
  key: string,
  run: () => Promise<Blob | null>,
  signal?: AbortSignal,
): Promise<Blob | null> {
  const previous = pending.get(key);
  if (previous && !previous.signal?.aborted) {
    return previous.task.then(
      (blob) => {
        signal?.throwIfAborted();
        return blob;
      },
      (error) => {
        // An abandoned card must not cancel a still-needed save or a new observer.
        if (previous.signal?.aborted && !signal?.aborted)
          return once(key, run, signal);
        throw error;
      },
    );
  }
  const task = run().finally(() => {
    if (pending.get(key)?.task === task) pending.delete(key);
  });
  pending.set(key, { task, signal });
  return task;
}
async function sameAccount(user: string) {
  const { data } = await requireSupabase().auth.getSession();
  return data.session?.user.id === user;
}
async function download(path: string) {
  const { data, error } = await requireSupabase()
    .storage.from(previewBucket)
    .download(path);
  if (error) {
    const status = "statusCode" in error ? String(error.statusCode) : "";
    if (status === "404" || /not found|does not exist/i.test(error.message))
      return null;
    throw Error("preview_download_unavailable");
  }
  return data;
}
async function capture(
  configuration: Configuration,
  signal?: AbortSignal,
  known?: VariantMap,
  client?: QueryClient,
) {
  if (!configuration.items.length) return null;
  signal?.throwIfAborted();
  const variants =
    known ??
    Object.fromEntries(
      (
        await (client
          ? readCachedVariants(
              client,
              configuration.items.map((i) => i.variantId),
              signal,
            )
          : readVariants(
              configuration.items.map((i) => i.variantId),
              signal,
            ))
      ).map((v) => [v.id, v]),
    );
  const { renderPreview } = await import("./render");
  return renderPreview(configuration, variants, signal);
}
async function upload(path: string, blob: Blob) {
  const { error } = await requireSupabase()
    .storage.from(previewBucket)
    .upload(path, blob, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false,
    });
  // A concurrent capture of this exact revision may have won; either way the mount is saved.
  return !error;
}
export async function getBuildPreview(
  user: string,
  id: string,
  revision: number,
  write: boolean,
  signal?: AbortSignal,
  client?: QueryClient,
): Promise<Blob | null> {
  return once(
    buildPreviewPath(user, id, revision),
    async () => {
      if (!(await sameAccount(user))) return null;
      const stored = await download(buildPreviewPath(user, id, revision));
      signal?.throwIfAborted();
      if (!(await sameAccount(user))) return null;
      if (stored) return stored;
      let build = await (client
        ? readCachedBuild(client, user, id, signal)
        : readBuild(id, signal));
      // Another tab may have saved since the short-lived build cache was filled.
      if (build.revision !== revision && client) {
        build = await readBuild(id, signal);
        if (await sameAccount(user))
          client.setQueryData(savedBuildKey(user, id), build);
      }
      if (build.revision !== revision) return null;
      const blob = await capture(
        build.configuration,
        signal,
        undefined,
        client,
      );
      signal?.throwIfAborted();
      if (!(await sameAccount(user))) return null;
      if (blob && write)
        await upload(buildPreviewPath(user, id, revision), blob);
      return blob;
    },
    signal,
  );
}
// Call only after the server confirms this snapshot. The editor may already contain newer edits.
export async function captureSavedBuild(
  user: string,
  id: string,
  revision: number,
  configuration: Configuration,
  known: VariantMap,
  reusable?: Blob | null,
): Promise<Blob | null> {
  const snapshot = structuredClone(configuration);
  return once(buildPreviewPath(user, id, revision), async () => {
    if (!snapshot.items.length || !(await sameAccount(user))) return null;
    const blob = reusable ?? await capture(snapshot, undefined, known);
    if (!blob || !(await sameAccount(user))) return null;
    const current = await readBuild(id);
    if (current.revision !== revision) return null;
    await upload(buildPreviewPath(user, id, revision), blob);
    return blob;
  });
}
export async function readPresetPreviewSource(
  id: string,
  signal?: AbortSignal,
) {
  let query = requireSupabase()
    .from("bike_presets")
    .select(
      "id,name,published,selectable,bike_preset_items(slot,variant_id,finish_id,custom_color)",
    )
    .eq("id", id)
    .eq("published", true)
    .eq("selectable", true);
  if (signal) query = query.abortSignal(signal);
  const { data, error } = await query.single();
  if (error) throw error;
  return configurationSchema.parse({
    schemaVersion: 1,
    name: data.name.slice(0, 80),
    items: data.bike_preset_items.map(
      (i: {
        slot: string;
        variant_id: string;
        finish_id: string;
        custom_color: string | null;
      }) => ({
        slot: i.slot,
        variantId: i.variant_id,
        finishId: i.finish_id,
        customColor: i.custom_color,
      }),
    ),
  });
}
export async function readCachedPresetPreviewSources(
  client: QueryClient,
  ids: string[],
  signal?: AbortSignal,
): Promise<Record<string, Configuration>> {
  signal?.throwIfAborted();
  const result: Record<string, Configuration> = {};
  const missing = [...new Set(ids)]
    .filter((id) => {
      const state = client.getQueryState<Configuration>([
        "preset-preview-source",
        id,
      ]);
      if (
        state?.data &&
        !state.isInvalidated &&
        Date.now() - state.dataUpdatedAt < 300_000
      ) {
        result[id] = state.data;
        return false;
      }
      return true;
    })
    .sort();
  if (missing.length) {
    const values = await client.fetchQuery({
      queryKey: ["preset-preview-source-batch", missing],
      staleTime: 0,
      queryFn: async ({ signal: querySignal }) => {
        const { data, error } = await requireSupabase()
          .from("bike_presets")
          .select(
            "id,name,bike_preset_items(slot,variant_id,finish_id,custom_color)",
          )
          .in("id", missing)
          .eq("published", true)
          .eq("selectable", true)
          .abortSignal(querySignal);
        if (error) throw error;
        querySignal.throwIfAborted();
        const entries: Record<string, Configuration> = {};
        for (const preset of data) {
          const configuration = configurationSchema.parse({
            schemaVersion: 1,
            name: preset.name.slice(0, 80),
            items: preset.bike_preset_items.map((item) => ({
              slot: item.slot,
              variantId: item.variant_id,
              finishId: item.finish_id,
              customColor: item.custom_color,
            })),
          });
          entries[preset.id] = configuration;
          client.setQueryData(
            ["preset-preview-source", preset.id],
            configuration,
          );
        }
        return entries;
      },
    });
    Object.assign(result, values);
  }
  signal?.throwIfAborted();
  return result;
}
export async function getPresetPreview(
  id: string,
  configuration: Configuration,
  write: boolean,
  signal?: AbortSignal,
  client?: QueryClient,
): Promise<Blob | null> {
  const snapshot = structuredClone(configuration),
    path = await presetPreviewPath(id, snapshot);
  return once(
    path,
    async () => {
      const stored = await download(path);
      signal?.throwIfAborted();
      if (stored) return stored;
      const blob = await capture(snapshot, signal, undefined, client);
      signal?.throwIfAborted();
      if (blob && write) await upload(path, blob);
      return blob;
    },
    signal,
  );
}
export async function cleanupBuildPreviews(user: string, id: string) {
  if (!(await sameAccount(user))) return;
  const bucket = requireSupabase().storage.from(previewBucket),
    folder = `builds/${user}/${id}`;
  const { data, error } = await bucket.list(folder, { limit: 1000 });
  if (error || !data?.length) return;
  await bucket.remove(data.map((o) => `${folder}/${o.name}`));
}
