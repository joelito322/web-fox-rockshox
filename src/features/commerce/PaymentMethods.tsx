import { Landmark, CreditCard, Check } from "lucide-react";
import yapeLogo from "../../assets/images/payments/yape.png";
import plinLogo from "../../assets/images/payments/plin.png";
import bcpLogo from "../../assets/images/payments/bcp.svg";
import interbankLogo from "../../assets/images/payments/interbank.png";
import bbvaLogo from "../../assets/images/payments/bbva.png";
import scotiabankLogo from "../../assets/images/payments/scotiabank.svg";
import { money } from "./model";
import { paymentBanks, paymentMethods } from "./payment-methods";

const logos: Record<string, string> = {
  yape_demo: yapeLogo,
  plin_demo: plinLogo,
  bcp_demo: bcpLogo,
  interbank_demo: interbankLogo,
  bbva_demo: bbvaLogo,
  scotiabank_demo: scotiabankLogo,
};
function PaymentMark({
  id,
  compact = false,
}: {
  id: string;
  compact?: boolean;
}) {
  return (
    <span className={`sales-payment-mark${compact ? " compact" : ""} ${id}`}>
      {logos[id] ? (
        <img src={logos[id]} alt="" draggable={false} />
      ) : id === "card_demo" ? (
        <CreditCard size={28} strokeWidth={1.5} aria-hidden="true" />
      ) : (
        <Landmark size={28} strokeWidth={1.5} aria-hidden="true" />
      )}
    </span>
  );
}

export function PaymentMethods({
  method,
  onChange,
  total,
}: {
  method: string;
  onChange: (method: string) => void;
  total?: number;
}) {
  const bank = paymentBanks.find((item) => item.id === method);
  const isTransfer = !!bank || method === "transfer_demo";
  const selected = paymentMethods.find((item) => item.id === method);
  return (
    <div className="sales-stack sales-payment">
      <div
        className="sales-payment-options"
        role="group"
        aria-label="Elegir método de pago"
      >
        {paymentMethods.map((item) => {
          const active = item.kind === "bank" ? isTransfer : item.id === method;
          return (
            <button
              type="button"
              key={item.id}
              aria-pressed={active}
              className={`sales-payment-option${active ? " active" : ""}`}
              onClick={() =>
                onChange(
                  item.kind === "bank"
                    ? (bank?.id ?? paymentBanks[0].id)
                    : item.id,
                )
              }
            >
              <PaymentMark id={item.id} />
              <span className="sales-payment-option-label">{item.label}</span>
              <span className="sales-payment-check" aria-hidden="true">
                <Check size={11} strokeWidth={3} />
              </span>
            </button>
          );
        })}
      </div>
      {isTransfer && (
        <div
          className="sales-payment-banks"
          role="group"
          aria-label="Banco de destino"
        >
          {paymentBanks.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-label={item.label}
              aria-pressed={method === item.id}
              className={`sales-payment-bank${method === item.id ? " active" : ""}`}
              onClick={() => onChange(item.id)}
            >
              <PaymentMark id={item.id} compact />
              <span className="sales-payment-check" aria-hidden="true">
                <Check size={11} strokeWidth={3} />
              </span>
            </button>
          ))}
        </div>
      )}
      <section
        key={bank?.id ?? selected?.id ?? "transfer_demo"}
        className="sales-payment-instructions sales-payment-detail"
        aria-label="Detalle del método seleccionado"
      >
        <div className="sales-payment-detail-top">
          <div className="sales-payment-detail-brand">
            <PaymentMark
              id={bank?.id ?? selected?.id ?? "transfer_demo"}
              compact
            />
            <h3>
              {bank
                ? `Transferencia a ${bank.label}`
                : (selected?.label ?? "Transferencia")}
            </h3>
          </div>
          <div className="sales-payment-amount">
            <span>Importe</span>
            <strong>
              {total === undefined ? "Por confirmar" : money(total)}
            </strong>
            <small>PEN · soles</small>
          </div>
        </div>
        {isTransfer ? (
          <dl>
            <div>
              <dt>Titular</dt>
              <dd>Sin configurar</dd>
            </div>
            <div>
              <dt>Cuenta en soles</dt>
              <dd>—</dd>
            </div>
            <div>
              <dt>CCI</dt>
              <dd>—</dd>
            </div>
          </dl>
        ) : selected?.kind === "wallet" ? (
          <p>Número de destino y QR no habilitados.</p>
        ) : (
          <p>No se solicitan datos de tarjeta en esta simulación.</p>
        )}
        <p className="sales-payment-footnote">
          <span aria-hidden="true" />
          Simulación · sin cobros reales
        </p>
      </section>
    </div>
  );
}
