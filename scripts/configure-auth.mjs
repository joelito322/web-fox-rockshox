import { readProjectEnvironment } from "./lib/environment.mjs";
import { readFileSync } from "node:fs";
const e = readProjectEnvironment();
const config = JSON.parse(readFileSync("supabase/auth-config.json", "utf8"));
for (const name of ["confirmation", "recovery", "invite"])
  config[`mailer_templates_${name}_content`] = readFileSync(
    `supabase/templates/${name}.html`,
    "utf8",
  );
const ref = new URL(e.SUPABASE_URL).hostname.split(".")[0];
const endpoint = `https://api.supabase.com/v1/projects/${ref}/config/auth`;
const headers = {
  Authorization: `Bearer ${e.SUPABASE_ACCESS_TOKEN}`,
  "Content-Type": "application/json",
};
const response = await fetch(endpoint, {
  method: "PATCH",
  headers,
  body: JSON.stringify(config),
  signal: AbortSignal.timeout(20000),
});
if (!response.ok) {
  console.error("Auth configuration update failed:", response.status);
  process.exit(1);
}
const verify = await fetch(endpoint, {
  headers,
  signal: AbortSignal.timeout(15000),
});
if (!verify.ok) {
  console.error("Auth configuration readback failed");
  process.exit(1);
}
const applied = await verify.json();
if (Object.entries(config).some(([key, value]) => applied[key] !== value)) {
  console.error("Auth configuration readback differs");
  process.exit(1);
}
console.log(
  "Auth callbacks, password policy and token-hash templates applied and verified.",
);
console.log("Custom SMTP configured:", !!applied.smtp_host);
