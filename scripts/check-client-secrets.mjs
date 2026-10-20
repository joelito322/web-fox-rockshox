import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { readProjectEnvironment } from "./lib/environment.mjs";
const env = readProjectEnvironment(),
  sensitive = Object.entries(env).filter(
    ([key, value]) =>
      /SECRET|TOKEN|DB_URL|PASSWORD/.test(key) && value.length > 10,
  );
const files = [];
function visit(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) visit(file);
    else files.push(file);
  }
}
visit("dist");
let leaked = false;
for (const file of files) {
  const content = readFileSync(file, "utf8");
  for (const [key, value] of sensitive)
    if (content.includes(value)) {
      console.error(
        `Privileged environment variable present in client build: ${key}`,
      );
      leaked = true;
    }
}
if (leaked) process.exit(1);
console.log("No configured privileged credentials found in client build.");
