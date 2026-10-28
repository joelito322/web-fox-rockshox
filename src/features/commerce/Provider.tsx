import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "../auth/provider";
import { aggregateLines, lineSchema, type CartLine } from "./model";
import { getCart, saveCart } from "./api";
import "./commerce.css";
const guestKey = "atlas:guest-cart:v1";
function readGuest(): CartLine[] {
  try {
    return aggregateLines(
      z
        .array(lineSchema)
        .max(100)
        .parse(JSON.parse(localStorage.getItem(guestKey) ?? "[]")),
    );
  } catch {
    return [];
  }
}
type Commerce = {
  scope: string;
  lines: CartLine[];
  guest: CartLine[];
  revision?: number;
  loading: boolean;
  busy: boolean;
  error: unknown;
  write: (lines: CartLine[]) => Promise<void>;
  add: (lines: CartLine[], replace?: boolean) => Promise<void>;
  merge: (mode: "merge" | "guest" | "account") => Promise<void>;
  refresh: () => Promise<unknown>;
};
const Context = createContext<Commerce | null>(null);
export const useCommerce = () => useContext(Context);
export function CommerceProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const client = useQueryClient();
  const [guest, setGuest] = useState(readGuest);
  const [pending, setPending] = useState(false);
  const scopeKey = `${auth.user?.id}:${auth.roleId}:${[...auth.permissions].sort().join(":")}`;
  const scope = useRef({ id: scopeKey, generation: 0 });
  if (scope.current.id !== scopeKey)
    scope.current = { id: scopeKey, generation: scope.current.generation + 1 };
  const active = scope.current.generation;
  const account = auth.user?.id;
  const query = useQuery({
    queryKey: ["sales", "cart", account],
    enabled: !!account && !auth.loading && !!auth.roleId,
    staleTime: 15_000,
    queryFn: ({ signal }) => getCart(signal, account),
  });
  useEffect(() => {
    try {
      localStorage.setItem(guestKey, JSON.stringify(guest));
    } catch {
      /* Private browsing can retain this anonymous selection in memory. */
    }
  }, [guest]);
  const lines = account
    ? (query.data?.items.map(({ offer_id, quantity }) => ({
        offer_id,
        quantity,
      })) ?? [])
    : guest;
  async function write(next: CartLine[]) {
    if (pending) throw new Error("sales_operation_pending");
    const valid = aggregateLines(next);
    setPending(true);
    try {
      if (account) {
        const current =
          query.data ??
          (await client.fetchQuery({
            queryKey: ["sales", "cart", account],
            queryFn: ({ signal }) => getCart(signal, account),
          }));
        if (scope.current.generation !== active)
          throw new Error("sales_account_changed");
        if (!current) throw new Error("sales_operation_pending");
        const result = await saveCart(current.revision, valid, account);
        if (scope.current.generation === active)
          client.setQueryData(["sales", "cart", account], result);
      } else if (scope.current.generation === active) setGuest(valid);
    } finally {
      if (scope.current.generation === active) setPending(false);
    }
  }
  async function add(next: CartLine[], replace = false) {
    if (account && !query.data) throw new Error("sales_operation_pending");
    await write(replace ? next : aggregateLines([...lines, ...next]));
  }
  async function merge(mode: "merge" | "guest" | "account") {
    if (mode === "merge") await add(guest);
    if (mode === "guest") await write(guest);
    if (scope.current.generation === active) {
      setGuest([]);
      try {
        localStorage.removeItem(guestKey);
      } catch {
        /* Remote cart remains authoritative. */
      }
    }
  }
  // A changed identity releases local button state without remounting routes.
  useEffect(() => {
    setPending(false);
  }, [scopeKey]);
  return (
    <Context.Provider
      value={{
        scope: scopeKey,
        lines,
        guest: account ? guest : [],
        revision: query.data?.revision,
        loading:
          !!account && (auth.loading || (!!auth.roleId && query.isPending)),
        busy: pending,
        error: query.error,
        write,
        add,
        merge,
        refresh: query.refetch,
      }}
    >
      {children}
    </Context.Provider>
  );
}
