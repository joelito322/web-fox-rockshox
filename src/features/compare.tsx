import { z } from "zod";
import { useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { readCachedVariants } from "./catalog/api";
import {
  categories,
  categoryLabels,
  displaySpec,
  specLabels,
  type SelectedVariant,
} from "./catalog/model";
import { Empty, Loading, Notice } from "../components/ui/Feedback";
const key = "atlas:compare";
function snapshot() {
  try {
    return sessionStorage.getItem(key) ?? "[]";
  } catch {
    return "[]";
  }
}
function subscribe(callback: () => void) {
  window.addEventListener("atlas:compare", callback);
  return () => window.removeEventListener("atlas:compare", callback);
}
function read() {
  try {
    return z
      .array(z.object({ id: z.uuid(), category: z.enum(categories) }))
      .max(3)
      .refine(
        (items) =>
          new Set(items.map((i) => i.id)).size === items.length &&
          new Set(items.map((i) => i.category)).size <= 1,
      )
      .parse(JSON.parse(snapshot()));
  } catch {
    return [];
  }
}
export function useComparison() {
  useSyncExternalStore(subscribe, snapshot);
  const items = read();
  return {
    items,
    add(variant: SelectedVariant) {
      if (items.some((i) => i.id === variant.id)) return "";
      if (items.length >= 3) return "La comparación admite hasta tres piezas.";
      if (items.length && items[0].category !== variant.component.category)
        return "Compara piezas de una misma categoría.";
      sessionStorage.setItem(
        key,
        JSON.stringify([
          ...items,
          { id: variant.id, category: variant.component.category },
        ]),
      );
      window.dispatchEvent(new Event("atlas:compare"));
      return "";
    },
    remove(id: string) {
      sessionStorage.setItem(
        key,
        JSON.stringify(items.filter((i) => i.id !== id)),
      );
      window.dispatchEvent(new Event("atlas:compare"));
    },
  };
}
export default function ComparePage() {
  const compare = useComparison();
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ["compare", compare.items.map((i) => i.id)],
    enabled: !!compare.items.length,
    staleTime: 300_000,
    queryFn: ({ signal }) =>
      readCachedVariants(
        cache,
        compare.items.map((i) => i.id),
        signal,
      ),
  });
  const variants = query.data ?? [];
  const fields = [
    ...new Set(variants.flatMap((v) => Object.keys(v.specs))),
  ].filter((k) => specLabels[k]);
  return (
    <div className="content">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Una elección con perspectiva</p>
          <h1>Comparar</h1>
        </div>
        <Link className="button outline" to="/componentes">
          Elegir componentes
        </Link>
      </div>
      {!compare.items.length ? (
        <Empty title="Elige hasta tres piezas">
          Añade variantes de una misma categoría desde el catálogo.
        </Empty>
      ) : query.isPending ? (
        <Loading />
      ) : query.error ? (
        <Notice onRetry={() => void query.refetch()}>
          No se pudo cargar la comparación.
        </Notice>
      ) : (
        <>
          {compare.items
            .filter((i) => !variants.some((v) => v.id === i.id))
            .map((i) => (
              <Notice key={i.id}>
                Una referencia ya no está disponible.{" "}
                <button
                  className="text-button"
                  onClick={() => compare.remove(i.id)}
                >
                  Quitar de la comparación
                </button>
              </Notice>
            ))}
          <div className="table-scroll">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>
                    {variants[0]
                      ? categoryLabels[variants[0].component.category]
                      : "Componentes"}
                  </th>
                  {variants.map((v) => (
                    <th key={v.id}>
                      <button
                        className="icon-button"
                        aria-label={`Quitar ${v.component.name}`}
                        onClick={() => compare.remove(v.id)}
                      >
                        <X size={16} />
                      </button>
                      <small>{v.component.brands.name}</small>
                      <h2>{v.component.name}</h2>
                      <p>{v.label}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>Detalle y montaje</th>
                  {variants.map((v) => (
                    <td key={v.id}>
                      <div className="inline-actions">
                        <Link
                          className="button outline small"
                          to={`/componentes/${v.component.slug}?variant=${v.id}`}
                        >
                          Ver ficha
                        </Link>
                        {v.selectable ? (
                          <Link
                            className="button dark small"
                            to={`/configurador?variant=${v.id}`}
                          >
                            Probar
                          </Link>
                        ) : (
                          <span>Retirada de nuevos montajes</span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
                {fields.map((k) => (
                  <tr key={k}>
                    <th>{specLabels[k]}</th>
                    {variants.map((v) => (
                      <td
                        key={v.id}
                        className={
                          new Set(
                            variants.map((other) =>
                              JSON.stringify(other.specs[k]),
                            ),
                          ).size > 1
                            ? "different"
                            : undefined
                        }
                      >
                        {displaySpec(v.specs[k])}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th>Precio de referencia</th>
                  {variants.map((v) => (
                    <td key={v.id}>
                      {v.price_reference ? (
                        <>
                          {new Intl.NumberFormat("es", {
                            style: "currency",
                            currency: v.price_reference.currency,
                          }).format(v.price_reference.amount)}
                          <small>
                            {v.price_reference.market} ·{" "}
                            {v.price_reference.as_of}
                          </small>
                        </>
                      ) : (
                        "Sin referencia de precio"
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
