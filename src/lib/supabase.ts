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
            const address =
              input instanceof Request ? input.url : String(input);
            if (
              response.status === 403 &&
              typeof window !== "undefined" &&
              !address.includes("/rpc/get_my_access") &&
              (address.includes("/rest/v1/") ||
                address.includes("/functions/v1/"))
            )
              queueMicrotask(() =>
                window.dispatchEvent(new Event("atlas:access-denied")),
              );
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
    oauth_cancelled:
      "No se completó el acceso con Google. Puedes volver a intentarlo.",
    invalid_link:
      "El enlace no es válido o ha caducado. Vuelve a iniciar sesión.",
    flow_state_not_found:
      "El acceso ha caducado. Vuelve a iniciarlo desde este navegador.",
    flow_state_expired:
      "El acceso ha caducado. Vuelve a iniciarlo desde este navegador.",
    "42501": "Tu cuenta no tiene permiso para esta acción.",
    PT409: "Los datos cambiaron en otra sesión. Recarga antes de guardar.",
    P0002: "El registro ya no está disponible.",
  };
  const business: Record<string, string> = {
    sales_variant_unavailable:
      "Vincula una versión publicada y actual. Las versiones históricas ya asociadas se conservan.",
    sales_invalid_stock:
      "El stock debe ser un entero entre cero y un millón de unidades.",
    sales_invalid_date: "Revisa la fecha y hora de la promoción.",
    sales_unit_mismatch:
      "Usa unidad para piezas individuales, pareja para pedales y conjunto para bielas/plato o cambio/mando.",
    sales_account_changed:
      "La cuenta cambió durante la operación. Vuelve a revisar tu selección.",
    sales_account_disabled:
      "Confirma tu cuenta y comprueba que siga habilitada para continuar.",
    sales_empty_selection: "Añade al menos un componente vendible.",
    sales_invalid_selection:
      "Revisa los componentes seleccionados y sus cantidades.",
    sales_duplicate_offer:
      "Agrupa las cantidades del mismo producto antes de continuar.",
    sales_invalid_quantity: "La cantidad debe ser un entero entre 1 y 99.",
    sales_offer_unavailable:
      "Una pieza ya no está a la venta. Revisa tu selección.",
    sales_invalid_discount:
      "El descuento debe conservar un precio final positivo para todas las ofertas.",
    sales_contact_required:
      "Completa el destinatario y un correo o teléfono de contacto.",
    sales_address_required:
      "Completa dirección, distrito o ciudad y región para cotizar el envío.",
    sales_quote_expired:
      "La cotización venció o fue sustituida. Solicita una nueva versión.",
    sales_quote_changed:
      "Los datos no coinciden con la cotización. Solicita una nueva versión.",
    sales_quote_required:
      "El envío necesita cotización antes de crear el pedido.",
    sales_price_changed:
      "El precio cambió. Revisa y acepta un resumen actualizado.",
    sales_insufficient_stock:
      "La disponibilidad cambió. Revisa la cantidad de las piezas.",
    sales_reserved_stock:
      "El stock no puede quedar por debajo de las reservas vigentes.",
    sales_cart_changed:
      "Tu carrito cambió. Revisa el resumen de nuevo antes de continuar.",
    sales_idempotency_conflict:
      "Esta operación ya se envió con otros datos. Recupera su resultado antes de repetirla.",
    sales_order_expired_or_closed:
      "El pedido venció o ya cambió de estado. Actualiza sus datos.",
    sales_transition_denied: "El estado actual no permite esa acción.",
    sales_identity_mismatch:
      "Las versiones vinculadas deben representar el mismo producto, medida y acabado.",
    sales_identity_in_use:
      "La identidad de una oferta vinculada se conserva. Crea otro SKU para un producto diferente.",
    sales_variant_already_linked:
      "La versión y el acabado ya pertenecen a otra oferta.",
    sales_assembly_selection_required:
      "Elige un montaje cuyas piezas coincidan con esta selección. Los extras se compran por separado.",
    sales_quote_cost_required:
      "Define los importes de armado y entrega antes de publicar.",
    sales_operation_pending: "Espera a que termine la operación actual.",
    sales_invalid_amount:
      "Introduce un importe válido con hasta dos decimales.",
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
