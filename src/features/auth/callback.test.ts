import { beforeEach, describe, expect, it, vi } from "vitest";
import { verifyAuthCallback } from "./callback";

const remote = vi.hoisted(() => ({ exchange: vi.fn(), verify: vi.fn() }));
vi.mock("../../lib/supabase", () => ({ requireSupabase: () => ({ auth: {
  exchangeCodeForSession: remote.exchange, verifyOtp: remote.verify,
} }) }));
beforeEach(() => {
  vi.clearAllMocks();
  remote.exchange.mockResolvedValue({ data: { session: { user: { id: "user" } } }, error: null });
  remote.verify.mockResolvedValue({ error: null });
});
describe("authentication callback", () => {
  it("exchanges a PKCE code once across concurrent effects and immediately clears the URL", async () => {
    history.replaceState(null, "", "/auth/callback?code=one-time-code");
    const first = verifyAuthCallback(), second = verifyAuthCallback();
    expect(first).toBe(second);
    expect(location.search).toBe("");
    expect(await first).toBe("google");
    expect(remote.exchange).toHaveBeenCalledExactlyOnceWith("one-time-code");
    expect(remote.verify).not.toHaveBeenCalled();
  });
  it.each(["email", "recovery", "invite"])("preserves %s email verification", async (type) => {
    history.replaceState(null, "", `/auth/callback?token_hash=mail-token&type=${type}`);
    expect(await verifyAuthCallback()).toBe(type);
    expect(remote.verify).toHaveBeenCalledExactlyOnceWith({ token_hash: "mail-token", type });
    expect(remote.exchange).not.toHaveBeenCalled();
  });
  it("does not reuse the previous successful callback on a later visit", async () => {
    history.replaceState(null, "", "/auth/callback?code=first");
    await verifyAuthCallback();
    history.replaceState(null, "", "/auth/callback?code=second");
    await verifyAuthCallback();
    expect(remote.exchange).toHaveBeenCalledTimes(2);
    expect(remote.exchange).toHaveBeenLastCalledWith("second");
  });
  it.each([
    "?error=access_denied&error_description=private-provider-message",
    "#error=access_denied&error_description=private-provider-message",
  ])("handles provider refusal safely: %s", async (suffix) => {
    history.replaceState(null, "", `/auth/callback${suffix}`);
    await expect(verifyAuthCallback()).rejects.toThrow("oauth_cancelled");
    expect(location.search + location.hash).toBe("");
    expect(remote.exchange).not.toHaveBeenCalled();
    expect(remote.verify).not.toHaveBeenCalled();
  });
  it.each(["", "?code=code&token_hash=token&type=email", "?token_hash=token&type=admin", "#access_token=untrusted&refresh_token=untrusted"])("rejects unsupported or ambiguous returns: %s", async (suffix) => {
    history.replaceState(null, "", `/auth/callback${suffix}`);
    await expect(verifyAuthCallback()).rejects.toThrow("invalid_link");
    expect(remote.exchange).not.toHaveBeenCalled();
    expect(remote.verify).not.toHaveBeenCalled();
    expect(location.hash).toBe("");
  });
  it("rejects a failed exchange and permits a fresh attempt", async () => {
    remote.exchange.mockResolvedValueOnce({ data: { session: null }, error: { code: "flow_state_expired" } });
    history.replaceState(null, "", "/auth/callback?code=expired");
    await expect(verifyAuthCallback()).rejects.toEqual({ code: "flow_state_expired" });
    history.replaceState(null, "", "/auth/callback?code=new");
    expect(await verifyAuthCallback()).toBe("google");
  });
  it("requires a session after a successful exchange", async () => {
    remote.exchange.mockResolvedValueOnce({ data: { session: null }, error: null });
    history.replaceState(null, "", "/auth/callback?code=empty");
    await expect(verifyAuthCallback()).rejects.toThrow("invalid_link");
  });
});
