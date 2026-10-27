import { createClient } from "@supabase/supabase-js";
import { randomBytes, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readProjectEnvironment, postgresEnvironment } from "./lib/environment.mjs";
const project = process.argv[2] ?? "desktop";
if (!["desktop", "mobile"].includes(project)) throw Error("Choose desktop or mobile");
const env = readProjectEnvironment();
const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: (input, options = {}) => fetch(input, { ...options, signal: AbortSignal.timeout(20000) }) },
});
const email = `atlas-responsive-${randomUUID()}@example.invalid`;
const password = randomBytes(30).toString("base64url");
let id;
try {
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error) throw Error("Temporary account creation failed");
  id = created.data.user.id;
  const grant = spawnSync("psql", ["-X", "-q", "-v", "ON_ERROR_STOP=1", "-v", `user_id=${id}`, "-v", "target_role=admin", "-f", "supabase/tests/session-access.sql"], { env: postgresEnvironment(env), encoding: "utf8", timeout: 20000 });
  if (grant.status) throw Error("Temporary role assignment failed");
  const run = spawnSync("pnpm", ["exec", "playwright", "test", "tests/browser/responsive.spec.ts", `--project=${project}`, "--workers=1", "--output=models/local/validation/responsive/browser"], {
    env: { ...process.env, ATLAS_PLAYWRIGHT_PORT: "4186", ATLAS_RESPONSIVE_EMAIL: email, ATLAS_RESPONSIVE_PASSWORD: password },
    encoding: "utf8", maxBuffer: 4 * 1024 * 1024, timeout: 300000,
  });
  for (const out of [run.stdout, run.stderr]) process.stdout.write((out ?? "").replaceAll(password, "[redacted]").replaceAll(email, "[temporary account]"));
  process.exitCode = run.status ?? 1;
} catch {
  console.error("Responsive validation failed; credentials and connection details suppressed."); process.exitCode = 1;
} finally {
  if (id) {
    const result = await admin.auth.admin.deleteUser(id);
    if (result.error) { console.error("Temporary account cleanup failed; requires review."); process.exitCode = 1; }
    else console.log("Temporary responsive account deleted.");
  }
}
