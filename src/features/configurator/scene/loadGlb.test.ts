import { afterEach, describe, expect, it, vi } from "vitest";
import { visualTriangle } from "../../../../tests/fixtures/visual-triangle";
import * as THREE from "three";
import { loadGlb, disposeVisual } from "./loadGlb";
afterEach(() => vi.unstubAllGlobals());
describe("GLB delivery", () => {
  it("parses the delivered binary before exposing it to the scene", async () => {
    const bytes = visualTriangle();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(bytes)));
    const scene = await loadGlb("https://assets.example.test/models/fixture.glb");
    const mesh = scene.getObjectByName("validation_triangle") as THREE.Mesh;
    expect(mesh.geometry.attributes.position.count).toBe(3);
    disposeVisual(scene);
  });
  it("rejects missing and invalid resources without replacing them with generic geometry", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("missing", { status: 404 })));
    await expect(loadGlb("https://assets.example.test/missing.glb")).rejects.toThrow("visual_unavailable");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("invalid")));
    await expect(loadGlb("https://assets.example.test/invalid.glb")).rejects.toThrow();
  });
  it("bounds a stalled transfer and aborts its request", async () => {
    let signal: AbortSignal | undefined;
    vi.stubGlobal("fetch", vi.fn((_url, init) => {
      signal = init.signal;
      return new Promise(() => {});
    }));
    await expect(loadGlb("https://assets.example.test/stalled.glb", 10)).rejects.toThrow("visual_timeout");
    expect(signal?.aborted).toBe(true);
  });
  it("releases shared geometry, materials and textures only once", () => {
    const geometry = new THREE.BoxGeometry();
    const texture = new THREE.Texture();
    const material = new THREE.MeshStandardMaterial({ map: texture });
    const scene = new THREE.Group();
    scene.add(new THREE.Mesh(geometry, material), new THREE.Mesh(geometry, material));
    const g = vi.spyOn(geometry, "dispose"), m = vi.spyOn(material, "dispose"), t = vi.spyOn(texture, "dispose");
    disposeVisual(scene);
    expect(g).toHaveBeenCalledTimes(1);
    expect(m).toHaveBeenCalledTimes(1);
    expect(t).toHaveBeenCalledTimes(1);
  });
});
