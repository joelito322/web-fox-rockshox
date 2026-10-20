import { readFileSync } from "node:fs";
export function readProjectEnvironment() {
  return Object.fromEntries(
    readFileSync(".env", "utf8")
      .split(/\r?\n/)
      .flatMap((line) => {
        const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(line);
        return match
          ? [[match[1], match[2].trim().replace(/^(["'])(.*)\1$/, "$2")]]
          : [];
      }),
  );
}
export function postgresEnvironment(environment) {
  const database = new URL(environment.SUPABASE_DB_URL);
  return {
    ...process.env,
    PGHOST: database.hostname,
    PGPORT: database.port || "5432",
    PGDATABASE: database.pathname.slice(1),
    PGUSER: decodeURIComponent(database.username),
    PGPASSWORD: decodeURIComponent(database.password),
    PGSSLMODE: "require",
    PGCONNECT_TIMEOUT: "15",
  };
}
