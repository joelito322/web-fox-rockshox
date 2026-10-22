import { describe, it, expect } from "vitest";
import * as T from "three";
import { openBore } from "./bores";
function hits(geometry: T.BufferGeometry, x = 0) {
  const mesh = new T.Mesh(
    geometry,
    new T.MeshBasicMaterial({ side: T.DoubleSide }),
  );
  mesh.updateMatrixWorld(true);
  return new T.Raycaster(
    new T.Vector3(x, 0, -0.2),
    new T.Vector3(0, 0, 1),
    0,
    0.4,
  ).intersectObject(mesh).length;
}
describe("finite assembly openings", () => {
  it("opens the axial passage and preserves the exterior away from it", () => {
    const original = new T.BoxGeometry(0.2, 0.2, 0.1),
      bore = {
        name: "test",
        start: new T.Vector3(0, 0, -0.1),
        end: new T.Vector3(0, 0, 0.1),
        radius: 0.025,
      };
    const result = openBore(original, bore);
    expect(hits(original)).toBeGreaterThan(0);
    expect(hits(result)).toBe(0);
    expect(hits(result, 0.08)).toBeGreaterThan(0);
    result.computeBoundingBox();
    original.computeBoundingBox();
    expect(result.boundingBox).toEqual(original.boundingBox);
    for (const a of Object.values(result.attributes))
      for (const x of a.array) expect(Number.isFinite(x)).toBe(true);
    original.dispose();
    result.dispose();
  });
  it("limits the cut to its specified length and does not remove the other face", () => {
    const original = new T.BoxGeometry(0.2, 0.2, 0.1),
      bore = {
        name: "blind",
        start: new T.Vector3(0, 0, -0.1),
        end: new T.Vector3(0, 0, 0),
        radius: 0.025,
      },
      result = openBore(original, bore);
    expect(hits(result)).toBeGreaterThan(0);
    expect(original.getAttribute("position").count).toBe(24);
    original.dispose();
    result.dispose();
  });
});
