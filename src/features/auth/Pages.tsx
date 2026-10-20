import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, ArrowUpRight, MailCheck } from "lucide-react";
import { BikeIllustration } from "../../components/BikeIllustration";
import { Loading, Notice } from "../../components/ui/Feedback";
import { requireSupabase, userError } from "../../lib/supabase";
import { defaultDestination, readIntent, useAuth } from "./provider";

function Password({
  id,
  label,
  value,
  onChange,
  confirm = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  confirm?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="field" htmlFor={id}>
      {label}
      <span className="password-field">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={
            confirm
              ? "new-password"
              : id === "login-password"
                ? "current-password"
                : "new-password"
          }
          minLength={id === "login-password" ? undefined : 12}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={`${visible ? "Ocultar" : "Mostrar"} ${label.toLowerCase()}`}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </label>
  );
}
export default function AuthPage({
  mode,
}: {
  mode: "login" | "register" | "recover" | "password";
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();
  const title = {
    login: "Iniciar sesión",
    register: "Crear cuenta",
    recover: "Recuperar acceso",
    password: "Nueva contraseña",
  }[mode];
  useEffect(() => {
    if (mode === "login" && auth.user && !auth.loading && !auth.error) {
      const intent = readIntent();
      sessionStorage.removeItem("atlas:intent");
      navigate(
        intent &&
          auth.permissions.includes(
            intent.startsWith("/configurador")
              ? "configurator.use"
              : "builds.read_own",
          )
          ? intent
          : defaultDestination(auth.permissions),
        { replace: true },
      );
    }
  }, [auth.user, auth.loading, auth.error, mode, navigate, auth.permissions]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if ((mode === "register" || mode === "password") && password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setBusy(true);
    try {
      const client = requireSupabase();
      if (mode === "login") {
        const { error } = await client.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      if (mode === "register") {
        const { error } = await client.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${location.origin}/auth/callback` },
        });
        if (error) throw error;
        setSent(true);
      }
      if (mode === "recover") {
        const { error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: `${location.origin}/auth/callback`,
        });
        if (error) throw error;
        setSent(true);
      }
      if (mode === "password") {
        const { error } = await client.auth.updateUser({ password });
        if (error) throw error;
        navigate("/entrar", { replace: true });
      }
    } catch (error) {
      setError(userError(error));
    } finally {
      setBusy(false);
    }
  }
  async function resend() {
    setBusy(true);
    setError("");
    try {
      const { error } = await requireSupabase().auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (error) {
      setError(userError(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <aside className="auth-art">
        <span className="eyebrow">Un montaje propio.</span>
        <BikeIllustration />
        <div>
          <h2>
            Elige tu próxima
            <br />
            línea.
          </h2>
          <p>ENDURO / DESCENSO</p>
        </div>
      </aside>
      <section className="auth-form">
        <Link className="back-link" to="/componentes">
          <ArrowLeft size={16} /> Volver al catálogo
        </Link>
        {sent ? (
          <div className="sent-state">
            <MailCheck size={38} />
            <h1>Revisa tu correo</h1>
            <p>
              Si corresponde, recibirás un enlace en <strong>{email}</strong>{" "}
              para{" "}
              {mode === "recover"
                ? "recuperar tu acceso"
                : "confirmar tu cuenta"}
              .
            </p>
            {mode === "register" && (
              <button
                className="button dark"
                disabled={busy}
                onClick={() => void resend()}
              >
                Reenviar correo
              </button>
            )}
            <Link to="/entrar">Volver a iniciar sesión</Link>
          </div>
        ) : (
          <>
            <p className="eyebrow">ATLAS MTB</p>
            <h1>{title}</h1>
            <p className="muted">
              {mode === "login"
                ? "Tu próximo montaje te espera."
                : mode === "register"
                  ? "Un espacio para tus bicicletas."
                  : mode === "password"
                    ? "Elige una contraseña de al menos 12 caracteres."
                    : "Te enviaremos un enlace para volver a entrar."}
            </p>
            <form onSubmit={(e) => void submit(e)}>
              {mode !== "password" && (
                <label className="field">
                  Correo electrónico
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                  />
                </label>
              )}
              {mode !== "recover" && (
                <Password
                  id={mode === "login" ? "login-password" : "new-password"}
                  label="Contraseña"
                  value={password}
                  onChange={setPassword}
                />
              )}
              {(mode === "register" || mode === "password") && (
                <>
                  <small>Al menos 12 caracteres.</small>
                  <Password
                    id="confirm-password"
                    label="Confirmar contraseña"
                    value={confirm}
                    onChange={setConfirm}
                    confirm
                  />
                </>
              )}
              {mode === "login" && (
                <Link className="forgot" to="/recuperar">
                  ¿Olvidaste tu contraseña?
                </Link>
              )}
              {error && <Notice>{error}</Notice>}
              {auth.error && <Notice>{auth.error}</Notice>}
              <button className="button dark full" disabled={busy}>
                {busy
                  ? "Procesando…"
                  : {
                      login: "Entrar",
                      register: "Crear cuenta",
                      recover: "Enviar enlace",
                      password: "Guardar contraseña",
                    }[mode]}
                <ArrowUpRight size={18} />
              </button>
            </form>
            {mode === "login" && (
              <p className="auth-switch">
                ¿Primera vez en ATLAS? <Link to="/registro">Crear cuenta</Link>
              </p>
            )}
            {mode === "register" && (
              <p className="auth-switch">
                ¿Ya tienes cuenta? <Link to="/entrar">Iniciar sesión</Link>
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
let callbackTask: Promise<"email" | "recovery" | "invite"> | undefined;
function verifyCallback() {
  if (callbackTask) return callbackTask;
  const params = new URLSearchParams(location.search);
  const hash = params.get("token_hash");
  const type = params.get("type");
  history.replaceState(null, "", "/auth/callback");
  callbackTask = (async () => {
    if (!hash || (type !== "email" && type !== "recovery" && type !== "invite"))
      throw new Error("invalid_link");
    const { error } = await requireSupabase().auth.verifyOtp({
      token_hash: hash,
      type,
    });
    if (error) throw error;
    return type;
  })();
  return callbackTask;
}
export function AuthCallback() {
  const [error, setError] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    let active = true;
    void verifyCallback()
      .then((type) => {
        if (active)
          navigate(type === "email" ? "/entrar" : "/nueva-contrasena", {
            replace: true,
          });
      })
      .catch((error) => {
        if (active) setError(userError(error));
      });
    return () => {
      active = false;
    };
  }, [navigate]);
  return error ? (
    <div className="content narrow">
      <h1>Enlace no disponible</h1>
      <Notice>{error}</Notice>
      <Link className="button dark" to="/recuperar">
        Solicitar otro enlace
      </Link>
    </div>
  ) : (
    <Loading label="Verificando enlace" />
  );
}
