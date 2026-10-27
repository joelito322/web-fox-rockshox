import { AdminWorkspace } from "../features/admin/workspace";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useWorkspaceLinks } from "./workspace";
import { Suspense, useState } from "react";
import { Loading } from "../components/ui/Feedback";
import { useAuth } from "../features/auth/provider";
import { forgetAccountDrafts } from "../features/auth/drafts";
import { requireSupabase, userError } from "../lib/supabase";
import { BrandLogo } from "../components/BrandLogo";
import { MotionRegion } from "../components/ui/MotionRegion";
import { AccountMenu } from "./AccountMenu";
export function Brand() {
  return (
    <Link className="brand" to="/" aria-label="ATLAS MTB, inicio">
      <BrandLogo />
    </Link>
  );
}
export function Layout() {
  const auth = useAuth();
  const workspaceLink = useWorkspaceLinks();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const isWorkspace =
    /^\/(bicicletas|componentes|mis-bicicletas|comparar|configurador)/.test(
      location.pathname,
    );
  function logout() {
    const event = new CustomEvent("atlas:request-signout", {
      cancelable: true,
      detail: { continue: () => void performLogout() },
    });
    if (window.dispatchEvent(event)) void performLogout();
  }
  async function performLogout() {
    const accountId = auth.user?.id;
    navigate("/", { replace: true });
    sessionStorage.removeItem("atlas:intent");
    const { error } = await requireSupabase().auth.signOut();
    if (error) setError(userError(error));
    else {
      if (accountId) forgetAccountDrafts(accountId);
      navigate("/");
    }
  }
  return (
    <>
      <a className="skip-link" href="#main">
        Ir al contenido
      </a>
      <header
        className={`site-header${location.pathname === "/" ? " is-landing" : ""}`}
      >
        <Brand />
        <nav className="header-nav" aria-label="Navegación principal">
          <Link to="/componentes">Catálogo</Link>
          {auth.user ? (
            <AccountMenu onLogout={logout} />
          ) : (
            <Link className="button small dark" to="/entrar">
              Entrar <ArrowUpRight size={15} />
            </Link>
          )}
        </nav>
      </header>
      {isWorkspace && (
        <nav className="workspace-tabs" aria-label="Espacio de trabajo">
          <NavLink
            to={workspaceLink("/bicicletas")}
            className={() =>
              location.pathname.startsWith("/bicicletas") ? "active" : ""
            }
          >
            Bicicletas
          </NavLink>
          <NavLink
            to={workspaceLink("/componentes")}
            className={() =>
              location.pathname.startsWith("/componentes") ? "active" : ""
            }
          >
            Componentes
          </NavLink>
          <NavLink
            to={workspaceLink("/mis-bicicletas")}
            className={() =>
              location.pathname.startsWith("/mis-bicicletas") ? "active" : ""
            }
          >
            Mis bicicletas
          </NavLink>
        </nav>
      )}
      {error && (
        <p role="alert" className="notice">
          {error}
        </p>
      )}
      <main id="main">
        <Suspense fallback={<Loading />}>
          <MotionRegion
            className="route-content"
            motionKey={
              location.pathname.startsWith("/componentes")
                ? "/componentes"
                : location.pathname
            }
            disabled={location.pathname === "/"}
          >
            <AdminWorkspace
              scopeKey={`${auth.user?.id}:${[...auth.permissions].sort().join(":")}`}
            >
              <Outlet />
            </AdminWorkspace>
          </MotionRegion>
        </Suspense>
      </main>
      <footer
        className={`site-footer${location.pathname === "/" ? " is-landing" : ""}`}
      >
        <span>ATLAS MTB</span>
        <span>Enduro & Descenso</span>
        <span>Diseña tu próximo montaje.</span>
      </footer>
    </>
  );
}
