import type { ComponentProps } from "react";
import BikeV3 from "./BikeV3";
import { SpatialMeshBuilder } from "./v4/mesh";

// Same reviewed exterior profiles; corrected spatial sweep, distinct immutable identity.
export default function BikeV4(
  props: Omit<ComponentProps<typeof BikeV3>, "Builder">,
) {
  return <BikeV3 {...props} Builder={SpatialMeshBuilder} />;
}
