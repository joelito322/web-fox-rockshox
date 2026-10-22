import { describe, it, expect } from "vitest";
import * as T from "three";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { buildCherry, buildCherryLink, cherryRegistration } from "./frames";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import rows from "./predecessors.json";
import protectedCaptures from "./protected-captures.json";
import source from "../../supabase/catalog/frames-v16-reviewed.json";
import mapping from "../../supabase/catalog/frames-v16-successors.json";
import original from "../catalog-v11/uploads.json";
import uploads from "./uploads.json";
import { parseCatalogImport } from "../../src/features/catalog/model/ingestion";
const sha = (file: string) =>
  createHash("sha256").update(readFileSync(file)).digest("hex");
describe("CHERRY BOMB full frame v16", () => {
  it("changes only CHERRY BOMB and preserves all other current frame resources", () => {
    const parsed = parseCatalogImport(source);
    expect(parsed.components).toHaveLength(1);
    expect(parsed.variants).toHaveLength(2);
    expect(parsed.components[0].slug).toBe("da-bomb-cherry-bomb-29");
    expect(protectedCaptures).toHaveLength(28);
    for (const c of protectedCaptures) expect(sha(c.file)).toBe(c.sha256);
    for (const c of original)
      expect(sha("models/catalog-v11/exports/" + c.file)).toBe(c.sha256);
    expect(() =>
      buildCherry({ ...rows[0], slug: "commencal-meta-sx-v5" }),
    ).toThrow("CHERRY-only");
    for (const row of rows) {
      const fresh = parsed.variants.find(
        (v) => v.id === mapping[row.variant.id as keyof typeof mapping],
      )!;
      expect(fresh.specs).toEqual(row.variant.specs);
      expect(fresh.allowed_finishes).toEqual(row.variant.allowed_finishes);
      expect(
        parsed.assets.find((a) => a.id === fresh.visual_asset_id)!.manifest
          .anchors,
      ).toEqual(row.asset.manifest.anchors);
    }
  });
  it("captures each successor under a new immutable content hash", () => {
    expect(uploads).toHaveLength(2);
    for (const c of uploads) {
      expect(sha("models/catalog-v16/exports/" + c.file)).toBe(c.sha256);
      expect(c.variant_id).not.toBe(c.predecessor_id);
    }
  });
  it.each(rows)(
    "keeps all declared long members and their contours straight for $variant.specs.size_label",
    (row) => {
      const built = buildCherry(row);
      expect(built.pathEvidence.length).toBeGreaterThan(5);
      for (const member of built.pathEvidence) {
        const { samples, straightRanges } = member.sampled;
        for (const range of straightRanges) {
          const start = samples[range.from],
            end = samples[range.to],
            line = new T.Line3(start.point, end.point),
            normal = new T.Vector3(0, 0, 1).cross(start.tangent).normalize();
          for (let i = range.from; i <= range.to; i++) {
            const p = samples[i];
            expect(
              line
                .closestPointToPoint(p.point, true, new T.Vector3())
                .distanceTo(p.point),
            ).toBeLessThan(1e-9);
            expect(p.tangent.distanceTo(start.tangent)).toBeLessThan(1e-9);
            for (const side of [-1, 1]) {
              const edge = new T.Line3(
                start.point
                  .clone()
                  .addScaledVector(normal, side * start.height),
                end.point.clone().addScaledVector(normal, side * end.height),
              );
              const point = p.point
                .clone()
                .addScaledVector(normal, side * p.height);
              expect(
                edge
                  .closestPointToPoint(point, true, new T.Vector3())
                  .distanceTo(point),
              ).toBeLessThan(1e-9);
            }
          }
        }
      }
      built.geometry.dispose();
    },
  );
  it.each(rows)(
    "opens the observed rocker window while retaining bearing lands for $variant.specs.size_label",
    async (row) => {
      const geometry = buildCherryLink(row),
        mat = new T.MeshBasicMaterial({ side: T.DoubleSide }),
        mesh = new T.Mesh(geometry, mat);
      mesh.updateMatrixWorld(true);
      const xy = cherryRegistration(row);
      const cast = (object: T.Object3D, pixel: number[]) => {
        const p = xy(pixel);
        p.z = 0.15;
        return new T.Raycaster(
          p,
          new T.Vector3(0, 0, -1),
          0,
          0.3,
        ).intersectObject(object).length;
      };
      expect(cast(mesh, [566.7, 549.3])).toBe(0);
      for (const pixel of [
        [554, 583],
        [614, 536],
        [436, 565],
      ])
        expect(cast(mesh, pixel)).toBeGreaterThan(0);
      const bytes = readFileSync(row.predecessor_file),
        loader = new GLTFLoader().register(() => ({
          name: "offline-no-textures",
          loadTexture: () => Promise.resolve(null),
        }));
      // Use this test realm's ArrayBuffer; Node Buffer backing buffers belong
      // to another realm under jsdom and fail GLTFLoader's instanceof check.
      const array = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(array).set(bytes);
      const scene = (await loader.parseAsync(array, "")).scene;
      scene.updateMatrixWorld(true);
      let oldLink: T.Mesh | undefined;
      scene.traverse((n) => {
        if (n instanceof T.Mesh && n.name.endsWith("__link")) oldLink = n;
      });
      expect(oldLink).toBeDefined();
      (oldLink!.material as T.Material).side = T.DoubleSide;
      expect(cast(oldLink!, [566.7, 549.3])).toBeGreaterThan(0);
      geometry.dispose();
      mat.dispose();
      scene.traverse((n) => {
        if (n instanceof T.Mesh) n.geometry.dispose();
      });
    },
  );
  it.each(rows)(
    "retains the genuine curved seat while keeping long top/down members for $variant.specs.size_label",
    (row) => {
      const built = buildCherry(row),
        seat = built.pathEvidence.find((p) => p.name === "seat_tube")!.sampled;
      const chord = new T.Line3(seat.points[0], seat.points.at(-1)!);
      const bend = Math.max(
        ...seat.points.map((p) =>
          chord.closestPointToPoint(p, true, new T.Vector3()).distanceTo(p),
        ),
      );
      expect(bend).toBeGreaterThan(0.025);
      for (const name of ["top_tube", "downtube"]) {
        const member = built.pathEvidence.find((p) => p.name === name)!.sampled;
        expect(
          Math.max(
            ...member.straightRanges.map((r) =>
              member.points[r.from].distanceTo(member.points[r.to]),
            ),
          ),
        ).toBeGreaterThan(0.25);
      }
      built.geometry.dispose();
    },
  );
});
