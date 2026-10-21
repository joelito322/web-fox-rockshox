import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { instantiateVisual } from "./imported-instance";
import { highlightMeshes } from "./selection-materials";

describe("painted GLB instances", () => {
  it("recolors an existing instance without rebuilding meshes or changing another bike", () => {
    const source = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color: "#ffffff" });
    const geometry = new THREE.BoxGeometry();
    const painted = new THREE.Mesh(geometry, material);
    painted.name = "frame";
    source.add(painted, new THREE.Mesh(geometry, material));
    const a = instantiateVisual(source, ["frame"]);
    const b = instantiateVisual(source, ["frame"]);
    const frame = a.object.getObjectByName("frame") as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
    const identity = frame.uuid;
    a.paint("#123456");
    a.paint("#654321");
    expect(frame.uuid).toBe(identity);
    expect(frame.geometry).toBe(geometry);
    expect(frame.material.color.getHexString()).toBe("654321");
    expect(material.color.getHexString()).toBe("ffffff");
    expect((b.object.getObjectByName("frame") as typeof frame).material.color.getHexString()).toBe("ffffff");
    expect((a.object.children[1] as THREE.Mesh).material).toBe(material);
    const releaseGeometry = vi.spyOn(geometry, "dispose");
    const releaseSource = vi.spyOn(material, "dispose");
    const releasePaint = vi.spyOn(frame.material, "dispose");
    a.dispose();
    expect(releasePaint).toHaveBeenCalledTimes(1);
    expect(releaseGeometry).not.toHaveBeenCalled();
    expect(releaseSource).not.toHaveBeenCalled();
    b.dispose();
  });
  it("shares an owned painted material across matching nodes and disposes it once", () => {
    const source = new THREE.Group();
    const material = new THREE.MeshStandardMaterial();
    for (const name of ["front", "rear"]) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(), material);
      mesh.name = name;
      source.add(mesh);
    }
    const instance = instantiateVisual(source, ["front", "rear"]);
    const front = instance.object.children[0] as THREE.Mesh;
    const rear = instance.object.children[1] as THREE.Mesh;
    expect(front.material).toBe(rear.material);
    expect(front.material).not.toBe(material);
    const dispose = vi.spyOn(front.material as THREE.Material, "dispose");
    instance.dispose();
    expect(dispose).toHaveBeenCalledTimes(1);
  });
  it("keeps paint changes when a selection highlight is removed", () => {
    const source = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
    mesh.name = "frame";
    source.add(mesh);
    const instance = instantiateVisual(source, ["frame"]);
    instance.paint("#112233");
    const release = highlightMeshes(instance.object);
    instance.paint("#abcdef");
    release();
    const material = (instance.object.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;
    expect(material.color.getHexString()).toBe("abcdef");
    instance.dispose();
  });
});
