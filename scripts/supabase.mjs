import { readProjectEnvironment } from "./lib/environment.mjs";
import { spawnSync } from "node:child_process";
const config = readProjectEnvironment();
const action = process.argv[2];
const project = new URL(config.SUPABASE_URL).hostname.split(".")[0];
const commands = {
  push: ["db", "push", "--db-url", config.SUPABASE_DB_URL, "--yes"],
  status: ["migration", "list", "--db-url", config.SUPABASE_DB_URL],
  deploy: [
    "functions",
    "deploy",
    process.argv[3] ?? "admin-users",
    "--project-ref",
    project,
    "--use-api",
  ],
};
if (!commands[action]) {
  process.stderr.write(
    "Use: node scripts/supabase.mjs push|status|deploy [function]\n",
  );
  process.exit(2);
}
const result = spawnSync("pnpm", ["exec", "supabase", ...commands[action]], {
  env: { ...process.env, SUPABASE_ACCESS_TOKEN: config.SUPABASE_ACCESS_TOKEN },
  encoding: "utf8",
});
let output = (result.stdout ?? "") + (result.stderr ?? "");
for (const [key, value] of Object.entries(config)) {
  if (value && value.length > 10 && /SECRET|TOKEN|DB_URL|PASSWORD/.test(key))
    output = output.split(value).join("[redacted]");
}
output = output.replace(
  /postgres(?:ql)?:\/\/[^\s]+/g,
  "[database connection redacted]",
);
process.stdout.write(output);
if (result.error) {
  process.stderr.write("Unable to start Supabase CLI\n");
  process.exit(1);
}
process.exit(result.status ?? 1);
