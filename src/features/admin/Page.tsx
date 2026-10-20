import { useAuth } from "../auth/provider";
import { RequirePermission } from "../auth/RequirePermission";
import Presets from "./Presets";
import Users from "./Users";
import Roles from "./Roles";
import Catalog from "./Catalog";
import { Loading } from "../../components/ui/Feedback";
import { Link, NavLink, Navigate, useParams } from "react-router-dom";
export default function AdminPage() {
  const auth = useAuth();
  const { tab } = useParams();
  if (auth.loading) return <Loading />;
  const allowed = [
    ["catalogo", "catalog.manage"],
    ["bicicletas", "presets.manage"],
    ["usuarios", "users.read"],
    ["roles", "roles.manage"],
  ].find(([, p]) => auth.permissions.includes(p));
  if (!tab && allowed)
    return <Navigate replace to={`/administracion/${allowed[0]}`} />;
  if (
    tab &&
    !["catalogo", "bicicletas", "usuarios", "roles", "permisos"].includes(tab)
  )
    return <Navigate replace to="/administracion" />;
  const section = tab ?? "catalogo";
  const permission =
    section === "usuarios"
      ? "users.read"
      : section === "roles" || section === "permisos"
        ? "roles.manage"
        : section === "bicicletas"
          ? "presets.manage"
          : "catalog.manage";
  return (
    <RequirePermission permission={permission}>
      <div className="content">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Administración</p>
            <h1>
              {section === "catalogo"
                ? "Catálogo"
                : section === "bicicletas"
                  ? "Bicicletas de referencia"
                  : section.charAt(0).toUpperCase() + section.slice(1)}
            </h1>
          </div>
          <Link className="back-link" to="/componentes">
            Volver al trabajo
          </Link>
        </div>
        <nav className="admin-tabs">
          {[
            ["catalogo", "Catálogo", "catalog.manage"],
            ["bicicletas", "Bicicletas de referencia", "presets.manage"],
            ["usuarios", "Usuarios", "users.read"],
            ["roles", "Roles", "roles.manage"],
            ["permisos", "Permisos", "roles.manage"],
          ]
            .filter((t) => auth.permissions.includes(t[2]))
            .map((t) => (
              <NavLink key={t[0]} to={`/administracion/${t[0]}`}>
                {t[1]}
              </NavLink>
            ))}
        </nav>
        {section === "usuarios" ? (
          <Users />
        ) : section === "roles" || section === "permisos" ? (
          <Roles key={section} permissionsView={section === "permisos"} />
        ) : section === "bicicletas" ? (
          <Presets />
        ) : (
          <Catalog />
        )}
      </div>
    </RequirePermission>
  );
}
