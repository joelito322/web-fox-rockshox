import { brake as frozenBrake } from "../v5/components";
// V5 placed both calipers behind the axle. Rear mounts are ahead of the axle;
// keep lever/line assembly, model-specific bodies and the rotor pad channel.
export const rearCaliperOffset = 0.116;
export const brake: typeof frozenBrake = (
  key,
  variant,
  assembly,
  front,
  color,
  width,
  completeBody = false,
) =>
  frozenBrake(
    key,
    variant,
    front
      ? assembly
      : {
          ...assembly,
          rear: [
            assembly.rear[0] + rearCaliperOffset,
            assembly.rear[1],
            assembly.rear[2],
          ],
        },
    front,
    color,
    width,
    completeBody,
  );
