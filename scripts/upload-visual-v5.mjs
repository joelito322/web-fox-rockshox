// Only uploads reviewed local binaries. No catalog publication; immutable paths reject replacement.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { readProjectEnvironment } from "./lib/environment.mjs";
const env = readProjectEnvironment(),
  client = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
const captures = JSON.parse(
  readFileSync("models/catalog-v5/uploads.json", "utf8"),
);
const rows = [...new Map(captures.map((row) => [row.path, row])).values()];
for (const row of rows) {
  const data = readFileSync(row.file);
  if (
    data.length !== row.bytes ||
    createHash("sha256").update(data).digest("hex") !== row.sha256
  )
    throw Error("Local binary no longer matches reviewed source");
}
if (!process.argv.includes("--apply")) {
  console.log(`Validated ${rows.length} immutable mesh sources; no uploads.`);
  process.exit(0);
}
const bucket = await client.storage.getBucket("models");
if (bucket.error || !bucket.data.public)
  throw Error("Public models bucket is not ready");
let index = 0,
  completed = 0;
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (index < rows.length) {
      const row = rows[index++],
        data = readFileSync(row.file);
      const upload = await client.storage
        .from("models")
        .upload(row.path, data, {
          contentType: "model/gltf-binary",
          cacheControl: "31536000",
          upsert: false,
        });
      if (upload.error) {
        const { data: url } = client.storage
          .from("models")
          .getPublicUrl(row.path);
        const response = await fetch(url.publicUrl, {
          signal: AbortSignal.timeout(30000),
        });
        if (
          !response.ok ||
          createHash("sha256")
            .update(Buffer.from(await response.arrayBuffer()))
            .digest("hex") !== row.sha256
        )
          throw Error(
            "Immutable mesh upload failed or existing content differs",
          );
      }
      completed++;
      if (completed % 15 === 0)
        console.log(`Meshes uploaded/verified: ${completed}/${rows.length}`);
    }
  }),
);
console.log(`Verified ${completed} remote mesh objects; catalog unchanged.`);
