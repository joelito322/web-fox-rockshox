import { createClient } from "@supabase/supabase-js";
import { randomBytes, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readProjectEnvironment, postgresEnvironment } from "./lib/environment.mjs";
const project = process.argv[2] ?? "desktop";
if (!["desktop", "mobile"].includes(project)) throw new Error("Choose desktop or mobile");
const env = readProjectEnvironment();
const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const email = `atlas-${randomUUID()}@example.invalid`;
const password = randomBytes(30).toString("base64url");
let id;
try {
  const account = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (account.error) throw new Error("Temporary test account creation failed");
  id = account.data.user.id;
  const grant = spawnSync("psql", ["-X", "-q", "-v", "ON_ERROR_STOP=1", "-v", `user_id=${id}`, "-v", "target_role=admin", "-f", "supabase/tests/session-access.sql"], { env: postgresEnvironment(env), encoding: "utf8" });
  if (grant.status) throw new Error("Temporary test account grant failed");
  const result = spawnSync("pnpm", ["exec", "playwright", "test", "tests/browser/admin-performance.spec.ts", `--project=${project}`, "--workers=1", "--output=/tmp/atlas-query-audit/admin-artifacts"], {
    encoding: "utf8", maxBuffer: 10 * 1024 * 1024,
    env: { ...process.env, ATLAS_PLAYWRIGHT_PORT: "4184", ATLAS_ADMIN_TEST_EMAIL: email, ATLAS_ADMIN_TEST_PASSWORD: password },
  });
  for (const output of [result.stdout, result.stderr]) process.stdout.write((output ?? "").replaceAll(password, "[redacted]"));
  process.exitCode = result.status ?? 1;
} catch {
  console.error("Admin browser performance validation failed"); process.exitCode = 1;
} finally {
  if (id) {
    const removed = await admin.auth.admin.deleteUser(id);
    if (removed.error) { console.error("Temporary admin account cleanup requires attention"); process.exitCode = 1; }
    else console.log("Temporary admin account deleted");
  }
}
