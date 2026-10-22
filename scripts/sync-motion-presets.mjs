import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import {
  readProjectEnvironment,
  postgresEnvironment,
} from "./lib/environment.mjs";
const changes = JSON.parse(
  readFileSync("models/motion-v2/preset-frame-updates.json"),
);
if (!process.argv.includes("--apply")) {
  console.log("Four scoped frame replacements prepared; no remote writes");
  process.exit(0);
}
const env = readProjectEnvironment(),
  run = (sql) => {
    const r = spawnSync("psql", ["-X", "-qAt", "-v", "ON_ERROR_STOP=1"], {
      input: sql,
      env: postgresEnvironment(env),
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
    });
    if (r.status)
      throw Error(
        "Scoped preset operation failed: " +
          r.stderr.replaceAll(env.SUPABASE_DB_URL, "[redacted]"),
      );
    return r.stdout.trim();
  };
const snapshot = () =>
  JSON.parse(
    run(
      "begin read only;select json_build_object('items',(select json_agg(i order by preset_id,slot) from public.bike_preset_items i),'private',(select md5(coalesce(string_agg(row_to_json(b)::text,'' order by id),'')) from public.builds b),'private_items',(select md5(coalesce(string_agg(row_to_json(i)::text,'' order by build_id,slot),'')) from public.build_items i));rollback;",
    ),
  );
const before = snapshot(),
  payload = JSON.stringify(changes).replaceAll('"', '""');
run(
  'begin;create temporary table atlas_motion_presets(payload jsonb) on commit drop;\ncopy atlas_motion_presets from stdin with(format csv);\n"' +
    payload +
    '"\n\\.\n' +
    readFileSync("supabase/operations/sync-motion-presets.sql", "utf8") +
    "\ncommit;",
);
const after = snapshot(),
  key = (i) => i.preset_id + ":" + i.slot,
  old = new Map(before.items.map((i) => [key(i), i]));
const diffs = after.items.filter(
  (i) => JSON.stringify(i) !== JSON.stringify(old.get(key(i))),
);
if (
  diffs.some((i) => i.slot !== "frame") ||
  diffs.length > 4 ||
  before.private !== after.private ||
  before.private_items !== after.private_items
)
  throw Error("Unexpected preset/private difference");
writeFileSync(
  "models/motion-v2/preset-publication.json",
  JSON.stringify(
    {
      checked_at: new Date().toISOString(),
      updates: changes,
      changed_positions: diffs.length,
      positions: after.items.length,
      non_frame_preserved: true,
      private_preserved: true,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  "Updated four preset frame references; other positions and private builds preserved.",
);
