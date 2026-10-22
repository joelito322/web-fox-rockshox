import { useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
const bases = ["/bicicletas", "/componentes", "/mis-bicicletas"] as const;
type Tab = (typeof bases)[number];
type Visit = { url: string; y: number };
const memory: Partial<Record<Tab, Visit>> = {};
function tab(path: string) {
  return bases.find((base) => path === base || path.startsWith(base + "/"));
}
function listingKey(url: string) {
  const address = new URL(url, window.location.origin);
  const base = tab(address.pathname);
  if (base === "/componentes" || base === "/bicicletas") {
    address.pathname = base;
    address.searchParams.delete("detail");
    address.searchParams.delete("variant");
  }
  address.searchParams.sort();
  return address.pathname + address.search;
}
function read(base: Tab): Visit | undefined {
  try {
    const value = JSON.parse(
      sessionStorage.getItem(`atlas:tab:${base}`) ?? "null",
    );
    if (
      value &&
      typeof value.url === "string" &&
      tab(value.url.split("?")[0]) === base &&
      typeof value.y === "number" &&
      Number.isFinite(value.y)
    )
      return value;
  } catch {
    /* Session memory is optional. */
  }
  return undefined;
}
export function useWorkspaceLinks() {
  const location = useLocation();
  const visibleListing = useRef<string | null>(null);
  const [visits, setVisits] = useState(
    () =>
      Object.fromEntries(bases.map((b) => [b, read(b)])) as Partial<
        Record<Tab, Visit>
      >,
  );
  useLayoutEffect(() => {
    const base = tab(location.pathname);
    if (!base) {
      visibleListing.current = null;
      return;
    }
    const url = location.pathname + location.search;
    const key = listingKey(url);
    const sameListing = visibleListing.current === key;
    visibleListing.current = key;
    const prior = memory[base] ?? read(base);
    const visit = { url, y: sameListing ? window.scrollY : prior && listingKey(prior.url) === key ? prior.y : 0 };
    memory[base] = visit;
    setVisits((previous) => ({ ...previous, [base]: visit }));
    const frame = sameListing ? null : requestAnimationFrame(() =>
      window.scrollTo({ top: visit.y, behavior: "instant" }),
    );
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      const current = { url, y: window.scrollY };
      memory[base] = current;
      try {
        sessionStorage.setItem(`atlas:tab:${base}`, JSON.stringify(current));
      } catch {
        /* Navigation still works without storage. */
      }
    };
  }, [location.pathname, location.search]);
  return (base: Tab) => visits[base]?.url ?? base;
}
