import { describe, it, expect } from "vitest";
import {
  canonical,
  configurationSchema,
  emptyConfiguration,
  remove,
} from "./index";
const a = {
  slot: "frame" as const,
  variantId: "10000000-0000-4000-8000-000000000001",
  finishId: "black",
  customColor: "#aabbcc",
};
const b = {
  slot: "fork" as const,
  variantId: "10000000-0000-4000-8000-000000000002",
  finishId: "black",
  customColor: null,
};
describe("build persistence contract", () => {
  it("reconciles equivalent snapshots independently of order and color case", () => {
    expect(canonical({ schemaVersion: 1, name: "Enduro", items: [a, b] })).toBe(
      canonical({
        schemaVersion: 1,
        name: "Enduro",
        items: [b, { ...a, customColor: "#AABBCC" }],
      }),
    );
  });
  it("rejects duplicate positions and arbitrary CSS colors", () => {
    expect(
      configurationSchema.safeParse({ ...emptyConfiguration(), items: [a, a] })
        .success,
    ).toBe(false);
    expect(
      configurationSchema.safeParse({
        ...emptyConfiguration(),
        items: [{ ...a, customColor: "url(javascript:alert(1))" }],
      }).success,
    ).toBe(false);
  });
  it("removes an optional part without destroying its frame", () => {
    expect(
      remove({ ...emptyConfiguration(), items: [a, b] }, "fork").items,
    ).toEqual([a]);
    expect(() =>
      remove({ ...emptyConfiguration(), items: [a] }, "frame"),
    ).toThrow("frame_required");
  });
});
