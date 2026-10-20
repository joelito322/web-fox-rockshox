import {
  readProjectEnvironment,
  postgresEnvironment,
} from "./lib/environment.mjs";
import { spawnSync } from "node:child_process";
const email = process.argv[2];
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  process.stderr.write(
    "Provide the explicitly approved administrator email.\n",
  );
  process.exit(2);
}
const env = readProjectEnvironment();
const result = spawnSync(
  "psql",
  [
    "-X",
    "-q",
    "-v",
    "ON_ERROR_STOP=1",
    "-v",
    `email=${email}`,
    "-f",
    "supabase/operations/bootstrap-admin.sql",
  ],
  {
    encoding: "utf8",
    env: postgresEnvironment(env),
  },
);
if (result.status === 0)
  process.stdout.write(
    "Approved confirmed account linked to the administrator role.\n",
  );
else {
  const error =
    (result.stderr ?? "")
      .split(/\r?\n/)
      .find((line) => line.includes("ERROR:")) ??
    "Administrator provisioning did not complete.";
  process.stderr.write(error + "\n");
}
process.exit(result.status ?? 1);
