// Integration test of the actual visual publication transition; temporary Auth user is removed.
import { readFileSync } from "node:fs";
import { randomBytes, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import {
  readProjectEnvironment,
  postgresEnvironment,
} from "./lib/environment.mjs";
if (!process.argv.includes("--publish"))
  throw Error(
    "This transition test requires --publish and applies the reviewed visual publication.",
  );
const env = readProjectEnvironment(),
  options = {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (url, options = {}) =>
        fetch(url, {
          ...options,
          signal: options.signal ?? AbortSignal.timeout(20000),
        }),
    },
  };
const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, options),
  client = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_PUBLISHABLE_KEY,
    options,
  );
const presets = (name) =>
  JSON.parse(readFileSync("supabase/catalog/" + name + ".json", "utf8"))
    .presets;
const target =
  process.argv.find((a) => a.startsWith("--version="))?.split("=")[1] ?? "v4";
if (!["v4", "v5", "v6", "v7"].includes(target))
  throw Error("Unsupported transition");
const previous =
  target === "v7"
    ? "v6"
    : target === "v6"
      ? "v5"
      : target === "v5"
        ? "v4"
        : "v3";
const old = [
    presets(`visual-${previous}-examples`)[0],
    presets(`visual-${previous}-examples`)[2],
  ],
  fresh = presets(`visual-${target}-examples`);
let user;
const check = (condition, name) => {
  if (!condition) throw Error(name);
  console.log("PASS " + name);
};
try {
  const email = "atlas-visual-" + randomUUID() + "@example.invalid",
    password = randomBytes(32).toString("base64url");
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error) throw Error("Temporary Auth account creation failed");
  user = created.data.user.id;
  const login = await client.auth.signInWithPassword({ email, password });
  check(!login.error, "native_login");
  const saved = [];
  for (const p of old) {
    const id = randomUUID(),
      configuration = {
        schemaVersion: 1,
        name: "Visual legacy " + p.label,
        items: p.items,
      };
    const r = await client.rpc("save_build", {
      p_build_id: id,
      p_expected_revision: 0,
      p_configuration: configuration,
    });
    check(!r.error, "save_legacy_before_publication_" + p.slug);
    saved.push({ id, configuration });
  }
  const publication = spawnSync(
    process.execPath,
    ["scripts/publish-visuals.mjs", "--version=" + target, "--apply"],
    { encoding: "utf8" },
  );
  if (publication.status !== 0) throw Error("Atomic visual publication failed");
  console.log(publication.stdout.trim());
  for (const { id, configuration } of saved) {
    const items = await client
      .from("build_items")
      .select("slot,variant_id")
      .eq("build_id", id);
    check(
      !items.error &&
        items.data.length === 23 &&
        items.data.every((i) =>
          configuration.items.some(
            (old) => old.slot === i.slot && old.variantId === i.variant_id,
          ),
        ),
      "legacy_identifiers_preserved_" + id.slice(0, 8),
    );
    const r = await client.rpc("save_build", {
      p_build_id: id,
      p_expected_revision: 1,
      p_configuration: {
        ...configuration,
        name: configuration.name + " reopened",
      },
    });
    check(
      !r.error && r.data.revision === 2,
      "legacy_reopens_and_resaves_" + id.slice(0, 8),
    );
  }
  for (const p of fresh) {
    const configuration = {
      schemaVersion: 1,
      name: "Visual v3 " + p.slug.slice(-16),
      items: p.items.map((i) =>
        i.slot === "frame" ? { ...i, customColor: "#cc4411" } : i,
      ),
    };
    const r = await client.rpc("save_build", {
      p_build_id: randomUUID(),
      p_expected_revision: 0,
      p_configuration: configuration,
    });
    check(!r.error, "new_resource_save_" + p.slug);
  }
  const sql = spawnSync(
    "psql",
    [
      "-X",
      "-q",
      "-v",
      "ON_ERROR_STOP=1",
      "-f",
      `supabase/tests/visual-${target}.sql`,
    ],
    { env: postgresEnvironment(env), encoding: "utf8" },
  );
  check(sql.status === 0, "cloud_profiles_categories_and_inventory");
} finally {
  await client.auth.signOut();
  if (user) {
    const result = await admin.auth.admin.deleteUser(user);
    if (result.error)
      throw Error("Temporary visual test account cleanup failed");
    console.log("Temporary account and builds removed.");
  }
}
