import { requireSupabase } from "../../lib/supabase";

type CallbackKind = "google" | "email" | "recovery" | "invite";
let pending: Promise<CallbackKind> | undefined;

/** Share the verification across StrictMode effects, never across completed visits. */
export function verifyAuthCallback(): Promise<CallbackKind> {
  if (pending) return pending;
  const params = new URLSearchParams(location.search);
  const code = params.get("code");
  const token = params.get("token_hash");
  const type = params.get("type");
  const providerError = params.has("error") || params.has("error_code") ||
    new URLSearchParams(location.hash.slice(1)).has("error");
  history.replaceState(null, "", "/auth/callback");
  pending = (async (): Promise<CallbackKind> => {
    if (providerError) throw new Error("oauth_cancelled");
    const client = requireSupabase();
    if (code && !token && !type) {
      const { data, error } = await client.auth.exchangeCodeForSession(code);
      if (error) throw error;
      if (!data.session) throw new Error("invalid_link");
      return "google";
    }
    if (code || !token || (type !== "email" && type !== "recovery" && type !== "invite"))
      throw new Error("invalid_link");
    const { error } = await client.auth.verifyOtp({ token_hash: token, type });
    if (error) throw error;
    return type;
  })().finally(() => { pending = undefined; });
  return pending;
}
