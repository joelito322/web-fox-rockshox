import { createContext, useContext, useState, type ReactNode } from "react";
import { useCommerce } from "./Provider";
import { useOffers } from "./api";
import { money, unitLabels, conditionLabels, type Offer } from "./model";
import { userError } from "../../lib/supabase";
const Prices = createContext<Offer[]>([]);
export function ProductPrices({
  componentIds,
  children,
}: {
  componentIds: string[];
  children: ReactNode;
}) {
  const commerce = useCommerce();
  return commerce ? (
    <PriceBatch componentIds={componentIds}>{children}</PriceBatch>
  ) : (
    children
  );
}
function PriceBatch({
  componentIds,
  children,
}: {
  componentIds: string[];
  children: ReactNode;
}) {
  const offers = useOffers(componentIds);
  return (
    <Prices.Provider value={offers.data ?? []}>{children}</Prices.Provider>
  );
}
export function CardPrice({ componentId }: { componentId: string }) {
  const offers = useContext(Prices).filter(
    (o) => o.component_id === componentId,
  );
  if (!offers.length) return null;
  const minimum = Math.min(...offers.map((o) => o.unit_cents));
  const varied = offers.some((o) => o.unit_cents !== minimum);
  const used = offers.every((o) => o.item_condition === "used");
  return (
    <div className="sales-card-price">
      <span className="sales-price-value">
        {varied && <small>Desde</small>}
        <strong>{money(minimum)}</strong>
      </span>
      {used && <span className="sales-condition">Segunda mano</span>}
    </div>
  );
}
export function ProductPurchase({ variantId }: { variantId: string }) {
  const cart = useCommerce();
  return cart ? <Purchase key={cart.scope} variantId={variantId} /> : null;
}
function Purchase({ variantId }: { variantId: string }) {
  const cart = useCommerce()!;
  const query = useOffers([], [variantId]);
  const [selected, setSelected] = useState("");
  const [notice, setNotice] = useState("");
  const offers = query.data ?? [];
  const offer = offers.find((o) => o.offer_id === selected) ?? offers[0];
  async function add() {
    if (!offer) return;
    try {
      await cart.add([{ offer_id: offer.offer_id, quantity: 1 }]);
      setNotice("Añadido al carrito.");
    } catch (error) {
      setNotice(userError(error));
    }
  }
  if (query.isPending) return <p className="muted">Consultando oferta…</p>;
  if (query.error)
    return (
      <button className="text-button" onClick={() => void query.refetch()}>
        Reintentar precio de venta
      </button>
    );
  if (!offer)
    return (
      <p className="muted">
        Disponible como referencia visual. Sin oferta de venta.
      </p>
    );
  return (
    <section className="sales-purchase">
      {offer.item_condition && (
        <span className="sales-condition">
          {conditionLabels[offer.item_condition]}
        </span>
      )}
      <div className="sales-actions">
        {offers.map((o) => (
          <button
            key={o.offer_id}
            className={
              o.offer_id === offer.offer_id
                ? "button dark small"
                : "button outline small"
            }
            aria-pressed={o.offer_id === offer.offer_id}
            onClick={() => {
              setSelected(o.offer_id);
              setNotice("");
            }}
          >
            {o.identity.finish}
          </button>
        ))}
      </div>
      <p className="sales-detail-price">
        {offer.discount_cents > 0 && <del>{money(offer.base_cents)}</del>}{" "}
        <strong>{money(offer.unit_cents)}</strong>
        <small> / {unitLabels[offer.unit]}</small>
      </p>
      <p>{offer.available > 0 ? "Disponible" : "Agotado"}</p>
      <button
        className="button dark"
        disabled={cart.loading || cart.busy || offer.available < 1}
        onClick={() => void add()}
      >
        Añadir al carrito
      </button>
      {notice && <p role="status">{notice}</p>}
    </section>
  );
}
