import {
  readProjectEnvironment,
  postgresEnvironment,
} from "./lib/environment.mjs";
import { spawnSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
const project = process.argv[2] ?? "desktop";
if (!["desktop", "mobile"].includes(project))
  throw new Error("Choose desktop or mobile");
const e = readProjectEnvironment();
const admin = createClient(e.SUPABASE_URL, e.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const dbEnv = postgresEnvironment(e);
const run = "validation-" + randomUUID().slice(0, 8),
  email = run + "@example.invalid",
  password = randomBytes(30).toString("base64url");
let userId, recoveryUserId;
function sql(file) {
  const r = spawnSync(
    "psql",
    [
      "-X",
      "-q",
      "-v",
      "ON_ERROR_STOP=1",
      "-v",
      `user_id=${userId}`,
      "-v",
      `run=${run}`,
      "-f",
      file,
    ],
    { env: dbEnv, encoding: "utf8" },
  );
  if (r.status !== 0) throw new Error("Browser fixture SQL failed");
}
try {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  userId = data.user.id;
  sql("supabase/tests/browser-setup.sql");
  const recoveryEmail = run + "-recovery@example.invalid";
  const recoveryPassword = randomBytes(30).toString("base64url");
  const recoveryAccount = await admin.auth.admin.createUser({
    email: recoveryEmail,
    password: recoveryPassword,
    email_confirm: true,
  });
  if (recoveryAccount.error) throw recoveryAccount.error;
  recoveryUserId = recoveryAccount.data.user.id;
  const recoveryLink = await admin.auth.admin.generateLink({
    type: "recovery",
    email: recoveryEmail,
  });
  if (recoveryLink.error) throw recoveryLink.error;

  const result = spawnSync(
    "pnpm",
    [
      "exec",
      "playwright",
      "test",
      "tests/browser/authenticated.spec.ts",
      `--project=${project}`,
      ...(process.argv[3] ? ["--grep", process.argv[3]] : []),
    ],
    {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
      env: {
        ...process.env,
        ATLAS_TEST_EMAIL: email,
        ATLAS_TEST_PASSWORD: password,
        ATLAS_TEST_RUN: run,
        ATLAS_RECOVERY_EMAIL: recoveryEmail,
        ATLAS_RECOVERY_PASSWORD: recoveryPassword + "New",
        ATLAS_RECOVERY_TOKEN: recoveryLink.data.properties.hashed_token,
      },
    },
  );
  const confidential = [
    password,
    recoveryPassword,
    recoveryPassword + "New",
    recoveryLink.data.properties.hashed_token,
  ].sort((a, b) => b.length - a.length);
  const redact = (value) =>
    confidential.reduce(
      (text, secret) => text.replaceAll(secret, "[redacted]"),
      value ?? "",
    );
  process.stdout.write(redact(result.stdout));
  process.stderr.write(redact(result.stderr));
  process.exitCode = result.status ?? 1;
} catch {
  process.stderr.write("Authenticated browser validation failed\n");
  process.exitCode = 1;
} finally {
  if (recoveryUserId) {
    const { error } = await admin.auth.admin.deleteUser(recoveryUserId);
    if (error) process.exitCode = 1;
  }
  if (userId) {
    try {
      sql("supabase/tests/browser-cleanup.sql");
    } catch {
      process.stderr.write("Browser fixture cleanup needs attention\n");
      process.exitCode = 1;
    }
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) process.exitCode = 1;
  }
  process.stdout.write(
    "Temporary browser account and catalogue fixtures cleaned up\n",
  );
}
