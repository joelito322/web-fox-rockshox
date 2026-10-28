import { useEffect, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { money } from "../commerce/model";
import { hasPriceRange, parsePrice, validPriceRange, type PriceRange } from "./priceRange";
import "./price-filter.css";

export function PriceFilter({ value, onChange }: {
  value: PriceRange;
  onChange: (value: PriceRange) => void;
}) {
  const root = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  useEffect(() => {
    setMin(value.min === undefined ? "" : String(value.min / 100));
    setMax(value.max === undefined ? "" : String(value.max / 100));
  }, [value.min, value.max]);
  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (root.current && !root.current.contains(event.target as Node)) root.current.open = false;
    }
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);
  const minimum = parsePrice(min), maximum = parsePrice(max);
  const invalid = minimum === null || maximum === null ||
    !validPriceRange({ min: minimum ?? undefined, max: maximum ?? undefined });
  const label = value.min !== undefined && value.max !== undefined
    ? `${money(value.min)}–${money(value.max)}`
    : value.min !== undefined ? `Desde ${money(value.min)}`
      : value.max !== undefined ? `Hasta ${money(value.max)}` : "";
  function apply(range: PriceRange) {
    onChange(range);
    if (root.current) {
      root.current.open = false;
      root.current.querySelector("summary")?.focus();
    }
  }
  return (
    <div className="price-filter" data-active={hasPriceRange(value)}>
      <span className="price-filter-label">Precio</span>
      <details ref={root} onToggle={(event) => setOpen(event.currentTarget.open)} onKeyDown={(event) => {
        if (event.key === "Escape" && event.currentTarget.open) {
          event.stopPropagation();
          event.currentTarget.open = false;
          event.currentTarget.querySelector("summary")?.focus();
        }
      }}>
        <summary aria-label="Filtrar por precio" onClick={() => {
          if (!root.current?.open) {
            setMin(value.min === undefined ? "" : String(value.min / 100));
            setMax(value.max === undefined ? "" : String(value.max / 100));
          }
        }}>
          <span className="price-filter-value" title={label || "Todos"}>{label || "Todos"}</span>
          <ChevronDown size={15} aria-hidden="true" />
        </summary>
        <form className="price-filter-panel" onSubmit={(event) => {
          event.preventDefault();
          if (!invalid) apply({ min: minimum ?? undefined, max: maximum ?? undefined });
        }}>
          <div className="price-filter-inputs">
            <label>Desde S/
              <input inputMode="decimal" value={min} onChange={(e) => setMin(e.target.value)} placeholder="0" />
            </label>
            <label>Hasta S/
              <input inputMode="decimal" value={max} onChange={(e) => setMax(e.target.value)} placeholder="Sin límite" />
            </label>
          </div>
          <p className="muted">Precio por unidad, par o juego según el artículo.</p>
          {invalid && <p className="price-filter-error" role="alert">Revisa los importes: usa hasta dos decimales y un mínimo menor o igual al máximo.</p>}
          <div className="price-filter-actions">
            <button type="button" className="text-button" onClick={() => apply({})}>Limpiar</button>
            <button className="button dark small" disabled={invalid}>Aplicar</button>
          </div>
        </form>
      </details>
      {hasPriceRange(value) && (
        <button className="price-filter-chip" aria-label={`Quitar filtro de precio: ${label}`} onClick={() => apply({})}>
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
