import { useMemo, useState } from "react";
import { useCatalog } from "../catalog/api";
import { selectVariant, type SelectedVariant } from "../catalog/model";
import { componentImage } from "../../data/images";
import { Loading, Notice } from "../../components/ui/Feedback";
import { useOffers } from "../commerce/api";
import {
  money,
  unitLabels,
  conditionLabels,
  type Offer,
} from "../commerce/model";
import { evaluateAlternative } from "./model/alternatives";
import {
  slotCategories,
  slotLabels,
  type Configuration,
  type MountWarning,
  type Slot,
  type VariantMap,
} from "./model";

function offerFor(offers: Offer[], id: string, finish: string) {
  return offers.find((offer) =>
    offer.choices?.some(
      (choice) => choice.variant_id === id && choice.finish_id === finish,
    ),
  );
}
export function CompatibilityAlternatives({
  configuration,
  variants,
  warning,
  slot,
  disabled,
  onApply,
}: {
  configuration: Configuration;
  variants: VariantMap;
  warning: MountWarning;
  slot: Slot;
  disabled: boolean;
  onApply: (slot: Slot, variant: SelectedVariant, code: string) => void;
}) {
  const [page, setPage] = useState(0);
  const [optionPage, setOptionPage] = useState(0);
  const catalog = useCatalog(slotCategories[slot], "", page);
  const alternatives = useMemo(
    () =>
      (catalog.data?.components ?? [])
        .flatMap((component) =>
          component.component_variants
            .map((variant) =>
              evaluateAlternative(
                configuration,
                variants,
                warning.code,
                slot,
                selectVariant(component, variant),
              ),
            )
            .filter((option) => option !== null),
        )
        .sort(
          (a, b) =>
            b.resolved.length - a.resolved.length ||
            a.variant.component.name.localeCompare(b.variant.component.name) ||
            a.variant.label.localeCompare(b.variant.label) ||
            a.variant.id.localeCompare(b.variant.id),
        ),
    [catalog.data, configuration, variants, warning.code, slot],
  );
  const visiblePage = Math.min(
    optionPage,
    Math.max(0, Math.ceil(alternatives.length / 6) - 1),
  );
  const visible = alternatives.slice(visiblePage * 6, visiblePage * 6 + 6);
  const current = configuration.items.find((item) => item.slot === slot);
  const ids = !visible.length
    ? []
    : [
        ...new Set([
          ...visible.map((option) => option.variant.id),
          ...(current ? [current.variantId] : []),
        ]),
      ].sort();
  const prices = useOffers([], ids);
  const currentOffer =
    current && offerFor(prices.data ?? [], current.variantId, current.finishId);
  return (
    <div
      className="compatibility-alternatives"
      aria-label={`Alternativas para ${slotLabels[slot].toLocaleLowerCase()}`}
    >
      <p className="compatibility-alternatives-note">
        Solo se sustituye {slotLabels[slot].toLocaleLowerCase()}. Las opciones
        resuelven este aviso con las medidas disponibles; la revisión del taller
        sigue siendo necesaria.
      </p>
      {catalog.isPending ? (
        <Loading label="Buscando alternativas" />
      ) : catalog.error ? (
        <Notice onRetry={() => void catalog.refetch()}>
          No se pudieron consultar las alternativas.
        </Notice>
      ) : (
        <>
          {!alternatives.length && (
            <p className="muted">
              No encontramos una alternativa comprobable entre estos modelos.
              Puedes revisar otra posición o seguir eligiendo libremente.
            </p>
          )}
          {visible.map(({ variant, resolved, unknowns }) => {
            const offer = offerFor(
              prices.data ?? [],
              variant.id,
              variant.allowed_finishes.default_finish_id,
            );
            const comparable =
              offer &&
              currentOffer &&
              offer.unit === currentOffer.unit &&
              offer.currency === currentOffer.currency;
            const delta = comparable
              ? offer.unit_cents - currentOffer.unit_cents
              : undefined;
            const image = componentImage(variant.component, variant);
            return (
              <article className="compatibility-option" key={variant.id}>
                {image && <img src={image} alt="" loading="lazy" />}
                <div className="compatibility-option-content">
                  <small>{variant.component.brands.name}</small>
                  <strong>{variant.component.name}</strong>
                  <span>{variant.label}</span>
                  <small>
                    Acabado:{" "}
                    {
                      variant.allowed_finishes.options.find(
                        (finish) =>
                          finish.id ===
                          variant.allowed_finishes.default_finish_id,
                      )?.label
                    }
                  </small>
                  <span className="compatibility-option-proof">
                    Resuelve{" "}
                    {resolved.length === 1
                      ? "este aviso"
                      : `${resolved.length} avisos`}{" "}
                    · sin nuevos conflictos detectados
                  </span>
                  {!!unknowns.length && (
                    <small>
                      {unknowns.length}{" "}
                      {unknowns.length === 1
                        ? "dato del montaje sigue por confirmar"
                        : "datos del montaje siguen por confirmar"}
                    </small>
                  )}
                  {offer ? (
                    <div className="compatibility-option-price">
                      <strong>{money(offer.unit_cents)}</strong>
                      <small> / {unitLabels[offer.unit]}</small>
                      {delta !== undefined ? (
                        <span>
                          {delta === 0
                            ? "Mismo precio"
                            : `${delta > 0 ? "+" : "−"}${money(Math.abs(delta))}`}{" "}
                          respecto a la pieza actual
                        </span>
                      ) : (
                        <span>Diferencia de precio no disponible</span>
                      )}
                      {offer.item_condition && (
                        <small>{conditionLabels[offer.item_condition]}</small>
                      )}
                      {offer.available < 1 && (
                        <small>
                          Sin stock · disponible para montaje visual
                        </small>
                      )}
                    </div>
                  ) : (
                    <small>
                      {prices.isPending
                        ? "Consultando precio…"
                        : "Sin precio de venta disponible"}
                    </small>
                  )}
                  <button
                    className="button dark small"
                    disabled={disabled}
                    onClick={() => onApply(slot, variant, warning.code)}
                  >
                    Usar esta pieza
                  </button>
                </div>
              </article>
            );
          })}
          {prices.error && (
            <Notice onRetry={() => void prices.refetch()}>
              No se pudieron consultar los precios. Las comprobaciones técnicas
              siguen disponibles.
            </Notice>
          )}
          {alternatives.length > 6 && (
            <nav
              className="compatibility-actions"
              aria-label="Opciones comprobadas"
            >
              <button
                className="button outline small"
                disabled={!visiblePage}
                onClick={() => setOptionPage(Math.max(0, visiblePage - 1))}
              >
                Opciones anteriores
              </button>
              <span>
                {visiblePage * 6 + 1}–
                {Math.min((visiblePage + 1) * 6, alternatives.length)} de{" "}
                {alternatives.length}
              </span>
              <button
                className="button outline small"
                disabled={(visiblePage + 1) * 6 >= alternatives.length}
                onClick={() => setOptionPage(visiblePage + 1)}
              >
                Más opciones
              </button>
            </nav>
          )}
          {(page > 0 || (catalog.data?.count ?? 0) > 24) && (
            <nav
              className="compatibility-actions"
              aria-label="Modelos del catálogo"
            >
              <button
                className="text-button"
                disabled={!page}
                onClick={() => {
                  setPage((value) => Math.max(0, value - 1));
                  setOptionPage(0);
                }}
              >
                Modelos anteriores
              </button>
              <button
                className="text-button"
                disabled={(page + 1) * 24 >= (catalog.data?.count ?? 0)}
                onClick={() => {
                  setPage((value) => value + 1);
                  setOptionPage(0);
                }}
              >
                Siguientes modelos
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
