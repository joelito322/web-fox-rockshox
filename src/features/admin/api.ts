import { z } from "zod";
import { requireSupabase } from "../../lib/supabase";
export const roleSchema = z.object({
  id: z.uuid(),
  key: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  active: z.boolean(),
  is_system: z.boolean(),
  revision: z.number(),
  permissions: z.array(z.string()),
});
export const permissionSchema = z.object({
  code: z.string(),
  name: z.string(),
  description: z.string(),
  area: z.string(),
});
export const matrixSchema = z.object({
  roles: z.array(roleSchema),
  permissions: z.array(permissionSchema),
});
export type Role = z.infer<typeof roleSchema>;
export type Matrix = z.infer<typeof matrixSchema>;
export const accountSchema = z.object({
  id: z.uuid(),
  email: z.string().nullable(),
  role_id: z.uuid().nullable(),
  role_name: z.string().nullable(),
  revision: z.number().nullable(),
  confirmed: z.boolean(),
  created_at: z.string(),
  last_sign_in_at: z.string().nullable(),
});
export type Account = z.infer<typeof accountSchema>;
export const adminStaleTime = 30_000;

export async function matrix({ signal }: { signal: AbortSignal }) {
  const { data, error } = await requireSupabase()
    .rpc("get_roles_matrix").abortSignal(signal);
  if (error) throw error;
  return matrixSchema.parse(data);
}
export async function saveRoles(roles: unknown[]) {
  const { data, error } = await requireSupabase().rpc("save_roles", {
    p_roles: roles,
  });
  if (error) throw error;
  return matrixSchema.parse(data);
}
export async function deleteRole(role: Role) {
  const { error } = await requireSupabase().rpc("delete_role", {
    p_id: role.id,
    p_revision: role.revision,
  });
  if (error) throw error;
}
export async function grantableRoles({ signal }: { signal: AbortSignal }) {
  const { data, error } = await requireSupabase()
    .rpc("list_grantable_roles").abortSignal(signal);
  if (error) throw error;
  return z.array(z.object({ id: z.uuid(), name: z.string() })).parse(data);
}
export async function accountOperation(body: Record<string, unknown>) {
  const { data, error } = await requireSupabase().functions.invoke(
    "admin-users",
    { body },
  );
  if (error) {
    let code = "";
    try {
      const payload = await error.context?.clone().json();
      if (typeof payload?.code === "string") code = payload.code;
    } catch {
      /* SDK failures without a response retain their safe generic message. */
    }
    if (code) throw { code };
    throw error;
  }
  return data as unknown;
}

export async function listAccounts(search: string, page: number, signal: AbortSignal) {
  const { data, error } = await requireSupabase().rpc("admin_list_users", {
    p_search: search, p_page: page,
  }).abortSignal(signal);
  if (error) throw error;
  return accountPageSchema.parse(data);
}

export const accountPageSchema = z.object({
  count: z.number(),
  users: z.array(accountSchema),
});
const prerequisites: Record<string, string[]> = {
  "builds.write_own": ["builds.read_own"],
  "builds.delete_own": ["builds.read_own"],
  "catalog.publish": ["catalog.manage"],
  "presets.publish": ["presets.manage"],
  "users.assign_role": ["users.read"],
  "users.invite": [
    "users.read",
    "configurator.use",
    "builds.read_own",
    "builds.write_own",
    "builds.delete_own",
  ],
};
export function permissionRequirement(
  codes: string[],
  permissions: Matrix["permissions"],
): string | null {
  for (const code of codes) {
    const missing = prerequisites[code]?.find((p) => !codes.includes(p));
    if (missing)
      return `${permissions.find((p) => p.code === code)?.name ?? "Esta acción"} requiere «${permissions.find((p) => p.code === missing)?.name ?? "su permiso asociado"}».`;
  }
  return null;
}
