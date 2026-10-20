import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { ArrowUpRight, LogOut, UserRound } from "lucide-react";
import { useWorkspaceLinks } from "./workspace";
import { Suspense, useState } from "react";
import { Loading } from "../components/ui/Feedback";
import { useAuth } from "../features/auth/provider";
import { forgetAccountDrafts } from "../features/auth/drafts";
import { requireSupabase, userError } from "../lib/supabase";
export function Brand() {
  return (
    <Link className="brand" to="/" aria-label="ATLAS MTB, inicio">
      <svg viewBox="0 0 32 30" aria-hidden="true">
        <path d="M1 27 14 2l5 9 3-5 9 21h-9l-8-14-7 14Z" fill="currentColor" />
        <path d="m11 24 4-7 4 7Z" fill="var(--surface)" />
      </svg>
      <span>
        ATLAS<span className="brand-mtb">MTB</span>
      </span>
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
      <header className="site-header">
        <Brand />
        <nav className="header-nav" aria-label="Navegación principal">
          <Link to="/componentes">Catálogo</Link>
          {auth.user ? (
            <>
              <Link to="/mis-bicicletas">
                <UserRound size={16} />
                <span className="account-label">Mi cuenta</span>
              </Link>
              {auth.permissions.some((p) =>
                /^(catalog|presets|users|roles)\./.test(p),
              ) && <Link to="/administracion">Administración</Link>}
              <button
                className="icon-button"
                aria-label="Cerrar sesión"
                onClick={() => void logout()}
              >
                <LogOut size={18} />
              </button>
            </>
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
          <Outlet />
        </Suspense>
      </main>
      <footer className="site-footer">
        <span>ATLAS MTB</span>
        <span>Enduro & Descenso</span>
        <span>Diseña tu próximo montaje.</span>
      </footer>
    </>
  );
}
