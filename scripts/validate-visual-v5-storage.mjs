// Verify current mesh objects, public reads and denied anonymous writes.
// Optional cleanup removes only unreferenced drafts in this generation's own namespace.
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { readProjectEnvironment } from "./lib/environment.mjs";
const env = readProjectEnvironment(),
  opts = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, opts),
  anon = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, opts);
const rows = JSON.parse(readFileSync("models/catalog-v5/uploads.json", "utf8"));
const current = new Map(rows.map((r) => [r.path, r]));
const references = await admin
  .from("visual_assets")
  .select("storage_path")
  .eq("kind", "glb");
if (references.error) throw Error("Cannot inspect resource references");
const protectedPaths = new Set([
  ...current.keys(),
  ...references.data.map((r) => r.storage_path),
]);
const files = new Map();
for (const folder of new Set(
  rows.map((r) => r.path.split("/").slice(0, -1).join("/")),
)) {
  const result = await admin.storage
    .from("models")
    .list(folder, { limit: 1000 });
  if (result.error || result.data.length >= 1000)
    throw Error("Cannot inspect complete mesh namespace");
  for (const object of result.data)
    if (object.id && /^[a-f0-9]{24}\.glb$/.test(object.name))
      files.set(folder + "/" + object.name, object);
}
let checked = 0;
let cursor = 0;
const paths = [...current.keys()];
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (cursor < paths.length) {
      const path = paths[cursor++],
        entry = files.get(path);
      if (!entry || Number(entry.metadata?.size) !== current.get(path).bytes)
        throw Error("Mesh size/source mismatch");
      const { data } = anon.storage.from("models").getPublicUrl(path);
      const response = await fetch(data.publicUrl, {
        method: "HEAD",
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw Error("Public mesh download unavailable");
      checked++;
    }
  }),
);
const probe = "catalog/v5/validation-" + randomUUID() + ".glb";
const attempt = await anon.storage
  .from("models")
  .upload(probe, Buffer.from([0]), {
    contentType: "model/gltf-binary",
    upsert: false,
  });
if (!attempt.error) {
  await admin.storage.from("models").remove([probe]);
  throw Error("Anonymous mesh write was unexpectedly allowed");
}
if (!/row.level|unauthor|permission/i.test(attempt.error.message))
  throw Error("Anonymous write probe failed for an unrelated reason");
const drafts = [...files.keys()].filter((path) => !protectedPaths.has(path));
let removed = 0;
if (process.argv.includes("--cleanup")) {
  for (let i = 0; i < drafts.length; i += 100) {
    const result = await admin.storage
      .from("models")
      .remove(drafts.slice(i, i + 100));
    if (result.error) throw Error("Unreferenced draft cleanup failed");
    removed += result.data.length;
  }
}
console.log(
  JSON.stringify({
    captureReferences: rows.length,
    uniquePublicMeshes: checked,
    anonymousWriteDenied: true,
    anonymousWriteStatus: attempt.error.statusCode ?? attempt.error.status,
    unreferencedDrafts: drafts.length,
    removedDrafts: removed,
  }),
);
