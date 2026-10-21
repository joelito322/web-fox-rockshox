import type { ComponentProps } from "react";
import BikeV6 from "./BikeV6";
export default function BikeV7(props: ComponentProps<typeof BikeV6>) {
  return <BikeV6 {...props} completeBody />;
}
