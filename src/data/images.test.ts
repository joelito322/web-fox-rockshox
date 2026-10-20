import { describe, expect, it } from "vitest";
import { componentImage, modelImages } from "./images";

describe("catalogue photograph selection", () => {
  it("preserves a red variant photograph over the model's black reference", () => {
    expect(componentImage(
      { slug: "marzocchi-bomber-z1-rail", image_key: "catalog:marzocchi-z1-rail-black" },
      { image_key: "catalog:marzocchi-z1-rail-red" },
    )).toBe(modelImages["catalog:marzocchi-z1-rail-red"]);
  });
  it("finds reviewed model photographs when the remote catalogue has no image key", () => {
    expect(componentImage({ slug: "ohlins-rxf38-m3", image_key: null }))
      .toContain("ohlins-rxf38-m3.webp");
    expect(componentImage({ slug: "renamed-model", image_key: "catalog:ohlins-rxf38-m3" }))
      .toContain("ohlins-rxf38-m3.webp");
  });
  it("leaves unverified models without a photograph instead of borrowing another model", () => {
    expect(componentImage({ slug: "unverified-frame", image_key: null })).toBeUndefined();
  });
});
