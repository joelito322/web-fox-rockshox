import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { highlightMeshes, selectionIntensity } from "./selection-materials";
describe("selection material isolation", () => {
  it("highlights only selected instances sharing the same imported material", () => {
    const source = new THREE.MeshStandardMaterial({ color: "#123456" });
    const selected = new THREE.Mesh(new THREE.BoxGeometry(), source);
    const unselected = new THREE.Mesh(selected.geometry, source);
    const group = new THREE.Group();
    group.add(selected);
    const release = highlightMeshes(group);
    const copy = selected.material as THREE.MeshStandardMaterial;
    expect(copy.uuid).not.toBe(source.uuid);
    expect(unselected.material).toBe(source);
    expect(source.emissive.getHex()).toBe(0);
    expect(copy.emissiveIntensity).toBe(0.23);
    const dispose = vi.spyOn(copy, "dispose");
    release();
    expect(selected.material).toBe(source);
    expect(dispose).toHaveBeenCalledTimes(1);
    source.dispose();
    selected.geometry.dispose();
  });
  it("pulses only owned materials and stops updating after release", () => {
    const source = new THREE.MeshStandardMaterial({ color: "#123456" });
    const group = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), source);
    group.add(mesh);
    const release = highlightMeshes(group);
    const copy = mesh.material as THREE.MeshStandardMaterial;
    expect(selectionIntensity(0)).toBeCloseTo(0.6);
    expect(selectionIntensity(2.4)).toBeCloseTo(0.6);
    release.setIntensity(selectionIntensity(1.2));
    expect(copy.emissiveIntensity).toBeCloseTo(0.12);
    expect(source.emissive.getHex()).toBe(0);
    expect(copy.color.getHexString()).toBe("123456");
    const dispose = vi.spyOn(copy, "dispose");
    release();
    release();
    release.setIntensity(0.2);
    expect(copy.emissiveIntensity).toBeCloseTo(0.12);
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(mesh.material).toBe(source);
    source.dispose();
    mesh.geometry.dispose();
  });
  it("keeps later paint updates when selection ends", () => {
    const source = new THREE.MeshStandardMaterial({ color: "#123456" });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), source);
    const group = new THREE.Group();
    group.add(mesh);
    const release = highlightMeshes(group);
    source.color.set("#49614c");
    mesh.onBeforeRender(
      ...([] as unknown as Parameters<typeof mesh.onBeforeRender>),
    );
    expect(
      (mesh.material as THREE.MeshStandardMaterial).color.getHexString(),
    ).toBe("49614c");
    release();
    expect(mesh.material).toBe(source);
    expect(source.color.getHexString()).toBe("49614c");
    source.dispose();
    mesh.geometry.dispose();
  });
});
