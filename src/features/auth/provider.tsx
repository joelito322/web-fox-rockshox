import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase, userError } from "../../lib/supabase";
import { forgetAccountDrafts } from "./drafts";

type Access = {
  user: User | null;
  loading: boolean;
  permissions: string[];
  roleName: string;
  roleId: string;
  error: string;
  refresh: () => Promise<void>;
};
const AuthContext = createContext<Access | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<Access, "refresh">>({
    user: null,
    loading: true,
    permissions: [],
    roleName: "",
    roleId: "",
    error: "",
  });
  const serial = useRef(0);
  const identity = useRef<string | null>(null);
  const granted = useRef<string[]>([]);
  const refreshFlight = useRef<Promise<void> | null>(null);
  const queryClient = useQueryClient();
  async function update(user: User | null) {
    const request = ++serial.current;
    const changed = identity.current !== (user?.id ?? null);
    if (changed) {
      void queryClient.cancelQueries();
      queryClient.clear();
      // Missing/expired session must preserve recovery for reauthentication.
      // A deliberate signout clears it in Layout once Auth confirms success.
      if (identity.current && user) forgetAccountDrafts(identity.current);
      identity.current = user?.id ?? null;
      granted.current = [];
    }
    if (request !== serial.current) return;
    if (!user || changed)
      setState({
        user,
        loading: !!user,
        permissions: [],
        roleName: "",
        roleId: "",
        error: "",
      });
    if (!user || !supabase) return;
    const { data, error } = await supabase.rpc("get_my_access");
    if (request !== serial.current) return;
    const permissions: string[] = error ? [] : (data?.permissions ?? []);
    const revoked = granted.current.some((permission) => !permissions.includes(permission));
    granted.current = permissions;
    setState({
      user,
      loading: false,
      permissions,
      roleName: error ? "" : (data?.role?.name ?? ""),
      roleId: error ? "" : (data?.role?.id ?? ""),
      error: error ? userError(error) : "",
    });
    if (revoked) {
      void queryClient.cancelQueries();
      queryClient.clear();
    }
  }
  async function refresh() {
    if (!supabase) return;
    // Focus and simultaneous denied requests can arrive together. Share only
    // the in-flight verification; every later focus still checks revocation.
    if (refreshFlight.current) return refreshFlight.current;
    const generation = serial.current;
    const verification = (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (generation !== serial.current) return;
      if (error) {
        await update(null);
        return;
      }
      await update(data.user);
    })();
    refreshFlight.current = verification;
    try {
      await verification;
    } finally {
      if (refreshFlight.current === verification) refreshFlight.current = null;
    }
  }
  useEffect(() => {
    if (!supabase) {
      setState({
        user: null,
        loading: false,
        permissions: [],
        roleName: "",
        roleId: "",
        error: "",
      });
      return;
    }
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      queueMicrotask(() => {
        void update(session?.user ?? null);
      });
    });
    const focus = () => {
      void refresh();
    };
    window.addEventListener("focus", focus);
    window.addEventListener("atlas:access-denied", focus);
    return () => {
      serial.current++;
      data.subscription.unsubscribe();
      window.removeEventListener("focus", focus);
      window.removeEventListener("atlas:access-denied", focus);
    };
  }, []);
  return (
    <AuthContext.Provider value={{ ...state, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider missing");
  return value;
}
export function defaultDestination(permissions: string[]) {
  return permissions.includes("builds.read_own")
    ? "/mis-bicicletas"
    : "/componentes";
}
export function readIntent(): string | null {
  const intent = sessionStorage.getItem("atlas:intent");
  if (
    !intent ||
    !/^\/(configurador(?:\/[0-9a-f-]{36})?|mis-bicicletas)(?:\?[a-zA-Z0-9=&%_-]+)?$/.test(
      intent,
    )
  )
    return null;
  return intent;
}
