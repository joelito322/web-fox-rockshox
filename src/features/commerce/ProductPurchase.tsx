import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { ShoppingCart, Check, LoaderCircle } from "lucide-react";
import { useCommerce } from "./Provider";
import { useOffers } from "./api";
import { money, unitLabels, conditionLabels, type Offer } from "./model";
import { userError } from "../../lib/supabase";
import { hasPriceRange, withinPriceRange, type PriceRange } from "../catalog/priceRange";
const Prices = createContext<Offer[]>([]);
export function ProductPrices({
  componentIds,
  children,
  priceRange,
}: {
  componentIds: string[];
  children: ReactNode;
  priceRange?: PriceRange;
}) {
  const commerce = useCommerce();
  return commerce ? (
    <PriceBatch componentIds={componentIds} priceRange={priceRange}>{children}</PriceBatch>
  ) : (
    children
  );
}
function PriceBatch({
  componentIds,
  children,
  priceRange,
}: {
  componentIds: string[];
  children: ReactNode;
  priceRange?: PriceRange;
}) {
  const offers = useOffers(componentIds);
  return (
    <Prices.Provider value={(offers.data ?? []).filter((offer) => withinPriceRange(offer.unit_cents, priceRange))}>{children}</Prices.Provider>
  );
}
export function CardPrice({ componentId, variantIds }: { componentId: string; variantIds?: string[] }) {
  const offers = useContext(Prices).filter(
    (o) => o.component_id === componentId && (!variantIds || o.choices?.some((choice) => variantIds.includes(choice.variant_id))),
  );
  if (!offers.length) return null;
  const minimum = Math.min(...offers.map((o) => o.unit_cents));
  const varied = offers.some((o) => o.unit_cents !== minimum);
  const used = offers.every((o) => o.item_condition === "used");
  const units = [...new Set(offers.filter((o) => o.unit_cents === minimum).map((o) => o.unit))];
  return (
    <div className="sales-card-price">
      <span className="sales-price-value">
        {varied && <small>Desde</small>}
        <strong>{money(minimum)}</strong>
        <small> / {units.length === 1 ? unitLabels[units[0]] : "presentación"}</small>
      </span>
      {used && <span className="sales-condition">Segunda mano</span>}
    </div>
  );
}
export function ProductPurchase({ variantId, priceRange }: { variantId: string; priceRange?: PriceRange }) {
  const cart = useCommerce();
  return cart ? (
    <Purchase key={`${cart.scope}:${variantId}`} variantId={variantId} priceRange={priceRange} />
  ) : null;
}
function Purchase({ variantId, priceRange }: { variantId: string; priceRange?: PriceRange }) {
  const cart = useCommerce()!;
  const query = useOffers([], [variantId]);
  const [selected, setSelected] = useState("");
  const [notice, setNotice] = useState("");
  const [phase, setPhase] = useState<"idle" | "pending" | "success">("idle");
  const [confirmation, setConfirmation] = useState(0);
  const alive = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      clearTimeout(timer.current);
    };
  }, []);
  const offers = (query.data ?? []).filter((offer) => withinPriceRange(offer.unit_cents, priceRange));
  const offer = offers.find((o) => o.offer_id === selected) ?? offers[0];
  async function add() {
    if (!offer || phase === "pending") return;
    clearTimeout(timer.current);
    setNotice("");
    setPhase("pending");
    try {
      await cart.add([{ offer_id: offer.offer_id, quantity: 1 }]);
      if (!alive.current) return;
      setPhase("success");
      setConfirmation((value) => value + 1);
      timer.current = setTimeout(() => {
        if (alive.current) setPhase("idle");
      }, 2600);
    } catch (error) {
      if (!alive.current) return;
      setPhase("idle");
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
        {hasPriceRange(priceRange) ? "No hay una oferta dentro de este rango." : "Disponible como referencia visual. Sin oferta de venta."}
      </p>
    );
  const actionLabel =
    phase === "pending"
      ? "Añadiendo…"
      : phase === "success"
        ? "Añadido al carrito"
        : "Añadir al carrito";
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
            disabled={phase === "pending"}
            className={
              o.offer_id === offer.offer_id
                ? "button dark small"
                : "button outline small"
            }
            aria-pressed={o.offer_id === offer.offer_id}
            onClick={() => {
              setSelected(o.offer_id);
              setNotice("");
              clearTimeout(timer.current);
              setPhase("idle");
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
        aria-label={actionLabel}
        className={`button dark sales-add-button${phase === "success" ? " is-added" : ""}`}
        disabled={
          cart.loading ||
          cart.busy ||
          phase === "pending" ||
          offer.available < 1
        }
        onClick={() => void add()}
      >
        <span className="sales-add-button-content">
          <span key={`${phase}:${confirmation}`} className="sales-add-icon">
            {phase === "pending" ? (
              <LoaderCircle
                className="sales-add-spinner"
                size={18}
                aria-hidden="true"
              />
            ) : phase === "success" ? (
              <Check
                className="sales-add-check"
                size={19}
                strokeWidth={3}
                aria-hidden="true"
              />
            ) : (
              <ShoppingCart size={18} aria-hidden="true" />
            )}
          </span>
          <span role="status" aria-live="polite" aria-atomic="true">
            {actionLabel}
          </span>
        </span>
      </button>
      {notice && <p role="alert">{notice}</p>}
    </section>
  );
}
