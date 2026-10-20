import { useCallback, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, LockKeyhole } from "lucide-react";
import { useAuth } from "../auth/provider";
import {
  matrix,
  saveRoles,
  deleteRole,
  permissionRequirement,
  type Role,
} from "./api";
import { useUnsavedChanges } from "../../components/ui/UnsavedChanges";
import { Drawer } from "../../components/ui/Drawer";
import { Loading, Notice } from "../../components/ui/Feedback";
import { userError } from "../../lib/supabase";
export default function Roles({
  permissionsView = false,
}: {
  permissionsView?: boolean;
}) {
  const auth = useAuth();
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ["roles-matrix", auth.user!.id],
    queryFn: matrix,
  });
  const [panel, setPanel] = useState<Role | null | undefined>();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [active, setActive] = useState(true);
  const [draft, setDraft] = useState<Record<string, string[]>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const data = query.data;
  const ownRole = data?.roles.find((r) => r.id === auth.roleId);
  const roleDirty =
    panel !== undefined &&
    (name !== (panel?.name ?? "") ||
      description !== (panel?.description ?? "") ||
      active !== (panel?.active ?? true) ||
      JSON.stringify([...codes].sort()) !==
        JSON.stringify([...(panel?.permissions ?? [])].sort()));
  const matrixDirty = !!data?.roles.some(
    (r) =>
      draft[r.id] &&
      JSON.stringify([...draft[r.id]].sort()) !==
        JSON.stringify([...r.permissions].sort()),
  );
  const guard = useUnsavedChanges(
    roleDirty || matrixDirty,
    () => (permissionsView ? saveMatrix() : saveRole()),
    busy,
  );
  const close = useCallback(() => {
    setPanel(undefined);
    setError("");
  }, []);
  function open(role: Role | null) {
    setPanel(role);
    setName(role?.name ?? "");
    setDescription(role?.description ?? "");
    setCodes(role?.permissions ?? []);
    setActive(role?.active ?? true);
    setError("");
  }
  const locked = (role: Role) =>
    role.is_system ||
    role.id === ownRole?.id ||
    role.permissions.some((p) => !auth.permissions.includes(p));
  async function saveRole() {
    if (!data) return false;
    const reason = permissionRequirement(codes, data.permissions);
    if (reason) {
      setError(reason);
      return false;
    }
    setBusy(true);
    setError("");
    try {
      await saveRoles([
        {
          ...(panel ? { id: panel.id, revision: panel.revision } : {}),
          name,
          description,
          permissions: codes,
          active,
        },
      ]);
      await cache.invalidateQueries({
        queryKey: ["roles-matrix", auth.user!.id],
      });
      setMessage("Rol guardado.");
      close();
      return true;
    } catch (e) {
      setError(userError(e));
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function saveMatrix() {
    if (!data) return false;
    const changes = data.roles.filter(
      (r) =>
        draft[r.id] &&
        JSON.stringify([...draft[r.id]].sort()) !==
          JSON.stringify([...r.permissions].sort()),
    );
    for (const r of changes) {
      const reason = permissionRequirement(draft[r.id], data.permissions);
      if (reason) {
        setError(`${r.name}: ${reason}`);
        return false;
      }
    }
    setBusy(true);
    setError("");
    try {
      await saveRoles(
        changes.map((r) => ({
          id: r.id,
          revision: r.revision,
          name: r.name,
          description: r.description,
          active: r.active,
          permissions: draft[r.id],
        })),
      );
      await cache.invalidateQueries({
        queryKey: ["roles-matrix", auth.user!.id],
      });
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
    try {
      await deleteRole(role);
      await cache.invalidateQueries({
        queryKey: ["roles-matrix", auth.user!.id],
      });
      close();
    } catch (e) {
      setError(userError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <Notice onRetry={() => void query.refetch()}>
          No se pudieron cargar los roles.
        </Notice>
      ) : (
        data && (
          <>
            <div className="admin-toolbar">
              <p className="muted">
                {permissionsView
                  ? "Los permisos se aplican por rol. Usuario y Administrador son de sistema."
                  : "Roles personalizados sobre las acciones disponibles."}
              </p>
              {permissionsView ? (
                <div className="inline-actions">
                  <button
                    className="button outline"
                    disabled={!matrixDirty || busy}
                    onClick={() => {
                      setDraft({});
                      setError("");
                    }}
                  >
                    Descartar
                  </button>
                  <button
                    className="button dark"
                    disabled={!matrixDirty || busy}
                    onClick={() => void saveMatrix()}
                  >
                    <Save size={16} /> Guardar cambios
                  </button>
                </div>
              ) : (
                <button className="button dark" onClick={() => open(null)}>
                  <Plus size={16} /> Crear rol
                </button>
              )}
            </div>
            {message && (
              <p role="status" className="success-notice">
                {message}
              </p>
            )}
            {error && <Notice>{error}</Notice>}
            {permissionsView ? (
              <div className="table-scroll">
                <table className="permission-table admin-table">
                  <thead>
                    <tr>
                      <th>Permiso / Área</th>
                      {data.roles.map((r) => (
                        <th key={r.id}>
                          {r.name}
                          {locked(r) && <LockKeyhole size={12} />}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.permissions.map((p, i) => (
                      <tr key={p.code}>
                        <th>
                          {i === 0 ||
                          data.permissions[i - 1].area !== p.area ? (
                            <small className="eyebrow">{p.area}</small>
                          ) : null}
                          <span>{p.name}</span>
                          <small>{p.description}</small>
                        </th>
                        {data.roles.map((r) => (
                          <td key={r.id}>
                            <input
                              type="checkbox"
                              aria-label={`${r.name}: ${p.name}`}
                              checked={(draft[r.id] ?? r.permissions).includes(
                                p.code,
                              )}
                              disabled={
                                locked(r) ||
                                !auth.permissions.includes(p.code) ||
                                busy
                              }
                              onChange={(e) => {
                                const previous = draft[r.id] ?? r.permissions;
                                setDraft({
                                  ...draft,
                                  [r.id]: e.target.checked
                                    ? [...previous, p.code]
                                    : previous.filter((c) => c !== p.code),
                                });
                              }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                    {data.roles.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <button
                            className="row-button"
                            onClick={() => open(r)}
                          >
                            {r.name}
                            {r.is_system && <LockKeyhole size={13} />}
                          </button>
                        </td>
                        <td>{r.description ?? "—"}</td>
                        <td>{r.active ? "Activo" : "Inactivo"}</td>
                        <td>{r.permissions.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {panel !== undefined && (
              <Drawer
                title={panel ? "Detalle de rol" : "Crear rol"}
                onClose={() => guard.request(close)}
              >
                <form
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    void saveRole();
                  }}
                >
                  <label className="field">
                    Nombre
                    <input
                      required
                      maxLength={80}
                      value={name}
                      disabled={!!panel && locked(panel)}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </label>
                  <label className="field">
                    Descripción
                    <textarea
                      value={description}
                      disabled={!!panel && locked(panel)}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </label>
                  <label className="checkbox-field">
                    <input
                      type="checkbox"
                      checked={active}
                      disabled={!!panel && locked(panel)}
                      onChange={(e) => setActive(e.target.checked)}
                    />{" "}
                    Activo
                  </label>
                  <h3>Permisos</h3>
                  <div className="permission-list">
                    {data.permissions.map((p) => (
                      <label key={p.code}>
                        <input
                          type="checkbox"
                          checked={codes.includes(p.code)}
                          disabled={
                            (!!panel && locked(panel)) ||
                            !auth.permissions.includes(p.code)
                          }
                          onChange={(e) =>
                            setCodes(
                              e.target.checked
                                ? [...codes, p.code]
                                : codes.filter((c) => c !== p.code),
                            )
                          }
                        />
                        <span>
                          {p.name}
                          <small>{p.area}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                  {panel && locked(panel) ? (
                    <p className="muted">Este rol se muestra en lectura.</p>
                  ) : (
                    <>
                      <button className="button dark full" disabled={busy}>
                        {busy ? "Guardando…" : "Guardar rol"}
                      </button>
                      {panel && (
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
                  )}
                  {error && <Notice>{error}</Notice>}
                </form>
              </Drawer>
            )}
          </>
        )
      )}
      {guard.dialog}
    </>
  );
}
