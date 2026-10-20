import {
  readProjectEnvironment,
  postgresEnvironment,
} from "./lib/environment.mjs";
import { spawnSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
const env = readProjectEnvironment();
const timeoutFetch = (input, options = {}) =>
  fetch(input, {
    ...options,
    signal: options.signal ?? AbortSignal.timeout(20000),
  });
const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: timeoutFetch },
});
const created = [];
function check(condition, name) {
  if (!condition) throw new Error(name);
  process.stdout.write(`PASS ${name}\n`);
}
try {
  const clients = [];
  for (let i = 0; i < 2; i++) {
    const email = `atlas-${randomUUID()}@example.invalid`,
      password = randomBytes(30).toString("base64url");
    const result = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "admin" },
    });
    if (result.error) throw result.error;
    created.push(result.data.user.id);
    const client = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_PUBLISHABLE_KEY,
      {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { fetch: timeoutFetch },
      },
    );
    const login = await client.auth.signInWithPassword({ email, password });
    check(!login.error, "native_auth_" + i);
    const access = await client.rpc("get_my_access");
    check(
      !access.error &&
        access.data.role.key === "user" &&
        !access.data.permissions.includes("roles.manage"),
      "registration_always_user_" + i,
    );
    clients.push(client);
  }
  const [a, b] = clients;
  const edgeDenied = await a.functions.invoke("admin-users", {
    body: { action: "list" },
  });
  check(edgeDenied.error?.context?.status === 403, "edge_user_denied");
  const edgeAnonymous = await fetch(
    env.SUPABASE_URL + "/functions/v1/admin-users",
    {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "list" }),
      signal: AbortSignal.timeout(20000),
    },
  );
  check(edgeAnonymous.status === 401, "edge_anonymous_denied");
  const id = randomUUID();
  const config = { schemaVersion: 1, name: "Prueba transaccional", items: [] };
  const saved = await a.rpc("save_build", {
    p_build_id: id,
    p_expected_revision: 0,
    p_configuration: config,
  });
  check(
    !saved.error && saved.data.revision === 1,
    "atomic_create_with_known_id",
  );
  const isolated = await b.from("builds").select("id").eq("id", id);
  check(
    !isolated.error && isolated.data.length === 0,
    "cross_account_read_denied",
  );
  const forbidden = await b.rpc("save_build", {
    p_build_id: id,
    p_expected_revision: 1,
    p_configuration: config,
  });
  check(forbidden.error?.code === "42501", "cross_account_write_denied");
  const direct = await a.from("builds").update({ name: "Bypass" }).eq("id", id);
  check(!!direct.error, "direct_build_write_denied");
  const updated = await a.rpc("save_build", {
    p_build_id: id,
    p_expected_revision: 1,
    p_configuration: { ...config, name: "Renombrada" },
  });
  check(
    !updated.error && updated.data.revision === 2,
    "revision_increments_once",
  );
  const stale = await a.rpc("save_build", {
    p_build_id: id,
    p_expected_revision: 1,
    p_configuration: config,
  });
  check(stale.error?.code === "PT409", "stale_revision_rejected");
  const denied = await a.rpc("get_roles_matrix");
  check(denied.error?.code === "42501", "user_cannot_manage_roles");
  const invalid = await a.rpc("save_build", {
    p_build_id: id,
    p_expected_revision: 2,
    p_configuration: {
      ...config,
      items: [
        {
          slot: "invalid",
          variantId: randomUUID(),
          finishId: "black",
          customColor: null,
        },
      ],
    },
  });
  check(!!invalid.error, "malformed_slot_rejected");
  const after = await a
    .from("builds")
    .select("revision,name")
    .eq("id", id)
    .single();
  check(
    after.data?.revision === 2 && after.data.name === "Renombrada",
    "failed_write_is_atomic",
  );
  const sql = spawnSync(
    "psql",
    [
      "-X",
      "-v",
      "ON_ERROR_STOP=1",
      "-v",
      `user_a=${created[0]}`,
      "-v",
      `user_b=${created[1]}`,
      "-f",
      "supabase/tests/contracts.sql",
    ],
    {
      encoding: "utf8",
      env: postgresEnvironment(env),
    },
  );
  let output = (sql.stdout ?? "") + (sql.stderr ?? "");
  for (const value of Object.values(env))
    if (value?.length > 10) output = output.split(value).join("[redacted]");
  process.stdout.write(
    sql.status === 0
      ? output
          .split("\n")
          .filter((line) => line.includes("NOTICE:"))
          .map((line) => line.replace(/^.*NOTICE:\s*/, ""))
          .join("\n") + "\n"
      : output,
  );
  check(sql.status === 0, "sql_catalog_and_iam_contracts");
  function sessionRole(role) {
    const result = spawnSync("psql", ["-X", "-q", "-v", "ON_ERROR_STOP=1", "-v", `user_id=${created[0]}`, "-v", `target_role=${role}`, "-f", "supabase/tests/session-access.sql"], {
      encoding: "utf8", env: postgresEnvironment(env),
    });
    check(result.status === 0, "temporary_session_role_" + role);
  }
  // Keep the original signed-in client: no new JWT or sign-in after changing IAM.
  sessionRole("admin");
  const granted = await a.functions.invoke("admin-users", { body: { action: "list" } });
  check(!granted.error && Array.isArray(granted.data.users), "edge_live_admin_access");
  const accessB = await b.rpc("get_my_access");
  const assignment = granted.data.users.find((u) => u.id === created[1]);
  const assigned = await a.functions.invoke("admin-users", { body: { action: "assign", userId: created[1], roleId: accessB.data.role.id, revision: assignment.revision } });
  check(!assigned.error, "edge_authorized_assignment");
  const staleAssignment = await a.functions.invoke("admin-users", { body: { action: "assign", userId: created[1], roleId: accessB.data.role.id, revision: assignment.revision } });
  check(staleAssignment.error?.context?.status === 409, "edge_assignment_concurrency");
  sessionRole("user");
  const revoked = await a.functions.invoke("admin-users", { body: { action: "list" } });
  check(revoked.error?.context?.status === 403, "edge_permission_revoked_with_existing_session");
  const revokedRpc = await a.rpc("get_roles_matrix");
  check(revokedRpc.error?.code === "42501", "rpc_permission_revoked_with_existing_session");
  const banned = await admin.auth.admin.updateUserById(created[1], { ban_duration: "1h" });
  check(!banned.error, "temporary_account_banned");
  const bannedSave = await b.rpc("save_build", { p_build_id: randomUUID(), p_expected_revision: 0, p_configuration: config });
  check(bannedSave.error?.code === "42501", "banned_account_existing_jwt_cannot_write");
} catch (error) {
  process.stderr.write(
    `Validation failed: ${error?.code ?? error?.message ?? "unknown"}\n`,
  );
  process.exitCode = 1;
} finally {
  for (const id of created) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) {
      process.stderr.write("Test account cleanup requires attention\n");
      process.exitCode = 1;
    }
  }
  process.stdout.write("Temporary Auth accounts cleaned up\n");
}
