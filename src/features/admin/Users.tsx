import { SelectableRow } from "./SelectableRow";
import { useSearchParams } from "react-router-dom";
import { requireSupabase } from "../../lib/supabase";
import { useAdminState } from "./workspace";
import { useState, useEffect, useId, useRef, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { useAuth } from "../auth/provider";
import {
  accountOperation,
  listAccounts,
  adminStaleTime,
  grantableRoles,
  type Account,
  accountSchema,
} from "./api";
import { useUnsavedChanges } from "../../components/ui/UnsavedChanges";
import { Drawer } from "../../components/ui/Drawer";
import { Loading, Notice, Empty } from "../../components/ui/Feedback";
import { userError } from "../../lib/supabase";
import { useSearchFilters } from "./useSearchFilters";
export default function Users() {
  const [params, setParams] = useSearchParams();
  const formId = useId();
  const auth = useAuth();
  const cache = useQueryClient();
  const [search, setSearch] = useAdminState("users", "search", "");
  const [page, setPage] = useAdminState("users", "page", 0);
  const [selected, setSelected] = useAdminState("users", "selected", "");
  const [roleFilter, setRoleFilter] = useAdminState("users", "role", "");
  const [panel, setPanel] = useState<Account | null | undefined>();
  const panelRef = useRef(panel);
  panelRef.current = panel;
  const detailRequest = useRef(0);
  const detailId = params.get("detail");
  const pendingInvitation = useRef<{
    userId: string;
    roleId: string;
    email: string;
  } | null>(null);
  const [recoveryId, setRecoveryId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const filters = useSearchFilters(search, page, roleFilter);
  const query = useQuery({
    queryKey: [
      "admin-users",
      auth.user!.id,
      filters.search,
      filters.page,
      roleFilter,
    ],
    queryFn: ({ signal }) =>
      listAccounts(filters.search, filters.page, signal, roleFilter),
    staleTime: adminStaleTime,
  });
  const roles = useQuery({
    queryKey: ["grantable-roles", auth.user!.id],
    queryFn: grantableRoles,
    staleTime: adminStaleTime,
    enabled:
      auth.permissions.includes("users.assign_role") ||
      auth.permissions.includes("users.invite"),
  });
  const guard = useUnsavedChanges(
    panel !== undefined &&
      (email !== "" ||
        roleId !==
          (panel?.role_id ??
            roles.data?.find((r) => r.name === "Usuario")?.id ??
            "")),
    save,
    busy,
  );
  function resetPanel(account: Account | null | undefined) {
    panelRef.current = account;
    setPanel(account);
    if (account) setSelected(account.id);
    setRoleId(
      account?.role_id ??
        roles.data?.find((r) => r.name === "Usuario")?.id ??
        "",
    );
    setEmail("");
    setError("");
  }
  function close() {
    detailRequest.current++;
    resetPanel(undefined);
    if (detailId)
      setParams(
        (previous) => {
          previous.delete("detail");
          return previous;
        },
        { replace: true },
      );
  }
  function open(account: Account | null) {
    detailRequest.current++;
    resetPanel(account);
    const nextId = account?.id ?? null;
    if (nextId !== detailId)
      setParams(
        (previous) => {
          if (nextId) previous.set("detail", nextId);
          else previous.delete("detail");
          return previous;
        },
        { replace: true },
      );
  }
  useEffect(() => {
    if (panel === null && !roleId && roles.data)
      setRoleId(roles.data.find((r) => r.name === "Usuario")?.id ?? "");
  }, [panel, roleId, roles.data]);
  useEffect(() => {
    const request = ++detailRequest.current;
    if (!detailId) {
      // A locally opened invitation has no ID and must stay open.
      if (panelRef.current) resetPanel(undefined);
      return;
    }
    if (panelRef.current?.id === detailId) return;
    const controller = new AbortController();
    resetPanel(undefined);
    void (async () => {
      try {
        const { data, error } = await requireSupabase()
          .rpc("admin_user_detail", { p_id: detailId })
          .abortSignal(controller.signal);
        if (request !== detailRequest.current) return;
        if (error) throw error;
        const account = accountSchema.parse(data);
        resetPanel(account);
        if (pendingInvitation.current?.userId === account.id)
          setRoleId(pendingInvitation.current.roleId);
      } catch (error) {
        if (request === detailRequest.current && !controller.signal.aborted)
          setError(userError(error));
      }
    })();
    return () => {
      detailRequest.current++;
      controller.abort();
    };
  }, [detailId, auth.user!.id]);
  function recoverInvitation() {
    if (!recoveryId) return;
    if (panelRef.current?.id === recoveryId && pendingInvitation.current) {
      setRoleId(pendingInvitation.current.roleId);
      return;
    }
    setParams(
      (previous) => {
        previous.set("detail", recoveryId);
        return previous;
      },
      { replace: true },
    );
  }
  async function save() {
    if (busy) return false;
    if (
      panel &&
      roleId !== panel.role_id &&
      !confirm(
        `¿Cambiar el rol de «${panel.email ?? "esta cuenta"}» de «${panel.role_name ?? "Sin asignación"}» a «${roles.data?.find((r) => r.id === roleId)?.name ?? "el rol seleccionado"}»?`,
      )
    )
      return false;
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
      if (partial && "userId" in result && typeof result.userId === "string") {
        pendingInvitation.current = { userId: result.userId, roleId, email };
        setRecoveryId(result.userId);
      }
      setMessage(
        partial
          ? "Cuenta invitada; el rol solicitado está pendiente de asignar."
          : panel
            ? "Rol actualizado."
            : "Invitación enviada.",
      );
      await cache.invalidateQueries({
        queryKey: ["admin-users", auth.user!.id],
      });
      if (panel) {
        const assignment = result as { revision: number };
        setPanel({
          ...panel,
          role_id: roleId,
          role_name:
            roles.data?.find((r) => r.id === roleId)?.name ?? panel.role_name,
          revision: assignment.revision,
        });
        if (pendingInvitation.current?.userId === panel.id) {
          pendingInvitation.current = null;
          setRecoveryId("");
        }
      } else close();
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
            maxLength={254}
            placeholder="Buscar por correo…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </label>
        <select
          aria-label="Filtrar usuarios por rol"
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(0);
          }}
        >
          <option value="">Todos los roles</option>
          {query.data?.roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        {auth.permissions.includes("users.invite") && (
          <button className="button dark" onClick={() => guard.request(() => open(null))}>
            <Plus size={16} /> Crear usuario
          </button>
        )}
      </div>
      {message && panel === undefined && (
        <p role="status" className="success-notice">
          {message}
        </p>
      )}
      {recoveryId && (
        <button className="button outline" onClick={() => guard.request(recoverInvitation)}>
          Completar asignación de {pendingInvitation.current?.email}
        </button>
      )}
      {error && panel === undefined && <Notice>{error}</Notice>}
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
                <SelectableRow
                  key={u.id}
                  selected={selected === u.id}
                  onSelect={() => guard.request(() => open(u))}
                >
                  <td>
                    <button className="row-button" onClick={() => guard.request(() => open(u))}>
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
                </SelectableRow>
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
          busy={busy}
          footer={
            <>
              <button
                type="button"
                className="button outline"
                disabled={busy}
                onClick={() => guard.request(close)}
              >
                Cancelar
              </button>{" "}
              {(!panel ||
                (auth.permissions.includes("users.assign_role") &&
                  panel.id !== auth.user!.id)) && (
                <button
                  className="button dark"
                  form={formId}
                  disabled={busy || !roleId || !!roles.error}
                >
                  {busy
                    ? "Guardando…"
                    : panel
                      ? "Guardar cambios"
                      : "Enviar invitación"}
                </button>
              )}
            </>
          }
          title={panel ? "Detalle de usuario" : "Crear usuario"}
          onClose={() => guard.request(close)}
        >
          <form
            onChange={() => setMessage("")}
            id={formId}
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              void save();
            }}
          >
            <fieldset disabled={busy}>
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
                    !auth.permissions.includes("users.assign_role") ||
                    panel?.id === auth.user!.id
                  }
                  onChange={(e) => setRoleId(e.target.value)}
                >
                  <option value="">Seleccionar rol</option>
                  {panel &&
                    !roles.data?.some((r) => r.id === panel.role_id) && (
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
                <p className="muted">
                  Otro administrador debe modificar tu rol.
                </p>
              )}
              {!panel && !auth.permissions.includes("users.assign_role") && (
                <p className="muted">La invitación utiliza el rol Usuario.</p>
              )}
              {roles.error && (
                <Notice>No se pudieron consultar los roles disponibles.</Notice>
              )}
            </fieldset>
            {message && (
              <p role="status" className="success-notice">
                {message}
              </p>
            )}
            {error && <Notice>{error}</Notice>}
          </form>
        </Drawer>
      )}
      {guard.dialog}
    </>
  );
}
