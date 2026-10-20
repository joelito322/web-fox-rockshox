import { useCallback, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { useAuth } from "../auth/provider";
import {
  accountOperation,
  accountPageSchema,
  grantableRoles,
  type Account,
} from "./api";
import { useUnsavedChanges } from "../../components/ui/UnsavedChanges";
import { Drawer } from "../../components/ui/Drawer";
import { Loading, Notice, Empty } from "../../components/ui/Feedback";
import { userError } from "../../lib/supabase";
export default function Users() {
  const auth = useAuth();
  const cache = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [panel, setPanel] = useState<Account | null | undefined>();
  const [roleId, setRoleId] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const query = useQuery({
    queryKey: ["admin-users", auth.user!.id, search, page],
    queryFn: async () =>
      accountPageSchema.parse(
        await accountOperation({ action: "list", search, page }),
      ),
  });
  const roles = useQuery({
    queryKey: ["grantable-roles", auth.user!.id],
    queryFn: grantableRoles,
    enabled:
      auth.permissions.includes("users.assign_role") ||
      auth.permissions.includes("users.invite"),
  });
  const guard = useUnsavedChanges(
    panel !== undefined && (email !== "" || roleId !== (panel?.role_id ?? "")),
    save,
    busy,
  );
  const close = useCallback(() => {
    setPanel(undefined);
    setError("");
  }, []);
  function open(account: Account | null) {
    setPanel(account);
    setRoleId(account?.role_id ?? "");
    setEmail("");
    setError("");
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      const result = await accountOperation(
        panel
          ? {
              action: "assign",
              userId: panel.id,
              roleId,
              revision: panel.revision,
            }
          : { action: "invite", email, roleId },
      );
      const partial =
        !!result &&
        typeof result === "object" &&
        "status" in result &&
        result.status === "partial";
      setMessage(
        partial
          ? "Cuenta invitada; rol pendiente de asignar. Abre su detalle para completar la asignación."
          : panel
            ? "Rol actualizado."
            : "Invitación enviada.",
      );
      await cache.invalidateQueries({
        queryKey: ["admin-users", auth.user!.id],
      });
      close();
      return true;
    } catch (error) {
      setError(userError(error));
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="admin-toolbar">
        <label className="search-input">
          <Search size={17} />
          <input
            aria-label="Buscar usuario"
            placeholder="Buscar por correo…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </label>
        {auth.permissions.includes("users.invite") && (
          <button className="button dark" onClick={() => open(null)}>
            <Plus size={16} /> Crear usuario
          </button>
        )}
      </div>
      {message && (
        <p role="status" className="success-notice">
          {message}
        </p>
      )}
      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <Notice onRetry={() => void query.refetch()}>
          No se pudieron consultar los usuarios.
        </Notice>
      ) : !query.data.users.length ? (
        <Empty title="Sin usuarios en esta búsqueda" />
      ) : (
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Creado</th>
              </tr>
            </thead>
            <tbody>
              {query.data.users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <button className="row-button" onClick={() => open(u)}>
                      {u.email ?? "Sin correo"}
                    </button>
                  </td>
                  <td>{u.role_name ?? "Sin asignación"}</td>
                  <td>
                    <span
                      className={`status-badge ${u.confirmed ? "published" : ""}`}
                    >
                      {u.confirmed ? "Confirmado" : "Invitado"}
                    </span>
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString("es")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {query.data && query.data.count > 25 && (
        <div className="pagination">
          <button
            className="button outline"
            disabled={!page}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </button>
          <span>{page + 1}</span>
          <button
            className="button outline"
            disabled={(page + 1) * 25 >= query.data.count}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
      {panel !== undefined && (
        <Drawer
          title={panel ? "Detalle de usuario" : "Crear usuario"}
          onClose={() => guard.request(close)}
        >
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              void save();
            }}
          >
            {panel ? (
              <>
                <h2 className="detail-title">{panel.email}</h2>
                <dl className="spec-list">
                  <div>
                    <dt>Estado</dt>
                    <dd>{panel.confirmed ? "Confirmado" : "Invitado"}</dd>
                  </div>
                  <div>
                    <dt>Creado</dt>
                    <dd>
                      {new Date(panel.created_at).toLocaleDateString("es")}
                    </dd>
                  </div>
                  <div>
                    <dt>Último acceso</dt>
                    <dd>
                      {panel.last_sign_in_at
                        ? new Date(panel.last_sign_in_at).toLocaleDateString(
                            "es",
                          )
                        : "Sin acceso registrado"}
                    </dd>
                  </div>
                </dl>
              </>
            ) : (
              <>
                <p className="muted">
                  Recibirá un enlace para confirmar su cuenta y establecer su
                  contraseña.
                </p>
                <label className="field">
                  Correo electrónico
                  <input
                    autoComplete="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
              </>
            )}
            <label className="field">
              Rol
              <select
                value={roleId}
                required
                disabled={
                  !!panel &&
                  (!auth.permissions.includes("users.assign_role") ||
                    panel.id === auth.user!.id)
                }
                onChange={(e) => setRoleId(e.target.value)}
              >
                <option value="">Seleccionar rol</option>
                {panel && !roles.data?.some((r) => r.id === panel.role_id) && (
                  <option value={panel.role_id ?? ""}>
                    {panel.role_name ?? "Sin asignación"}
                  </option>
                )}
                {roles.data?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            {panel?.id === auth.user!.id && (
              <p className="muted">Otro administrador debe modificar tu rol.</p>
            )}
            {roles.error && (
              <Notice>No se pudieron consultar los roles disponibles.</Notice>
            )}
            {error && <Notice>{error}</Notice>}
            {(!panel ||
              (auth.permissions.includes("users.assign_role") &&
                panel.id !== auth.user!.id)) && (
              <button
                className="button dark full"
                disabled={busy || !roleId || !!roles.error}
              >
                {busy
                  ? "Guardando…"
                  : panel
                    ? "Guardar cambios"
                    : "Enviar invitación"}
              </button>
            )}
          </form>
        </Drawer>
      )}
      {guard.dialog}
    </>
  );
}
