import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { Drawer } from "../../components/ui/Drawer";
import { Loading, Notice } from "../../components/ui/Feedback";
import { useAuth } from "../auth/provider";
import { userError } from "../../lib/supabase";
import { useCommerce } from "./Provider";
import { money, conditionLabels, unitLabels } from "./model";
export function CartButton() {
  const cart = useCommerce();
  const [open, setOpen] = useState(false);
  if (!cart) return null;
  return (
    <>
      <button
        className="text-button cart-trigger"
        aria-label={`Carrito · ${cart.lines.reduce((n, l) => n + l.quantity, 0)}`}
        onClick={() => setOpen(true)}
      >
        <span
          key={`icon:${cart.additionRevision ?? 0}`}
          className={`cart-trigger-icon${cart.additionRevision ? " cart-trigger-added" : ""}`}
        >
          <ShoppingCart size={18} aria-hidden="true" />
        </span>
        <span className="cart-label">Carrito · </span>
        <span
          key={`count:${cart.additionRevision ?? 0}`}
          className={`cart-count${cart.additionRevision ? " cart-count-added" : ""}`}
        >
          {cart.lines.reduce((n, l) => n + l.quantity, 0)}
        </span>
      </button>
      {open && (
        <Drawer
          title="Tu carrito"
          busy={cart.busy}
          onClose={() => setOpen(false)}
          footer={
            cart.lines.length > 0 ? (
              <Link
                className="button dark"
                to="/comprar"
                aria-disabled={cart.busy}
                onClick={(event) => {
                  if (cart.busy) event.preventDefault();
                  else setOpen(false);
                }}
              >
                Continuar pedido
              </Link>
            ) : undefined
          }
        >
          <CartContents />
        </Drawer>
      )}
    </>
  );
}
export function CartContents() {
  const cart = useCommerce()!;
  const auth = useAuth();
  const [error, setError] = useState("");
  async function run(work: () => Promise<void>) {
    try {
      setError("");
      await work();
    } catch (e) {
      setError(userError(e));
    }
  }
  if (cart.loading) return <Loading />;
  return (
    <div className="sales-stack">
      <p className="sales-note">
        Precios en soles · armado opcional y envío por cotizar
      </p>
      {cart.guest.length > 0 && (
        <section className="notice">
          <p>
            También tienes una selección de este navegador. Elige qué conservar.
          </p>
          <div className="sales-actions">
            <button
              disabled={cart.busy}
              onClick={() => void run(() => cart.merge("merge"))}
            >
              Combinar
            </button>
            <button
              disabled={cart.busy}
              onClick={() => void run(() => cart.merge("guest"))}
            >
              Usar selección del navegador
            </button>
            <button
              disabled={cart.busy}
              onClick={() => void run(() => cart.merge("account"))}
            >
              Conservar mi carrito
            </button>
          </div>
        </section>
      )}
      {error && <p role="alert">{error}</p>}
      {!!cart.error && (
        <Notice onRetry={() => void cart.refresh()}>
          No se pudo recuperar tu carrito.
        </Notice>
      )}
      {!cart.lines.length ? (
        <p>
          Tu carrito está vacío.{" "}
          <Link to="/componentes">Explorar componentes</Link>
        </p>
      ) : (
        <CartItemList onError={setError} />
      )}
      {!auth.user && (
        <p>
          <Link
            to="/entrar"
            onClick={() => sessionStorage.setItem("atlas:intent", "/comprar")}
          >
            Inicia sesión
          </Link>{" "}
          para conservar tu carrito y continuar.
        </p>
      )}
    </div>
  );
}
import { useQuery } from "@tanstack/react-query";
import { getCart } from "./api";
import { useCartPrices } from "./cart-prices";
import { modelImages } from "../../data/images";
function CartItemList({ onError }: { onError: (message: string) => void }) {
  const cart = useCommerce()!;
  const auth = useAuth();
  const data = useQuery({
    queryKey: ["sales", "cart", auth.user?.id],
    enabled: !!auth.user,
    queryFn: ({ signal }) => getCart(signal, auth.user?.id),
    staleTime: 15_000,
  });
  const priced = useCartPrices(cart.lines);
  async function quantity(id: string, next: number) {
    try {
      await cart.write(
        next === 0
          ? cart.lines.filter((l) => l.offer_id !== id)
          : cart.lines.map((l) =>
              l.offer_id === id ? { ...l, quantity: next } : l,
            ),
      );
      onError("");
    } catch (e) {
      onError(userError(e));
    }
  }
  return (
    <>
      <div className="sales-stack">
        {cart.lines.map((line) => {
          const price = priced.data?.find((o) => o.offer_id === line.offer_id);
          const cached = data.data?.items.find(
            (i) => i.offer_id === line.offer_id,
          );
          const condition = price?.item_condition ?? cached?.item_condition;
          const label =
            price?.label ?? cached?.label ?? "Producto de tu selección";
          const finish = price?.identity.finish ?? cached?.identity.finish;
          return (
            <article
              className="sales-cart-line sales-cart-item"
              key={line.offer_id}
            >
              <span className="sales-cart-thumb">
                {price?.image_key && modelImages[price.image_key] ? (
                  <img
                    className="sales-product-image"
                    src={modelImages[price.image_key]}
                    alt=""
                  />
                ) : (
                  <ShoppingCart size={24} aria-hidden="true" />
                )}
              </span>
              <div className="sales-cart-item-info">
                <strong>{label}</strong>
                {finish &&
                  !label.toLowerCase().includes(finish.toLowerCase()) && (
                    <small>{finish}</small>
                  )}
                {condition && (
                  <span className="sales-condition">
                    {conditionLabels[condition]}
                  </span>
                )}
              </div>
              {price ? (
                <div className="sales-cart-pricing">
                  <strong className="sales-line-price">
                    {money(price.unit_cents * line.quantity)}
                  </strong>
                  {line.quantity > 1 && (
                    <small>
                      {money(price.unit_cents)} /{" "}
                      {unitLabels[price.unit] ?? "unidad"}
                    </small>
                  )}
                  {price.discount_cents > 0 && (
                    <span className="sales-cart-offer">Promoción aplicada</span>
                  )}
                </div>
              ) : (
                <span className="sales-cart-pricing">
                  Precio por actualizar
                </span>
              )}
              {((price?.available ?? cached?.available ?? 0) < line.quantity ||
                cached?.active === false) && (
                <p className="notice">
                  Revisa la disponibilidad antes de continuar.
                </p>
              )}
              <div className="sales-actions sales-cart-quantity">
                <button
                  disabled={cart.busy || line.quantity <= 1}
                  aria-label="Restar unidad"
                  onClick={() =>
                    void quantity(line.offer_id, line.quantity - 1)
                  }
                >
                  −
                </button>
                <span>{line.quantity}</span>
                <button
                  disabled={cart.busy || line.quantity >= 99}
                  aria-label="Sumar unidad"
                  onClick={() =>
                    void quantity(line.offer_id, line.quantity + 1)
                  }
                >
                  +
                </button>
                <button
                  disabled={cart.busy}
                  className="text-button danger"
                  onClick={() => void quantity(line.offer_id, 0)}
                >
                  Quitar
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {priced.data && (
        <strong className="sales-total">
          {priced.data.length === cart.lines.length
            ? "Total de componentes"
            : "Subtotal disponible"}
          :{" "}
          {money(
            cart.lines.reduce(
              (total, line) =>
                total +
                (priced.data.find((price) => price.offer_id === line.offer_id)
                  ?.unit_cents ?? 0) *
                  line.quantity,
              0,
            ),
          )}
        </strong>
      )}
      {priced.error && (
        <Notice onRetry={() => void priced.refetch()}>
          Revisa las piezas que ya no están disponibles.
        </Notice>
      )}
    </>
  );
}
