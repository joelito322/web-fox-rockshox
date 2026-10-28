export type PriceRange = { min?: number; max?: number };
export const maximumPriceCents = 1_000_000_000_000;

export function parsePrice(value: string): number | undefined | null {
  if (!value.trim()) return undefined;
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(value.trim())) return null;
  const cents = Math.round(Number(value.trim().replace(",", ".")) * 100);
  return Number.isSafeInteger(cents) && cents <= maximumPriceCents
    ? cents
    : null;
}
export function validPriceRange(range: PriceRange) {
  return [range.min, range.max].every((v) =>
    v === undefined || (Number.isSafeInteger(v) && v >= 0 && v <= maximumPriceCents),
  ) && (range.min === undefined || range.max === undefined || range.min <= range.max);
}
export function hasPriceRange(range?: PriceRange): range is PriceRange {
  return !!range && (range.min !== undefined || range.max !== undefined);
}
export function withinPriceRange(cents: number, range?: PriceRange) {
  return !range || ((range.min === undefined || cents >= range.min) &&
    (range.max === undefined || cents <= range.max));
}
export function priceRangeFromParams(params: URLSearchParams): PriceRange {
  const min = parsePrice(params.get("price_min") ?? "");
  const max = parsePrice(params.get("price_max") ?? "");
  const range = { min: min ?? undefined, max: max ?? undefined };
  return min !== null && max !== null && validPriceRange(range) ? range : {};
}
