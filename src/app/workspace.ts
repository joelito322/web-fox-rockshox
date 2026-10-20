import { useLayoutEffect, useState } from "react";
import { useLocation } from "react-router-dom";
const bases = ["/bicicletas", "/componentes", "/mis-bicicletas"] as const;
type Tab = (typeof bases)[number];
type Visit = { url: string; y: number };
const memory: Partial<Record<Tab, Visit>> = {};
function tab(path: string) {
  return bases.find((base) => path === base || path.startsWith(base + "/"));
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
  const [visits, setVisits] = useState(
    () =>
      Object.fromEntries(bases.map((b) => [b, read(b)])) as Partial<
        Record<Tab, Visit>
      >,
  );
  useLayoutEffect(() => {
    const base = tab(location.pathname);
    if (!base) return;
    const url = location.pathname + location.search;
    const prior = memory[base] ?? read(base);
    const visit = { url, y: prior?.url === url ? prior.y : 0 };
    memory[base] = visit;
    setVisits((previous) => ({ ...previous, [base]: visit }));
    const frame = requestAnimationFrame(() =>
      window.scrollTo({ top: visit.y, behavior: "instant" }),
    );
    return () => {
      cancelAnimationFrame(frame);
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
