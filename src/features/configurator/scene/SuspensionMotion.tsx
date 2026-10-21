import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as T from "three";
import type {
  MotionDefinition,
  MotionPose,
} from "../model/suspension/kinematics";
export type Inspection = {
  definition: NonNullable<MotionDefinition>;
  state: {
    front: number;
    rear: number;
    playing: boolean;
    elapsed: number;
    currentFront: number;
    currentRear: number;
  };
};
export const motionEvent = "atlas:suspension-inspection";
export function notifyMotion() {
  window.dispatchEvent(new Event(motionEvent));
}
function bend(
  mesh: T.Mesh,
  delta: T.Vector3,
  pivot: number,
  rearX: number,
  associatedShifter = false,
  brakeEnds?: { wheelY: number; leverY: number },
) {
  const g = mesh.geometry,
    position = g.getAttribute("position");
  const original = mesh.userData.atlasMotionRest as Float32Array | undefined;
  const matrix = mesh.userData.atlasMotionMatrix as T.Matrix4,
    inverse = mesh.userData.atlasMotionInverse as T.Matrix4;
  const point = new T.Vector3();
  if (!original) return;
  for (let i = 0; i < position.count; i++) {
    point
      .set(original[i * 3], original[i * 3 + 1], original[i * 3 + 2])
      .applyMatrix4(matrix);
    let weight = associatedShifter
      ? point.x < rearX + 0.18
        ? 1
        : 0
      : Math.max(0, Math.min(1, (point.x - pivot) / (rearX - pivot || 1)));
    if (brakeEnds) {
      if (Math.hypot(point.x - rearX, point.y - brakeEnds.wheelY) < 0.2)
        weight = 1;
      else if (Math.hypot(point.x - pivot, point.y - brakeEnds.leverY) < 0.18)
        weight = 0;
    }
    point.addScaledVector(delta, weight).applyMatrix4(inverse);
    position.setXYZ(i, point.x, point.y, point.z);
  }
  position.needsUpdate = true;
  g.computeBoundingSphere();
}
export default function SuspensionMotion({
  root,
  inspection,
}: {
  root: RefObject<T.Group>;
  inspection: Inspection;
}) {
  const { invalidate, gl } = useThree();
  const currentRoot = useRef<T.Group | null>(null);
  const last = useRef({ front: NaN, rear: NaN });
  const deformed = useMemo(
    () => new Map<T.Mesh, T.BufferGeometry>(),
    [inspection],
  );
  useEffect(() => {
    last.current = { front: NaN, rear: NaN };
    const repaint = () => invalidate();
    window.addEventListener(motionEvent, repaint);
    const visibility = () => {
      if (!document.hidden) invalidate();
    };
    document.addEventListener("visibilitychange", visibility);
    invalidate();
    return () => {
      window.removeEventListener(motionEvent, repaint);
      document.removeEventListener("visibilitychange", visibility);
      const group = currentRoot.current ?? root.current;
      if (group) {
        const d = inspection.definition,
          pose = d.pose(0, 0);
        group.rotation.z =
          "settleAngle" in d.base ? Number(d.base.settleAngle) : 0;
        group.position.set(0, 0, 0);
        for (const part of group.children) {
          if (!part.userData.motionSlot) continue;
          part.position.set(0, 0, 0);
          part.traverse((n) => n.userData.applySuspension?.(pose));
        }
      }
      invalidate();
      for (const [mesh, original] of deformed) {
        mesh.geometry.dispose();
        mesh.geometry = original;
        delete mesh.userData.atlasMotionRest;
        delete mesh.userData.atlasMotionMatrix;
        delete mesh.userData.atlasMotionInverse;
      }
    };
  }, [invalidate, inspection, deformed]);
  useFrame((_, delta) => {
    const group = root.current;
    if (!group) return;
    currentRoot.current = group;
    const { definition: d, state } = inspection;
    let front = state.front,
      rear = state.rear;
    if (state.playing && !document.hidden) {
      state.elapsed += Math.min(0.05, delta);
      const cycle = (1 - Math.cos((state.elapsed * 2 * Math.PI) / 3)) / 2;
      front *= cycle;
      rear *= cycle;
      invalidate();
    }
    state.currentFront = front;
    state.currentRear = rear;
    if (last.current.front === front && last.current.rear === rear) return;
    last.current = { front, rear };
    const pose = d.pose(front, rear),
      a = d.base;
    const dx = pose.front[0] - pose.rear[0],
      dy = pose.front[1] - pose.rear[1],
      difference = a.radius("front") - a.radius("rear");
    const angle =
      Math.asin(Math.max(-1, Math.min(1, difference / Math.hypot(dx, dy)))) -
      Math.atan2(dy, dx);
    const oldAngle = "settleAngle" in a ? Number(a.settleAngle) : 0;
    group.rotation.z = angle;
    const neutralRear =
      a.rear[0] * Math.sin(oldAngle) + a.rear[1] * Math.cos(oldAngle);
    const movedRear =
      pose.rear[0] * Math.sin(angle) + pose.rear[1] * Math.cos(angle);
    group.position.y = neutralRear - movedRear;
    for (const part of group.children) {
      const slot = part.userData.motionSlot as string | undefined;
      if (!slot) continue;
      part.traverse((n) => {
        const apply = n.userData.applySuspension as
          | ((pose: MotionPose) => void)
          | undefined;
        apply?.(pose);
      });
      const rearSlot = slot.startsWith("rear_") || slot === "cassette",
        frontSlot = slot.startsWith("front_");
      const old = rearSlot ? a.rear : a.front,
        next = rearSlot ? pose.rear : pose.front;
      if (
        (rearSlot || frontSlot) &&
        !slot.endsWith("brake") &&
        slot !== "rear_derailleur"
      )
        part.position.set(next[0] - old[0], next[1] - old[1], next[2] - old[2]);
      if (
        slot === "chain" ||
        slot === "rear_brake" ||
        slot === "front_brake" ||
        slot === "rear_derailleur"
      ) {
        const rear = slot !== "front_brake",
          old = rear ? a.rear : a.front,
          next = rear ? pose.rear : pose.front;
        part.traverse((node) => {
          if (!(node instanceof T.Mesh)) return;
          if (!deformed.has(node)) {
            const original = node.geometry;
            node.geometry = original.clone();
            node.userData.atlasMotionRest = Float32Array.from(
              node.geometry.getAttribute("position").array,
            );
            part.updateWorldMatrix(true, true);
            node.userData.atlasMotionMatrix = part.matrixWorld
              .clone()
              .invert()
              .multiply(node.matrixWorld);
            node.userData.atlasMotionInverse = node.userData.atlasMotionMatrix
              .clone()
              .invert();
            deformed.set(node, original);
          }
          // These procedural parts use frame coordinates. Keep the lever/front ring fixed,
          // bend only their flexible run towards the moving wheel interface.
          bend(
            node,
            new T.Vector3(next[0] - old[0], next[1] - old[1], next[2] - old[2]),
            slot === "chain" ? 0 : a.bar[0],
            old[0],
            slot === "rear_derailleur",
            slot.endsWith("brake")
              ? { wheelY: old[1], leverY: a.bar[1] }
              : undefined,
          );
        });
      }
    }
    gl.shadowMap.needsUpdate = true;
  });
  return null;
}
