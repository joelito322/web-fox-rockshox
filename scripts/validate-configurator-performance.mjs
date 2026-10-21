import { readProjectEnvironment } from "./lib/environment.mjs";
import { createClient } from "@supabase/supabase-js";
import { randomBytes, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";

const project = process.argv[2] ?? "desktop";
if (!["desktop", "mobile"].includes(project)) throw new Error("Choose desktop or mobile");
const scenario = process.argv[3] ?? "performance";
if (!["performance", "commercial", "gravity", "motion"].includes(scenario)) throw new Error("Choose performance, commercial, gravity or motion");
const testFile = scenario === "motion" ? "tests/browser/suspension-motion.spec.ts" : scenario === "gravity" ? "tests/browser/gravity-catalog.spec.ts" : scenario === "commercial" ? "tests/browser/commercial-cockpit.spec.ts" : "tests/browser/configurator-performance.spec.ts";
const env = readProjectEnvironment();
const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const email = `performance-${randomUUID()}@example.invalid`;
const password = randomBytes(30).toString("base64url");
let userId;
try {
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error("Cannot create temporary performance account");
  userId = data.user.id;
  const result = spawnSync("pnpm", ["exec", "playwright", "test", testFile, `--project=${project}`, "--workers=1", `--output=/tmp/atlas-query-audit/browser-configurator-${scenario}-${project}-results`], {
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, ATLAS_PLAYWRIGHT_PORT: process.env.ATLAS_PLAYWRIGHT_PORT ?? "4182", ATLAS_TEST_EMAIL: email, ATLAS_TEST_PASSWORD: password },
  });
  const redact = (text = "") => text.replaceAll(password, "[redacted]").replaceAll(email, "[temporary account]");
  process.stdout.write(redact(result.stdout));
  process.stderr.write(redact(result.stderr));
  process.exitCode = result.status ?? 1;
} finally {
  if (userId) {
    try {
      const bucket = admin.storage.from("bike-previews");
      const root = `builds/${userId}`;
      const folders = await bucket.list(root, { limit: 1000 });
      if (folders.error) throw new Error("Cannot list temporary preview folders");
      for (const folder of folders.data) {
        const path = `${root}/${folder.name}`;
        const files = await bucket.list(path, { limit: 1000 });
        if (files.error) throw new Error("Cannot list temporary previews");
        if (files.data.length) {
          const removed = await bucket.remove(files.data.map(file => `${path}/${file.name}`));
          if (removed.error) throw new Error("Cannot remove temporary previews");
        }
      }
    } finally {
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw new Error("Cannot remove temporary performance account");
    }
  }
}
