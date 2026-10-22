import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase =
  url && key
    ? createClient(url, key, {
        global: {
          fetch: async (input, options = {}) => {
            const response = await fetch(input, {
              ...options,
              signal: options.signal
                ? AbortSignal.any([options.signal, AbortSignal.timeout(20000)])
                : AbortSignal.timeout(20000),
            });
            const address = input instanceof Request ? input.url : String(input);
            if (
              response.status === 403 &&
              typeof window !== "undefined" &&
              !address.includes("/rpc/get_my_access") &&
              (address.includes("/rest/v1/") || address.includes("/functions/v1/"))
            )
              queueMicrotask(() => window.dispatchEvent(new Event("atlas:access-denied")));
            return response;
          },
        },
        auth: {
          flowType: "pkce",
          detectSessionInUrl: false,
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null;
export function requireSupabase() {
  if (!supabase) throw new Error("connection_unavailable");
  return supabase;
}
export function userError(error: unknown): string {
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "";
  const messages: Record<string, string> = {
    invalid_credentials: "El correo o la contraseña no coinciden.",
    email_not_confirmed: "Confirma tu correo antes de entrar.",
    user_already_exists: "Revisa tu correo o inicia sesión con tu cuenta.",
    over_email_send_rate_limit:
      "Espera unos minutos antes de solicitar otro correo.",
    weak_password: "Elige una contraseña más segura.",
    otp_expired: "El enlace ha caducado. Solicita uno nuevo.",
    oauth_cancelled: "No se completó el acceso con Google. Puedes volver a intentarlo.",
    invalid_link: "El enlace no es válido o ha caducado. Vuelve a iniciar sesión.",
    flow_state_not_found: "El acceso ha caducado. Vuelve a iniciarlo desde este navegador.",
    flow_state_expired: "El acceso ha caducado. Vuelve a iniciarlo desde este navegador.",
    "42501": "Tu cuenta no tiene permiso para esta acción.",
    PT409: "Los datos cambiaron en otra sesión. Recarga antes de guardar.",
    P0002: "El registro ya no está disponible.",
  };
  const business: Record<string, string> = {
    published_parent_required:
      "Esta marca o modelo tiene referencias publicadas. Retíralas de nuevos montajes conservando su historial.",
    preset_positions_missing:
      "Completa todas las piezas del montaje antes de publicar la bicicleta.",
    publication_dependencies_missing:
      "Publica la marca, el modelo y su recurso visual antes de publicar esta variante.",
    published_variant_immutable:
      "Las medidas y los acabados de una variante publicada se conservan. Crea una nueva versión para cambiarlos.",
    published_identity_immutable:
      "La marca y la categoría de un modelo publicado se conservan.",
    invalid_sources: "Completa los enlaces y las fechas de las fuentes.",
    invalid_finishes:
      "Revisa los acabados y selecciona uno como acabado inicial.",
    invalid_price_reference:
      "Completa el importe, moneda, mercado, fecha y fuente del precio de referencia.",
    invalid_category_specifications:
      "Revisa las características y sus medidas antes de guardar.",
    factory_source_required:
      "Añade la fuente del montaje de fábrica antes de publicarlo.",
    frame_required: "Selecciona el cuadro antes de publicar la bicicleta.",
    variant_retired:
      "Esta variante está retirada. Elige una disponible para el nuevo montaje.",
    last_administrator_required:
      "Debe quedar al menos un administrador confirmado y habilitado.",
    self_assignment_forbidden: "Otro administrador debe modificar tu rol.",
    role_in_use:
      "El rol tiene usuarios asignados. Reasígnalos antes de eliminarlo o desactivarlo.",
    permission_dependency_missing:
      "Hay permisos que necesitan otras acciones. Revisa la selección antes de guardar.",
    role_not_grantable: "Tu cuenta no puede asignar o modificar ese rol.",
    role_protected: "Este rol está protegido y se muestra en lectura.",
    account_already_exists:
      "La cuenta ya existe. Abre su detalle para revisar el rol.",
    invitation_failed:
      "No se pudo enviar la invitación. Revisa la configuración del servicio de correo.",
    permission_denied: "Tu cuenta no tiene permiso para esta acción.",
    revision_conflict:
      "Los datos cambiaron en otra sesión. Recarga antes de guardar.",
  };
  const message =
    error && typeof error === "object" && "message" in error
      ? String(error.message)
      : "";
  return (
    business[message] ??
    business[code] ??
    messages[code] ??
    messages[message] ??
    "No se pudo completar la operación. Conservamos tus cambios; vuelve a intentarlo."
  );
}
