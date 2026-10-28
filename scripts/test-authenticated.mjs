import {
  readProjectEnvironment,
  postgresEnvironment,
} from "./lib/environment.mjs";
import { spawnSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
const suite = process.argv[4] ?? "authenticated";
if (
  ![
    "authenticated",
    "admin-modular",
    "compatibility",
    "configurator-scroll",
    "commerce",
  ].includes(suite)
)
  throw new Error("Unknown browser suite");
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
let cleanupFailed = false;
function sql(file, targetUserId = userId) {
  const r = spawnSync(
    "psql",
    [
      "-X",
      "-q",
      "-v",
      "ON_ERROR_STOP=1",
      "-v",
      `user_id=${targetUserId}`,
      "-v",
      `run=${run}`,
      "-f",
      file,
    ],
    { env: dbEnv, encoding: "utf8", timeout: 60000 },
  );
  if (r.status !== 0)
    throw new Error(
      `Browser fixture SQL failed: ${r.error?.code ?? r.signal ?? r.status}`,
    );
}
async function cleanupPreviewFolder(prefix) {
  const bucket = admin.storage.from("bike-previews");
  const { data, error } = await bucket.list(prefix, { limit: 1000 });
  if (error || data?.length === 1000)
    throw new Error("Preview fixture cleanup failed");
  const files = [];
  for (const entry of data ?? []) {
    const path = `${prefix}/${entry.name}`;
    if (entry.id) files.push(path);
    else await cleanupPreviewFolder(path);
  }
  if (files.length) {
    const { error } = await bucket.remove(files);
    if (error) throw new Error("Preview fixture cleanup failed");
  }
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
      `tests/browser/${suite}.spec.ts`,
      `--project=${project}`,
      `--output=models/local/validation/browser/${suite}-${project}-${run}`,
      ...(process.argv[3] ? ["--grep", process.argv[3]] : []),
    ],
    {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
      env: {
        ...process.env,
        ATLAS_PLAYWRIGHT_PORT:
          process.env.ATLAS_PLAYWRIGHT_PORT ??
          (suite === "commerce"
            ? project === "desktop"
              ? "4190"
              : "4191"
            : suite === "configurator-scroll"
              ? "4189"
              : suite === "compatibility"
                ? "4188"
                : suite === "admin-modular"
                  ? "4187"
                  : "4180"),
        ATLAS_TEST_EMAIL: email,
        ATLAS_TEST_PASSWORD: password,
        ATLAS_TEST_RUN: run,
        ATLAS_RECOVERY_EMAIL: recoveryEmail,
        ATLAS_NORMAL_TEST_EMAIL: recoveryEmail,
        ATLAS_NORMAL_TEST_PASSWORD: recoveryPassword,
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
    try {
      await cleanupPreviewFolder(`builds/${recoveryUserId}`);
      sql("supabase/tests/commerce-browser-cleanup.sql", recoveryUserId);
    } catch {
      cleanupFailed = true;
      process.stderr.write("Commerce fixture cleanup needs attention\n");
      process.exitCode = 1;
    }
    const { error } = await admin.auth.admin.deleteUser(recoveryUserId);
    if (error) {
      cleanupFailed = true;
      process.exitCode = 1;
    }
  }
  if (userId) {
    try {
      await cleanupPreviewFolder(`builds/${userId}`);
      sql("supabase/tests/commerce-browser-cleanup.sql");
      sql("supabase/tests/browser-cleanup.sql");
    } catch {
      cleanupFailed = true;
      process.stderr.write("Browser fixture cleanup needs attention\n");
      process.exitCode = 1;
    }
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      cleanupFailed = true;
      process.exitCode = 1;
    }
  }
  process.stdout.write(
    cleanupFailed
      ? "Temporary fixtures require cleanup; validation failed\n"
      : "Temporary browser account and catalogue fixtures cleaned up\n",
  );
}
