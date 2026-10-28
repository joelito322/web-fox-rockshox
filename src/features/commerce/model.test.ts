import { describe, it, expect } from "vitest";
import {
  contactSchema,
  aggregateLines,
  parseMoney,
  lineSchema,
  limaInput,
  fromLimaInput,
} from "./model";
const a = "11111111-1111-4111-8111-111111111111",
  b = "22222222-2222-4222-8222-222222222222";
describe("commercial input contracts", () => {
  it("parses soles into exact cents without accepting hidden precision or exponential amounts", () => {
    expect(parseMoney("1234.56")).toBe(123456);
    expect(parseMoney("0,01")).toBe(1);
    expect(parseMoney("12.5")).toBe(1250);
    for (const input of [
      "-1",
      "1.001",
      "1e4",
      "Infinity",
      "0x10",
      "1,000.10",
      "",
    ])
      expect(() => parseMoney(input)).toThrow();
  });
  it("combines units by stable offer and preserves distinct SKUs", () => {
    expect(
      aggregateLines([
        { offer_id: a, quantity: 2 },
        { offer_id: b, quantity: 1 },
        { offer_id: a, quantity: 3 },
      ]),
    ).toEqual([
      { offer_id: a, quantity: 5 },
      { offer_id: b, quantity: 1 },
    ]);
  });
  it("rejects fractions, excessive combined quantities, invalid IDs and more than one hundred lines", () => {
    expect(() =>
      aggregateLines([
        { offer_id: a, quantity: 90 },
        { offer_id: a, quantity: 10 },
      ]),
    ).toThrow();
    expect(() => lineSchema.parse({ offer_id: a, quantity: 0.5 })).toThrow();
    expect(() => lineSchema.parse({ offer_id: "sku", quantity: 1 })).toThrow();
    expect(() =>
      aggregateLines(
        Array.from({ length: 101 }, () => ({ offer_id: a, quantity: 1 })),
      ),
    ).toThrow();
  });
});

it("uses Lima time for commercial schedules independent of browser timezone", () => {
  expect(limaInput("2026-10-27T14:30:00Z")).toBe("2026-10-27T09:30");
  expect(fromLimaInput("2026-10-27T09:30")).toBe("2026-10-27T14:30:00.000Z");
  expect(() => fromLimaInput("2026-02-31T10:00")).toThrow();
});

it("preserves accepted contact bytes so snapshot hashes and quoted contacts survive the client round trip", () => {
  const accepted = {
    name: " Cliente ATLAS ",
    contact: " demo@example.invalid ",
  };
  expect(contactSchema.parse(accepted)).toEqual(accepted);
});
