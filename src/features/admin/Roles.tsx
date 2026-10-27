import { SelectableRow } from "./SelectableRow";
import { useEffect, useId, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, LockKeyhole } from "lucide-react";
import { useAuth } from "../auth/provider";
import {
  matrix,
  adminStaleTime,
  saveRoles,
  deleteRole,
  permissionRequirement,
  type Role,
} from "./api";
import { useAdminState } from "./workspace";
import { useUnsavedChanges } from "../../components/ui/UnsavedChanges";
import { Drawer } from "../../components/ui/Drawer";
import { Loading, Notice, Empty } from "../../components/ui/Feedback";
import { userError } from "../../lib/supabase";
export default function Roles({
  permissionsView = false,
}: {
  permissionsView?: boolean;
}) {
  const auth = useAuth(),
    cache = useQueryClient(),
    navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const formId = useId();
  const query = useQuery({
    queryKey: ["roles-matrix", auth.user!.id],
    queryFn: matrix,
    staleTime: adminStaleTime,
  });
  const [panel, setPanel] = useState<Role | null | undefined>();
  const [name, setName] = useState(""),
    [description, setDescription] = useState(""),
    [active, setActive] = useState(true);
  const [draft, setDraft] = useState<Record<string, Role>>({});
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const [search, setSearch] = useAdminState(
    permissionsView ? "matrix" : "roles",
    "search",
    "",
  );
  const [selected, setSelected] = useAdminState("roles", "selected", "");
  const [area, setArea] = useAdminState("matrix", "area", "");
  const data = query.data;
  const equal = (a: string[], b: string[]) =>
    JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
  const changes = Object.values(draft).filter(
    (r) =>
      !equal(
        r.permissions,
        data?.roles.find((saved) => saved.id === r.id)?.permissions ?? [],
      ),
  );
  const roleDirty =
    panel !== undefined &&
    (name !== (panel?.name ?? "") ||
      description !== (panel?.description ?? "") ||
      active !== (panel?.active ?? true));
  const guard = useUnsavedChanges(
    roleDirty || changes.length > 0,
    () => (permissionsView ? saveMatrix() : saveRole()),
    busy,
  );
  const locked = (role: Role) =>
    role.is_system ||
    role.id === auth.roleId ||
    role.permissions.some((code) => !auth.permissions.includes(code));
  function close() {
    setPanel(undefined);
    setParams(
      (previous) => {
        previous.delete("detail");
        return previous;
      },
      { replace: true },
    );
    setError("");
  }
  function open(role: Role | null) {
    setPanel(role);
    if (role) setSelected(role.id);
    if (role)
      setParams(
        (previous) => {
          previous.set("detail", role.id);
          return previous;
        },
        { replace: true },
      );
    setName(role?.name ?? "");
    setDescription(role?.description ?? "");
    setActive(role?.active ?? true);
    setError("");
    setMessage("");
  }
  const [rolePage, setRolePage] = useAdminState("matrix", "page", 0);
  const rolePageSize = 8;
  const roleTarget = params.get("role");
  useEffect(() => {
    if (!permissionsView || !roleTarget || !data) return;
    const index = data.roles.findIndex((role) => role.id === roleTarget);
    if (index >= 0) setRolePage(Math.floor(index / rolePageSize));
  }, [permissionsView, roleTarget, data]);
  useEffect(() => {
    const target = roleTarget;
    if (permissionsView && target && data) {
      const heading = document.getElementById(`role-${target}`);
      heading?.focus({ preventScroll: true });
      heading?.scrollIntoView({ block: "nearest", inline: "center" });
    }
  }, [permissionsView, roleTarget, data, rolePage]);
  const detailId = params.get("detail");
  useEffect(() => {
    if (permissionsView || !data) return;
    const id = detailId;
    if (!id) return;
    if (panel?.id === id) return;
    const role = data.roles.find((r) => r.id === id);
    if (role) open(role);
    else setError("El rol ya no está disponible.");
  }, [data, detailId]);
  useEffect(() => {
    if (!detailId) setPanel(undefined);
  }, [detailId]);
  function updated(saved: Awaited<ReturnType<typeof saveRoles>>) {
    cache.setQueryData(["roles-matrix", auth.user!.id], saved);
    void cache.invalidateQueries({
      queryKey: ["grantable-roles", auth.user!.id],
    });
    void cache.invalidateQueries({ queryKey: ["admin-users", auth.user!.id] });
  }
  async function saveRole() {
    if (!data || busy || (panel && locked(panel))) return false;
    if (
      panel?.active &&
      !active &&
      !confirm(`¿Desactivar el rol «${panel.name}»? Sus usuarios perderán los accesos concedidos por este rol.`)
    ) return false;
    setBusy(true);
    setError("");
    try {
      // Metadata edits preserve the confirmed permissions and revision of the opened role.
      const saved = await saveRoles([
        {
          ...(panel ? { id: panel.id, revision: panel.revision } : {}),
          name,
          description,
          active,
          permissions: panel?.permissions ?? [],
        },
      ]);
      updated(saved);
      const current = saved.roles.find((r) =>
        panel ? r.id === panel.id : r.name === name.trim(),
      );
      if (current) {
        setPanel(current);
        setName(current.name);
        setDescription(current.description ?? "");
        setActive(current.active);
      }
      setMessage("Rol guardado.");
      return true;
    } catch (e) {
      setError(userError(e));
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function saveMatrix() {
    if (!data || busy || !changes.length) return false;
    for (const role of changes) {
      const reason = permissionRequirement(role.permissions, data.permissions);
      if (reason) {
        setError(`${role.name}: ${reason}`);
        return false;
      }
    }
    setBusy(true);
    setError("");
    try {
      updated(await saveRoles(changes));
      setDraft({});
      setMessage("Permisos guardados.");
      return true;
    } catch (e) {
      setError(userError(e));
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function remove(role: Role) {
    if (
      !confirm(
        `¿Eliminar el rol «${role.name}»? Solo se permite si no tiene usuarios asignados.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await deleteRole(role);
      await cache.invalidateQueries({
        queryKey: ["roles-matrix", auth.user!.id],
      });
      void cache.invalidateQueries({
        queryKey: ["grantable-roles", auth.user!.id],
      });
      close();
    } catch (e) {
      setError(userError(e));
    } finally {
      setBusy(false);
    }
  }
  if (query.isPending) return <Loading />;
  if (query.error || !data)
    return (
      <Notice onRetry={() => void query.refetch()}>
        No se pudieron cargar los roles.
      </Notice>
    );
  const lastRolePage = Math.max(
    0,
    Math.ceil(data.roles.length / rolePageSize) - 1,
  );
  const currentRolePage = Math.min(rolePage, lastRolePage);
  const matrixRoles = data.roles.slice(
    currentRolePage * rolePageSize,
    (currentRolePage + 1) * rolePageSize,
  );
  const visiblePermissions = data.permissions.filter(
    (p) =>
      (!area || p.area === area) &&
      `${p.name} ${p.area} ${p.description}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
  );
  const visibleRoles = data.roles.filter((r) =>
    `${r.name} ${r.description ?? ""}`
      .toLocaleLowerCase()
      .includes(search.toLocaleLowerCase()),
  );
  const count = changes.reduce((total, r) => {
    const previous = data.roles.find((v) => v.id === r.id)?.permissions ?? [];
    return (
      total +
      new Set(
        [...r.permissions, ...previous].filter(
          (code) => r.permissions.includes(code) !== previous.includes(code),
        ),
      ).size
    );
  }, 0);
  const pendingReason = changes
    .map((role) => permissionRequirement(role.permissions, data.permissions))
    .find(Boolean);
  return (
    <>
      <div
        className={`admin-toolbar${permissionsView ? " matrix-toolbar" : ""}`}
      >
        <label className="search-input">
          <input
            aria-label={permissionsView ? "Buscar permisos" : "Buscar roles"}
            placeholder={permissionsView ? "Buscar permisos…" : "Buscar roles…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        {permissionsView ? (
          <>
            <select
              aria-label="Filtrar módulo de permisos"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            >
              <option value="">Todos los módulos</option>
              {[...new Set(data.permissions.map((p) => p.area))].map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
            <span role="status">
              {count ? `${count} cambios pendientes` : "Sin cambios pendientes"}
            </span>
            <div className="inline-actions">
              <button
                className="button outline"
                disabled={!changes.length || busy}
                onClick={() => {
                  setDraft({});
                  setError("");
                }}
              >
                Descartar
              </button>
              <button
                className="button dark"
                disabled={!changes.length || busy || !!pendingReason}
                onClick={() => void saveMatrix()}
              >
                <Save size={16} />
                {busy ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </>
        ) : (
          <button
            className="button dark"
            onClick={() => guard.request(() => open(null))}
          >
            <Plus size={16} />
            Crear rol
          </button>
        )}
      </div>
      {message && !panel && (
        <p role="status" className="success-notice">
          {message}
        </p>
      )}
      {pendingReason && <Notice>{pendingReason}</Notice>}
      {permissionsView && changes.length > 0 && (
        <p className="muted">
          Los cambios se aplicarán a todas las cuentas con estos roles.
        </p>
      )}
      {error && panel === undefined && <Notice>{error}</Notice>}
      {permissionsView && data.roles.length > rolePageSize && (
        <nav className="pagination" aria-label="Páginas de roles de permisos">
          <button className="button outline" disabled={!currentRolePage} onClick={() => setRolePage(currentRolePage - 1)}>Roles anteriores</button>
          <span>{currentRolePage + 1} / {lastRolePage + 1}</span>
          <button className="button outline" disabled={currentRolePage >= lastRolePage} onClick={() => setRolePage(currentRolePage + 1)}>Roles siguientes</button>
        </nav>
      )}
      {permissionsView ? (
        <div className="table-scroll permission-scroll">
          <table className="permission-table admin-table">
            <thead>
              <tr>
                <th>Permiso / Área</th>
                {matrixRoles.map((r) => (
                  <th key={r.id} id={`role-${r.id}`} tabIndex={-1}>
                    {r.name}
                    {locked(r) && <LockKeyhole size={12} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visiblePermissions.map((p, i) => (
                <tr key={p.code}>
                  <th>
                    {(!i || visiblePermissions[i - 1].area !== p.area) && (
                      <small className="eyebrow">{p.area}</small>
                    )}
                    <span>{p.name}</span>
                    <small>{p.description}</small>
                  </th>
                  {matrixRoles.map((r) => (
                    <td key={r.id}>
                      <input
                        type="checkbox"
                        aria-label={`${r.name}: ${p.name}`}
                        disabled={
                          busy ||
                          locked(r) ||
                          !auth.permissions.includes(p.code)
                        }
                        checked={(draft[r.id] ?? r).permissions.includes(
                          p.code,
                        )}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setDraft((previous) => {
                            const original =
                              previous[r.id] ?? structuredClone(r);
                            return {
                              ...previous,
                              [r.id]: {
                                ...original,
                                permissions: checked
                                  ? [...original.permissions, p.code]
                                  : original.permissions.filter(
                                      (c) => c !== p.code,
                                    ),
                              },
                            };
                          });
                          setMessage("");
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {!visiblePermissions.length && (
            <Empty title="Sin permisos en esta búsqueda" />
          )}
        </div>
      ) : (
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Rol</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Permisos</th>
              </tr>
            </thead>
            <tbody>
              {visibleRoles.map((r) => (
                <SelectableRow
                  key={r.id}
                  selected={selected === r.id}
                  onSelect={() => guard.request(() => open(r))}
                >
                  <td>
                    <button
                      className="row-button"
                      onClick={() => guard.request(() => open(r))}
                    >
                      {r.name}
                      {r.is_system && <LockKeyhole size={13} />}
                    </button>
                  </td>
                  <td>{r.description ?? "—"}</td>
                  <td>{r.active ? "Activo" : "Inactivo"}</td>
                  <td>{r.permissions.length}</td>
                </SelectableRow>
              ))}
            </tbody>
          </table>
          {!visibleRoles.length && <Empty title="Sin roles en esta búsqueda" />}
        </div>
      )}
      {panel !== undefined && (
        <Drawer
          busy={busy}
          title={panel ? "Detalle de rol" : "Crear rol"}
          onClose={() => guard.request(close)}
          footer={
            <>
              <button
                type="button"
                className="button outline"
                disabled={busy}
                onClick={() => guard.request(close)}
              >
                Cancelar
              </button>
              {(!panel || !locked(panel)) && (
                <button
                  className="button dark"
                  form={formId}
                  disabled={busy || !roleDirty}
                >
                  {busy ? "Guardando…" : "Guardar rol"}
                </button>
              )}
            </>
          }
        >
          <form
            onChange={() => setMessage("")}
            id={formId}
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              void saveRole();
            }}
          >
            <fieldset disabled={busy || (!!panel && locked(panel))}>
              <label className="field">
                Nombre
                <input
                  required
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label className="field">
                Descripción
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                Activo
              </label>
            </fieldset>
            {panel ? (
              <>
                <p>{panel.permissions.length} permisos asignados</p>
                <button
                  type="button"
                  className="text-button"
                  onClick={() =>
                    guard.request(() =>
                      navigate(
                        `/administracion/permisos?role=${panel.id}#role-${panel.id}`,
                      ),
                    )
                  }
                >
                  Configurar permisos →
                </button>
                {locked(panel) ? (
                  <p className="muted">Este rol se muestra en lectura.</p>
                ) : (
                  <button
                    type="button"
                    className="text-button danger"
                    disabled={busy}
                    onClick={() => void remove(panel)}
                  >
                    Eliminar rol
                  </button>
                )}
              </>
            ) : (
              <p className="muted">
                Configura sus permisos después de crear el rol.
              </p>
            )}
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
