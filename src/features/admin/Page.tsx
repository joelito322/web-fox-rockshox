import { useEffect } from "react";
import { Link, NavLink, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/provider";
import { RequirePermission } from "../auth/RequirePermission";
import { Loading } from "../../components/ui/Feedback";
import { useAdminState, useAdminScroll } from "./workspace";
import CommercialAdmin from "../commerce/Admin";
import Orders from "../commerce/Orders";
import Presets from "./Presets";
import Users from "./Users";
import Roles from "./Roles";
import Catalog from "./Catalog";
import "./admin.css";
const sections = [
  {
    key: "ofertas",
    label: "Ofertas",
    group: "Ventas",
    permission: "sales.offers.manage",
  },
  {
    key: "promociones",
    label: "Promociones",
    group: "Ventas",
    permission: "sales.promotions.manage",
  },
  {
    key: "pedidos",
    label: "Pedidos",
    group: "Ventas",
    permission: "sales.orders.manage",
  },
  {
    key: "catalogo",
    label: "Componentes",
    group: "Catálogo",
    permission: "catalog.manage",
  },
  {
    key: "marcas",
    label: "Marcas",
    group: "Catálogo",
    permission: "catalog.manage",
  },
  {
    key: "recursos",
    label: "Recursos 3D",
    group: "Catálogo",
    permission: "catalog.manage",
  },
  {
    key: "bicicletas",
    label: "Prearmadas",
    group: "Bicicletas",
    permission: "presets.manage",
  },
  {
    key: "usuarios",
    label: "Usuarios",
    group: "Accesos",
    permission: "users.read",
  },
  {
    key: "roles",
    label: "Roles",
    group: "Accesos",
    permission: "roles.manage",
  },
  {
    key: "permisos",
    label: "Permisos",
    group: "Accesos",
    permission: "roles.manage",
  },
];
export default function AdminPage() {
  const auth = useAuth();
  if (auth.loading) return <Loading />;
  return (
    <AdminContent
      key={`${auth.user?.id}:${[...auth.permissions].sort().join(":")}`}
    />
  );
}
function AdminContent() {
  const auth = useAuth();
  const { tab } = useParams();
  const available = sections.filter(
    (s) =>
      auth.permissions.includes(s.permission) ||
      (s.key === "pedidos" && auth.permissions.includes("sales.quotes.manage")),
  );
  const [last, setLast] = useAdminState("navigation", "section", "catalogo");
  const [visits, setVisits] = useAdminState<Record<string, string>>(
    "navigation",
    "groups",
    {},
  );
  const section = sections.find((s) => s.key === tab);
  useAdminScroll(section?.key ?? "entry");
  useEffect(() => {
    if (
      !section ||
      !(
        auth.permissions.includes(section.permission) ||
        (section.key === "pedidos" &&
          auth.permissions.includes("sales.quotes.manage"))
      )
    )
      return;
    setLast(section.key);
    setVisits((previous) =>
      previous[section.group] === section.key
        ? previous
        : { ...previous, [section.group]: section.key },
    );
  }, [section?.key]);
  if (!section)
    return (
      <Navigate
        replace
        to={`/administracion/${available.find((s) => s.key === last)?.key ?? available[0]?.key ?? "catalogo"}`}
      />
    );
  return (
    <RequirePermission
      permission={
        section.key === "pedidos" &&
        !auth.permissions.includes("sales.orders.manage")
          ? "sales.quotes.manage"
          : section.permission
      }
    >
      <div className="content admin-page">
        <div className="section-heading">
          <div>
            <h1>Administración</h1>
          </div>
          <Link className="back-link" to="/componentes">
            Volver al trabajo
          </Link>
        </div>
        <nav
          className="admin-tabs admin-groups"
          aria-label="Módulos de administración"
        >
          {[...new Set(available.map((s) => s.group))].map((group) => {
            const target =
              available.find(
                (s) => s.key === visits[group] && s.group === group,
              ) ?? available.find((s) => s.group === group)!;
            return (
              <Link
                key={group}
                className={section.group === group ? "active" : ""}
                aria-current={section.group === group ? "page" : undefined}
                to={`/administracion/${target.key}`}
              >
                {group}
              </Link>
            );
          })}
        </nav>
        <nav
          className="admin-tabs admin-sections"
          aria-label="Secciones de administración"
        >
          {available
            .filter((s) => s.group === section.group)
            .map((s) => (
              <NavLink key={s.key} to={`/administracion/${s.key}`}>
                {s.label}
              </NavLink>
            ))}
        </nav>
        {section.key === "ofertas" || section.key === "promociones" ? (
          <CommercialAdmin
            key={section.key}
            promotions={section.key === "promociones"}
          />
        ) : section.key === "pedidos" ? (
          <Orders admin />
        ) : section.key === "usuarios" ? (
          <Users />
        ) : section.key === "roles" || section.key === "permisos" ? (
          <Roles
            key={section.key}
            permissionsView={section.key === "permisos"}
          />
        ) : section.key === "bicicletas" ? (
          <Presets />
        ) : (
          <Catalog
            key={section.key}
            view={
              section.key === "marcas"
                ? "brand"
                : section.key === "recursos"
                  ? "asset"
                  : "component"
            }
          />
        )}
      </div>
    </RequirePermission>
  );
}
