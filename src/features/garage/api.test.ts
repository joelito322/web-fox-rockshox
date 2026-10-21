import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
const database = vi.hoisted(() => ({ calls: 0, revision: 1, name: "Montaje" }));
vi.mock("../../lib/supabase", () => ({
  requireSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          abortSignal() {
            return this;
          },
          single: async () => {
            database.calls++;
            return {
              data: {
                id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
                name: database.name,
                revision: database.revision,
                updated_at: "2026-10-21T00:00:00Z",
                schema_version: 1,
                build_items: [],
              },
              error: null,
            };
          },
        }),
      }),
    }),
  }),
}));
vi.mock("../auth/provider", () => ({
  useAuth: () => ({ user: null, permissions: [] }),
}));
import { cacheSavedBuild, readBuild, readCachedBuild } from "./api";
const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
function client() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}
describe("saved build request reuse", () => {
  beforeEach(() => {
    database.calls = 0;
    database.revision = 1;
    database.name = "Montaje";
  });
  it("deduplicates opening and reopening for the same owner", async () => {
    const cache = client();
    await Promise.all([
      readCachedBuild(cache, "owner", id),
      readCachedBuild(cache, "owner", id),
    ]);
    await readCachedBuild(cache, "owner", id);
    expect(database.calls).toBe(1);
    cache.clear();
  });
  it("keeps accounts separate and refetches after identity cache is cleared", async () => {
    const cache = client();
    await readCachedBuild(cache, "owner", id);
    await readCachedBuild(cache, "other", id);
    expect(database.calls).toBe(2);
    cache.clear();
    await readCachedBuild(cache, "owner", id);
    expect(database.calls).toBe(3);
    cache.clear();
  });
  it("uses the confirmed save immediately but fresh revision checks still read the server", async () => {
    const cache = client();
    await readCachedBuild(cache, "owner", id);
    const configuration = {
      schemaVersion: 1 as const,
      name: "Renombrada",
      items: [],
    };
    cacheSavedBuild(
      cache,
      "owner",
      {
        id,
        revision: 2,
        name: configuration.name,
        updated_at: "2026-10-21T00:01:00Z",
      },
      configuration,
    );
    configuration.name = "Sin guardar";
    const saved = await readCachedBuild(cache, "owner", id);
    expect(saved.revision).toBe(2);
    expect(saved.configuration.name).toBe("Renombrada");
    expect(database.calls).toBe(1);
    database.revision = 3;
    expect((await readBuild(id)).revision).toBe(3);
    expect(database.calls).toBe(2);
    cache.clear();
  });
  it("does not read a cancelled opening", async () => {
    const cache = client(),
      controller = new AbortController();
    controller.abort();
    await expect(
      readCachedBuild(cache, "owner", id, controller.signal),
    ).rejects.toThrow();
    expect(database.calls).toBe(0);
    cache.clear();
  });
});
