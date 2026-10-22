// Authorized cloud transition test: temporary normal user/builds, scoped publication, cleanup.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
import { randomUUID, randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readProjectEnvironment } from "./lib/environment.mjs";
if (!process.argv.includes("--publish"))
  throw Error("Use --publish to apply the reviewed frame publication");
const env = readProjectEnvironment(),
  options = {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (url, options = {}) =>
        fetch(url, {
          ...options,
          signal: options.signal ?? AbortSignal.timeout(30000),
        }),
    },
  },
  admin = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, options),
  client = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_PUBLISHABLE_KEY,
    options,
  );
const rows = JSON.parse(readFileSync("models/catalog-v18/predecessors.json")),
  fresh = JSON.parse(readFileSync("supabase/catalog/frames-v18-reviewed.json"));
let user,
  cleaned = false;
const results = { legacy: 0, successors: 0 };
const configuration = (v) => ({
  schemaVersion: 1,
  name: "Frame transition validation",
  items: [
    {
      slot: "frame",
      variantId: v.id,
      finishId: v.allowed_finishes.default_finish_id,
      customColor: null,
    },
  ],
});
try {
  const email = "atlas-frame-" + randomUUID() + "@example.invalid",
    password = randomBytes(32).toString("base64url"),
    created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
  if (created.error) throw Error("Temporary account creation failed");
  user = created.data.user.id;
  const login = await client.auth.signInWithPassword({ email, password });
  if (login.error) throw Error("Native login failed");
  const chosen = rows,
    saved = [];
  for (const row of chosen) {
    const id = randomUUID(),
      config = configuration(row.variant),
      r = await client.rpc("save_build", {
        p_build_id: id,
        p_expected_revision: 0,
        p_configuration: config,
      });
    if (r.error) throw Error("Legacy frame save failed: " + row.slug);
    saved.push({ id, config });
  }
  const published = spawnSync(
    process.execPath,
    ["scripts/publish-frame-v18.mjs", "--apply"],
    { encoding: "utf8", maxBuffer: 2 * 1024 * 1024 },
  );
  if (published.status !== 0)
    throw Error("Scoped publication failed: " + published.stderr);
  console.log(published.stdout.trim());
  for (const { id, config } of saved) {
    const read = await client
      .from("build_items")
      .select("variant_id")
      .eq("build_id", id);
    if (
      read.error ||
      read.data.length !== 1 ||
      read.data[0].variant_id !== config.items[0].variantId
    )
      throw Error("Legacy frame identity changed");
    const r = await client.rpc("save_build", {
      p_build_id: id,
      p_expected_revision: 1,
      p_configuration: { ...config, name: "Legacy frame reopened" },
    });
    if (r.error || r.data.revision !== 2)
      throw Error("Legacy frame reopen failed");
    results.legacy++;
  }
  for (const v of fresh.variants) {
    const r = await client.rpc("save_build", {
      p_build_id: randomUUID(),
      p_expected_revision: 0,
      p_configuration: configuration(v),
    });
    if (r.error) throw Error("New frame save failed");
    results.successors++;
  }
} finally {
  if (user) {
    const r = await admin.auth.admin.deleteUser(user);
    if (r.error) throw Error("Temporary validation account cleanup failed");
    cleaned = true;
  }
}
writeFileSync(
  "models/catalog-v18/transition.json",
  JSON.stringify(
    {
      checked_at: new Date().toISOString(),
      ...results,
      temporary_account_removed: cleaned,
    },
    null,
    2,
  ) + "\n",
);
console.log(JSON.stringify({ ...results, temporary_account_removed: cleaned }));
