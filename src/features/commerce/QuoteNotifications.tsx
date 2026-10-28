import { useState } from "react";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "../auth/provider";
import { Drawer } from "../../components/ui/Drawer";
import { userError } from "../../lib/supabase";
import { salesRpc } from "./api";
import { money } from "./model";

const noticesSchema = z.object({
  count: z.number().int().nonnegative(),
  items: z.array(
    z.object({
      id: z.guid(),
      revision: z.number().int(),
      version: z.number().int(),
      status: z.string(),
      assembly_requested: z.boolean(),
      assembly_base_fee_cents: z.number().nullable(),
      assembly_fee_cents: z.number().nullable(),
    }),
  ),
});

export function QuoteNotifications() {
  const auth = useAuth();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const key = ["sales", "quote-notices", auth.user?.id];
  const query = useQuery({
    queryKey: key,
    enabled: !!auth.user && !auth.loading && !!auth.roleId,
    queryFn: ({ signal }) =>
      salesRpc("sales_quote_notices", {}, noticesSchema, signal, auth.user?.id),
    staleTime: 30_000,
    refetchInterval: 45_000,
    refetchIntervalInBackground: false,
  });
  async function mark(id: string, revision: number) {
    setBusy(true);
    setError("");
    try {
      const next = await salesRpc(
        "sales_quote_notices",
        { p_id: id, p_revision: revision },
        noticesSchema,
        undefined,
        auth.user?.id,
      );
      client.setQueryData(key, next);
    } catch (error) {
      setError(userError(error));
    } finally {
      setBusy(false);
    }
  }
  if (!auth.user) return null;
  const count = query.data?.count ?? 0;
  return (
    <>
      <button
        className="text-button sales-notification-trigger"
        aria-label={`Notificaciones · ${count}`}
        onClick={() => {
          setOpen(true);
          void query.refetch();
        }}
      >
        <Bell size={18} aria-hidden="true" />
        {count > 0 && <span>{count}</span>}
      </button>
      {open && (
        <Drawer
          title="Notificaciones"
          onClose={() => setOpen(false)}
          busy={busy}
        >
          <div className="sales-stack">
            {query.error && (
              <p role="alert">
                No se pudieron consultar las notificaciones.{" "}
                <button onClick={() => void query.refetch()}>Reintentar</button>
              </p>
            )}
            {query.isPending && <p>Consultando notificaciones…</p>}
            {!query.isPending && !query.error && !count && (
              <p>No tienes notificaciones pendientes.</p>
            )}
            {error && <p role="alert">{error}</p>}
            {query.data?.items.map((notice) => (
              <article
                className="sales-payment-instructions sales-stack"
                key={notice.id}
              >
                <strong>
                  {notice.status === "rejected"
                    ? "Solicitud revisada"
                    : notice.assembly_requested &&
                        notice.assembly_fee_cents === 0
                      ? "Tu armado va sin coste"
                      : "Tu cotización está lista"}
                </strong>
                <p>
                  {notice.status === "rejected"
                    ? "La tienda ha revisado tu solicitud. Consulta los detalles antes de continuar."
                    : `Cotización ${notice.id.slice(0, 8).toUpperCase()} · versión ${notice.version}${notice.assembly_requested && notice.assembly_fee_cents !== null ? ` · armado ${notice.assembly_fee_cents === 0 ? "sin coste" : money(notice.assembly_fee_cents)}` : ""}`}
                </p>
                <Link
                  className="button dark"
                  to={`/mis-pedidos?tab=cotizaciones&quote=${notice.id}`}
                  onClick={() => setOpen(false)}
                >
                  Revisar actualización
                </Link>
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() => void mark(notice.id, notice.revision)}
                >
                  Marcar como leída
                </button>
              </article>
            ))}
          </div>
        </Drawer>
      )}
    </>
  );
}
