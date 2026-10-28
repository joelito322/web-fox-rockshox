import { readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import {
  readProjectEnvironment,
  postgresEnvironment,
} from "./lib/environment.mjs";
const dry = process.argv.includes("--pending");
const db = postgresEnvironment(readProjectEnvironment());
const state = spawnSync(
  "psql",
  [
    "-X",
    "-At",
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    "select version from supabase_migrations.schema_migrations",
  ],
  { env: db, encoding: "utf8", timeout: 60000 },
);
if (state.status !== 0)
  throw new Error(
    `Cannot read remote migration state: ${state.error?.code ?? state.signal ?? state.status}`,
  );
const applied = new Set(state.stdout.trim().split(/\s+/));
const migrations = readdirSync("supabase/migrations")
  .filter((name) => name.endsWith(".sql") && !applied.has(name.split("_")[0]))
  .sort();
let sql = readFileSync("supabase/tests/commerce.sql", "utf8");
if (dry)
  sql = sql.replace(
    "begin;",
    () =>
      "begin;\n" +
      migrations
        .map((name) => readFileSync("supabase/migrations/" + name, "utf8"))
        .join("\n"),
  );
const result = spawnSync("psql", ["-X", "-v", "ON_ERROR_STOP=1", "-q"], {
  env: postgresEnvironment(readProjectEnvironment()),
  input: sql,
  encoding: "utf8",
  timeout: 90000,
});
process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");
process.exit(result.status ?? 1);
