import { describe, it, expect } from "vitest";
import * as T from "three";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  buildSender,
  buildSenderLink,
  senderAnchors,
  senderRegistration,
} from "./frames";
import rows from "./predecessors.json";
import source from "../../supabase/catalog/frames-v24-reviewed.json";
import uploads from "./uploads.json";
import protectedCaptures from "./protected-captures.json";
import profile from "./profile.json";
import motion from "./motion-profile.json";
import {
  linkagePose,
  transform,
} from "../../src/features/configurator/model/suspension/kinematics";
import predecessorSHA from "./predecessor-sha.json";
import { parseCatalogImport } from "../../src/features/catalog/model/ingestion";
const sha = (p: string) =>
  createHash("sha256").update(readFileSync(p)).digest("hex");
describe("Sender CFR MY25 isolated revision v24", () => {
  it("publishes only the documented MY25 high-pivot frame in two existing sizes", () => {
    const parsed = parseCatalogImport(source);
    expect(parsed.components).toHaveLength(1);
    expect(parsed.components[0].slug).toBe("canyon-sender-cfr-high-pivot");
    expect(parsed.variants).toHaveLength(2);
    for (const row of rows) {
      const cap = uploads.find((c) => c.predecessor_id === row.variant.id)!;
      const fresh = parsed.variants.find((v) => v.id === cap.variant_id)!;
      expect(fresh.specs).toEqual(row.variant.specs);
      expect(fresh.allowed_finishes).toEqual(row.variant.allowed_finishes);
      expect(fresh.generation).toBe(row.variant.generation);
      expect(fresh.model_year).toBe(row.variant.model_year);
    }
    expect(() =>
      buildSender({ ...rows[0], slug: "commencal-meta-sx-v5" }),
    ).toThrow("Sender-only");
  });
  it("keeps the other fourteen current frames and all predecessor bytes immutable", () => {
    expect(protectedCaptures).toHaveLength(28);
    for (const c of protectedCaptures) expect(sha(c.file)).toBe(c.sha256);
    for (const row of rows)
      expect(sha(row.predecessor_file)).toBe(
        predecessorSHA.find((r) => r.file === row.predecessor_file)!.sha256,
      );
  });
  it("uses separate content addressed successor resources, not mutation", () => {
    for (const c of uploads) {
      expect(c.variant_id).not.toBe(c.predecessor_id);
      expect(sha("models/catalog-v24/exports/" + c.file)).toBe(c.sha256);
      expect(c.storage_path).toContain(c.sha256.slice(0, 24));
    }
  });
  it.each(rows)(
    "keeps head/wheels/BB but corrects documented MY25 visual anchors for $variant.specs.size_label",
    (row) => {
      const a = senderAnchors(row),
        before = row.asset.manifest.anchors;
      for (const key of [
        "head_tube",
        "head_tube_lower",
        "rear_axle",
        "front_axle",
      ])
        expect(a[key]).toEqual(before[key as keyof typeof before]);
      expect(a.chain_idler.position).toEqual(a.suspension_pivot.position);
      expect(
        new T.Vector3(...a.shock_upper.position).distanceTo(
          new T.Vector3(...a.shock_lower.position),
        ) * 1000,
      ).toBeCloseTo(row.variant.specs.shock_fit.eye_to_eye_mm, 8);
      const seatVector = new T.Vector3(...a.saddle.position)
          .sub(new T.Vector3(...a.seat_tube.position))
          .normalize(),
        xy = senderRegistration(row),
        tube = profile.members.find((m) => m.name === "seat_tube")!;
      const tubeAxis = xy(tube.path.at(-1)!)
        .sub(xy(tube.path.at(-2)!))
        .normalize();
      expect(seatVector.dot(tubeAxis)).toBeCloseTo(1, 8);

      expect(a.chain_idler.position[1]).toBeGreaterThan(0.09);
      expect(a.shock_upper.position[1]).toBeGreaterThan(
        a.shock_lower.position[1],
      );
      const cap = uploads.find((c) => c.predecessor_id === row.variant.id)!;
      expect(
        source.assets.find((s) => s.id === cap.asset_id)!.manifest.anchors,
      ).toEqual(a);
    },
  );
  it.each(rows)(
    "retains straight sections without global curves for $variant.specs.size_label",
    (row) => {
      const built = buildSender(row);
      for (const m of built.pathEvidence)
        for (const range of m.sampled.straightRanges) {
          const start = m.sampled.samples[range.from],
            end = m.sampled.samples[range.to],
            line = new T.Line3(start.point, end.point);
          for (let i = range.from; i <= range.to; i++)
            expect(
              line
                .closestPointToPoint(
                  m.sampled.samples[i].point,
                  true,
                  new T.Vector3(),
                )
                .distanceTo(m.sampled.samples[i].point),
            ).toBeLessThan(1e-9);
        }
      built.geometry.dispose();
    },
  );
  it.each(rows)(
    "keeps both sides of the lower rocker opening clear for $variant.specs.size_label",
    (row) => {
      const g = buildSenderLink(row),
        mat = new T.MeshBasicMaterial({ side: T.DoubleSide }),
        mesh = new T.Mesh(g, mat),
        p = senderRegistration(row)([767, 621], 0.15);
      mesh.updateMatrixWorld(true);
      expect(
        new T.Raycaster(p, new T.Vector3(0, 0, -1), 0, 0.3).intersectObject(
          mesh,
        ),
      ).toHaveLength(0);
      g.dispose();
      mat.dispose();
    },
  );
  it("uses a generation-specific high single pivot inspection profile", () => {
    const motion = JSON.parse(
      readFileSync("models/catalog-v24/motion-profile.json", "utf8"),
    );
    expect(motion.registration.bottom_bracket).toEqual(
      profile.image_landmarks.bottom_bracket,
    );
    expect(motion.joints.a).toEqual(profile.image_landmarks.pivot);
    expect(motion.rear_body).toBe("input");
    expect(motion.shock_upper_body).toBe("fixed");
    expect(motion.shock_lower_body).toBe("output");
    expect(motion.max_input_radians).toBeLessThanOrEqual(0.09);
  });
  it.each(rows)(
    "compresses the versioned reduced guide without moving the fixed eye for $variant.specs.size_label",
    (row) => {
      const xy = senderRegistration(row),
        a = senderAnchors(row),
        j = Object.fromEntries(
          Object.entries(motion.joints).map(([k, p]) => [k, xy(p).toArray()]),
        );
      const upper = a.shock_upper.position,
        lower = a.shock_lower.position,
        rear = a.rear_axle.position;
      const distance = (p: number[], q: number[]) =>
        Math.hypot(p[0] - q[0], p[1] - q[1]);
      const rest = distance(upper, lower);
      for (let i = 0; i <= 20; i++) {
        const pose = linkagePose(
          j as any,
          (-motion.max_input_radians * i) / 20,
        )!;
        expect(pose).not.toBeNull();
        const moved = transform(lower as any, pose.output),
          r = transform(rear as any, pose.input);
        expect([...moved, ...r].every(Number.isFinite)).toBe(true);
        expect(r[1]).toBeGreaterThanOrEqual(rear[1] - 1e-9);
        expect(distance(upper, moved)).toBeLessThanOrEqual(rest + 1e-9);
        expect(transform(upper as any, pose.fixed)).toEqual(upper);
      }
    },
  );
});
