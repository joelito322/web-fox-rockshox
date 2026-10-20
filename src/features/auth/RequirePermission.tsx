import { Link, Navigate, useLocation } from "react-router-dom";
import { Loading, Notice } from "../../components/ui/Feedback";
import { defaultDestination, useAuth } from "./provider";

export function RequirePermission({
  permission,
  children,
}: {
  permission: string;
  children: React.ReactNode;
}) {
  const auth = useAuth();
  const location = useLocation();
  if (auth.loading) return <Loading label="Comprobando acceso" />;
  if (!auth.user) {
    sessionStorage.setItem("atlas:intent", location.pathname + location.search);
    return <Navigate replace to="/entrar" />;
  }
  if (auth.error)
    return <Notice onRetry={() => void auth.refresh()}>{auth.error}</Notice>;
  if (!auth.permissions.includes(permission))
    return (
      <div className="content narrow">
        <h1>Acceso no disponible</h1>
        <p>Tu cuenta no tiene permiso para esta acción.</p>
        <Link className="button dark" to={defaultDestination(auth.permissions)}>
          Volver a mi espacio
        </Link>
      </div>
    );
  return <>{children}</>;
}
