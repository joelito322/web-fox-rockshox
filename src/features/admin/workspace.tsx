import {
  createContext,
  useContext,
  useState,
  useLayoutEffect,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
const Context = createContext<{
  values: Record<string, unknown>;
  set: Dispatch<SetStateAction<Record<string, unknown>>>;
} | null>(null);
export function AdminWorkspace({
  children,
  scopeKey = "",
}: {
  children: ReactNode;
  scopeKey?: string;
}) {
  const [state, setState] = useState<{
    scope: string;
    generation: number;
    values: Record<string, unknown>;
  }>({ scope: scopeKey, generation: 0, values: {} });
  // Clear private UI state synchronously without remounting unrelated routes
  // (login and callback effects must finish exactly once).
  const generation =
    state.scope === scopeKey ? state.generation : state.generation + 1;
  if (state.scope !== scopeKey)
    setState({ scope: scopeKey, generation, values: {} });
  const values = state.scope === scopeKey ? state.values : {};
  const set: Dispatch<SetStateAction<Record<string, unknown>>> = (next) =>
    setState((previous) => {
      // A cleanup or delayed callback from the old identity cannot refill it.
      if (previous.scope !== scopeKey || previous.generation !== generation)
        return previous;
      return {
        scope: scopeKey,
        generation,
        values: typeof next === "function" ? next(previous.values) : next,
      };
    });
  return <Context.Provider value={{ values, set }}>{children}</Context.Provider>;
}
/** Account-scoped memory only: never put account searches or drafts in public URLs. */
export function useAdminState<T>(
  scope: string,
  key: string,
  initial: T,
): [T, Dispatch<SetStateAction<T>>] {
  const context = useContext(Context);
  const [fallback, setFallback] = useState(initial);
  if (!context) return [fallback, setFallback];
  const id = `${scope}:${key}`;
  const value = Object.prototype.hasOwnProperty.call(context.values, id)
    ? (context.values[id] as T)
    : initial;
  return [
    value,
    (next) =>
      context.set((previous) => {
        const current = Object.prototype.hasOwnProperty.call(previous, id)
          ? (previous[id] as T)
          : initial;
        return {
          ...previous,
          [id]:
            typeof next === "function"
              ? (next as (value: T) => T)(current)
              : next,
        };
      }),
  ];
}

/** Retain list position across sections; drawer scroll remains independent. */
export function useAdminScroll(scope: string) {
  const context = useContext(Context);
  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() =>
      window.scrollTo({
        top: Number(context?.values[`scroll:${scope}`] ?? 0),
        behavior: "instant",
      }),
    );
    return () => {
      cancelAnimationFrame(frame);
      const y = window.scrollY;
      context?.set((previous) => ({ ...previous, [`scroll:${scope}`]: y }));
    };
  }, [scope]);
}
