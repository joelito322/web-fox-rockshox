import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BadgeCheck,
  Bike,
  ChevronDown,
  LogOut,
  Settings2,
  UserRound,
} from "lucide-react";
import { useAuth } from "../features/auth/provider";
import "./account-menu.css";

export function AccountMenu({ onLogout }: { onLogout: () => void }) {
  const { user, permissions, roleName, loading, error } = useAuth();
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [location.key, user?.id]);
  useEffect(() => {
    if (!open) return;
    function outside(event: Event) {
      if (
        event.target instanceof Node &&
        !container.current?.contains(event.target)
      )
        setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        trigger.current?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  if (!user) return null;
  const rawName: unknown =
    user.user_metadata?.full_name ?? user.user_metadata?.name;
  const name = typeof rawName === "string" ? rawName.trim() : "";
  const google = user.identities?.some(
    (identity) => identity.provider === "google",
  );
  return (
    <div className="account-menu" ref={container}>
      <button
        ref={trigger}
        type="button"
        className="account-trigger"
        aria-label="Mi cuenta"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <UserRound size={18} aria-hidden="true" />
        <span className="account-trigger-label">
          {name.split(/\s+/)[0] || "Mi cuenta"}
        </span>
        <ChevronDown className="account-chevron" size={13} aria-hidden="true" />
      </button>
      {open && (
        <section
          className="account-panel"
          id={panelId}
          aria-label="Cuenta activa"
        >
          <div className="account-identity">
            <p className="account-caption">Cuenta activa</p>
            {name && <p className="account-name">{name}</p>}
            <p className="account-email">{user.email}</p>
            <div className="account-details">
              <span>
                {error
                  ? "Acceso por comprobar"
                  : loading
                    ? "Comprobando acceso…"
                    : roleName || "Sin rol asignado"}
              </span>
              {user.email_confirmed_at && (
                <span>
                  <BadgeCheck size={13} aria-hidden="true" /> Correo confirmado
                </span>
              )}
            </div>
            {google && <p className="account-provider">Google vinculado</p>}
          </div>
          <div className="account-actions">
            <Link to="/mis-pedidos" onClick={() => setOpen(false)}>
              Mis pedidos
            </Link>
            {permissions.includes("builds.read_own") && (
              <Link to="/mis-bicicletas" onClick={() => setOpen(false)}>
                <Bike size={16} aria-hidden="true" /> Mis bicicletas
              </Link>
            )}
            {permissions.some((permission) =>
              /^(catalog|presets|users|roles|sales)\./.test(permission),
            ) && (
              <Link to="/administracion" onClick={() => setOpen(false)}>
                <Settings2 size={16} aria-hidden="true" /> Administración
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
            >
              <LogOut size={16} aria-hidden="true" /> Cerrar sesión
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
