import { describe, expect, it } from "vitest";
import { parsePrice, priceRangeFromParams, validPriceRange, withinPriceRange } from "./priceRange";

describe("per-item price ranges", () => {
  it("preserves cents and accepts decimal comma without treating blanks as zero", () => {
    expect(parsePrice("")).toBeUndefined();
    expect(parsePrice("0")).toBe(0);
    expect(parsePrice("2500,90")).toBe(250090);
    expect(parsePrice("19.99")).toBe(1999);
    for (const value of ["-1", "1.234", "2e3", "Infinity", "1,000.00", "invalid", "10000000001"])
      expect(parsePrice(value)).toBeNull();
  });
  it("uses inclusive bounds and supports an open end", () => {
    expect(validPriceRange({ min: 1000, max: 1000 })).toBe(true);
    expect(withinPriceRange(1000, { min: 1000, max: 1000 })).toBe(true);
    expect(withinPriceRange(999, { min: 1000 })).toBe(false);
    expect(withinPriceRange(1001, { max: 1000 })).toBe(false);
    expect(validPriceRange({ min: 2000, max: 1000 })).toBe(false);
    expect(validPriceRange({ max: NaN })).toBe(false);
  });
  it("safely ignores malformed URL ranges and keeps unrelated filters", () => {
    const params = new URLSearchParams("category=fork&price_min=500&price_max=2500.50");
    expect(priceRangeFromParams(params)).toEqual({ min: 50000, max: 250050 });
    expect(priceRangeFromParams(new URLSearchParams("price_min=900&price_max=1"))).toEqual({});
    expect(priceRangeFromParams(new URLSearchParams("price_min=-1"))).toEqual({});
    expect(params.get("category")).toBe("fork");
  });
});
