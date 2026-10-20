import "./BrandLogo.css";

/** Original ATLAS signature: angular monogram and custom, slanted lettering. */
export function BrandLogo() {
  return (
    <svg className="brand-logo" viewBox="0 0 268 46" aria-hidden="true" focusable="false">
      <path d="M0 40 20 4h12L12 40Zm24-22 12 22h13L30 4H20Z" fill="currentColor" />
      <path className="brand-cut" d="m15 27 5-8h16l4 8Z" />
      <g fill="currentColor" fillRule="evenodd">
        <path d="m56 36 16-26h11l7 26H80l-1-5H68l-3 5Zm16-12h6l-2-7Z" />
        <path d="M93 10h29l-3 8h-9l-5 18H95l5-18H90Z" />
        <path d="M127 10h10l-5 18h16l-3 8h-26Z" />
        <path d="m147 36 16-26h11l7 26h-10l-1-5h-11l-3 5Zm16-12h6l-2-7Z" />
        <path d="M190 10h28l-3 8h-19l-1 3h15l5 6-3 9h-32l3-8h21l1-3h-15l-5-6Z" />
      </g>
      <path className="brand-cut" d="m225 10-8 26h3l8-26Z" />
      <text x="235" y="25" fill="currentColor" fontSize="12" fontWeight="800" letterSpacing=".3">MTB</text>
      <path d="M235 30h24" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
