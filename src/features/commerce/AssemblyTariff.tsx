import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUnsavedChanges } from "../../components/ui/UnsavedChanges";
import { useAuth } from "../auth/provider";
import { userError } from "../../lib/supabase";
import { salesRpc, servicePolicySchema, useServicePolicy } from "./api";
import { money, parseMoney } from "./model";

export function AssemblyTariff() {
  const auth = useAuth();
  const query = useServicePolicy();
  const client = useQueryClient();
  const [draft, setDraft] = useState<{
    value: string;
    revision: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save() {
    if (!draft) return true;
    setBusy(true);
    setMessage("");
    try {
      const next = await salesRpc(
        "sales_save_assembly_tariff",
        {
          p_revision: draft.revision,
          p_fee: parseMoney(draft.value),
        },
        servicePolicySchema,
        undefined,
        auth.user?.id,
      );
      client.setQueryData(["sales", "service-policy"], next);
      setDraft(null);
      setMessage(
        "Tarifa actualizada. Las solicitudes anteriores conservan su importe.",
      );
      return true;
    } catch (error) {
      setMessage(userError(error));
      return false;
    } finally {
      setBusy(false);
    }
  }
  const guard = useUnsavedChanges(!!draft, save, busy);
  if (!query.data)
    return (
      <p className="sales-note">
        {query.error
          ? "No se pudo consultar la tarifa de armado."
          : "Consultando tarifa de armado…"}
      </p>
    );
  return (
    <>
      {guard.dialog}
      <details className="sales-payment-instructions">
        <summary>
          Tarifa de armado · {money(query.data.assembly_fee_cents)}
        </summary>
        <div className="sales-stack">
          <label className="field">
            Armado (S/)
            <input
              inputMode="decimal"
              disabled={busy}
              value={
                draft?.value ?? String(query.data.assembly_fee_cents / 100)
              }
              onChange={(event) =>
                setDraft({
                  value: event.target.value,
                  revision: draft?.revision ?? query.data.service_revision,
                })
              }
            />
          </label>
          <p className="sales-note">
            Se aplica a nuevas solicitudes. Puedes exonerar el armado al revisar
            cada cotización.
          </p>
          <div className="sales-actions">
            <button
              className="button dark"
              disabled={busy || !draft}
              onClick={() => void save()}
            >
              {busy ? "Guardando…" : "Guardar tarifa"}
            </button>
            {draft && (
              <button
                className="text-button"
                disabled={busy}
                onClick={() => setDraft(null)}
              >
                Descartar
              </button>
            )}
          </div>
          {message && <p role="status">{message}</p>}
        </div>
      </details>
    </>
  );
}
