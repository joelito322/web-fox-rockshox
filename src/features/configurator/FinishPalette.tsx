import { useEffect, useState } from "react";
import type { SelectedVariant } from "../catalog/model";
import type { BuildItem } from "./model";
import { quickColors } from "./model/guided";
export function FinishPalette({
  variant,
  item,
  onFinish,
  onColor,
}: {
  variant: SelectedVariant;
  item: BuildItem;
  onFinish: (id: string) => void;
  onColor: (color: string) => void;
}) {
  const color =
    item.customColor ??
    variant.allowed_finishes.options.find((f) => f.id === item.finishId)
      ?.material.color ??
    "#56634D";
  const [hex, setHex] = useState(color),
    [invalid, setInvalid] = useState(false);
  useEffect(() => {
    setHex(color);
    setInvalid(false);
  }, [color, item.variantId, item.slot]);
  return (
    <div className="finish-palette">
      <fieldset>
        <legend>Acabados</legend>
        <div className="finish-swatches">
          {variant.allowed_finishes.options.map((f) => (
            <button
              key={f.id}
              type="button"
              title={f.label}
              aria-label={`Acabado ${f.label}`}
              aria-pressed={!item.customColor && item.finishId === f.id}
              onClick={() => onFinish(f.id)}
            >
              <span style={{ backgroundColor: f.material.color }} />
              <small>{f.label}</small>
            </button>
          ))}
        </div>
      </fieldset>
      {variant.allowed_finishes.custom_color_enabled && (
        <fieldset>
          <legend>Color</legend>
          <div className="color-swatches">
            {quickColors.map(([name, value]) => (
              <button
                key={value}
                title={name}
                aria-label={`Color ${name}`}
                aria-pressed={item.customColor?.toUpperCase() === value}
                style={{ backgroundColor: value }}
                onClick={() => onColor(value)}
              />
            ))}
          </div>
          <label className="hex-color">
            Color personalizado
            <input
              value={hex}
              maxLength={7}
              aria-invalid={invalid}
              spellCheck={false}
              onChange={(e) => {
                const value = e.target.value;
                setHex(value);
                setInvalid(false);
                if (/^#[0-9a-f]{6}$/i.test(value)) onColor(value);
              }}
              onBlur={() => setInvalid(!/^#[0-9a-f]{6}$/i.test(hex))}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
            />
          </label>
          {invalid && (
            <small role="alert">Escribe un color como #56634D.</small>
          )}
        </fieldset>
      )}
    </div>
  );
}
