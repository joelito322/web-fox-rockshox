import signature from "../assets/atlas-mtb.svg?no-inline";
import "./BrandLogo.css";

/** Cumbre identity: shared mark and lettering, arranged for the header. */
export function BrandLogo() {
  return (
    <svg
      className="brand-logo"
      viewBox="0 0 356 92"
      aria-hidden="true"
      focusable="false"
    >
      <use href={signature + "#atlas-header"} />
    </svg>
  );
}
