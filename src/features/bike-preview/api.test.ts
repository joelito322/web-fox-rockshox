import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
const remote = vi.hoisted(() => ({
  user: "owner",
  download: vi.fn(),
  sources: vi.fn(),
  upload: vi.fn(),
}));
vi.mock("../../lib/supabase", () => ({
  requireSupabase: () => ({
    auth: {
      getSession: async () => ({
        data: { session: { user: { id: remote.user } } },
      }),
    },
    storage: { from: () => ({ download: remote.download, upload: remote.upload }) },
    from: () => {
      let ids: string[] = [];
      return {
        select() {
          return this;
        },
        in(_key: string, values: string[]) {
          ids = values;
          return this;
        },
        eq() {
          return this;
        },
        abortSignal() {
          return remote.sources(ids);
        },
      };
    },
  }),
}));
vi.mock("../garage/api", () => ({
  readBuild: vi.fn(),
  readCachedBuild: vi.fn(),
  savedBuildKey: vi.fn(),
}));
vi.mock("../catalog/api", () => ({
  readVariants: vi.fn(),
  readCachedVariants: vi.fn(),
}));
import { captureSavedBuild, getBuildPreview, readCachedPresetPreviewSources } from "./api";
import { readBuild } from "../garage/api";
import { readVariants } from "../catalog/api";
import { emptyConfiguration } from "../configurator/model";
const blob = new Blob(["stored preview"], { type: "image/webp" });
describe("shared preview cancellation", () => {
  beforeEach(() => {
    remote.user = "owner";
    remote.download.mockReset();
  });
  it("retries for an active consumer when the original card was cancelled", async () => {
    let release!: (v: { data: Blob; error: null }) => void;
    remote.download.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    remote.download.mockResolvedValue({ data: blob, error: null });
    const controller = new AbortController();
    const first = getBuildPreview("owner", "one", 1, false, controller.signal);
    const joined = getBuildPreview("owner", "one", 1, false);
    const rejected = expect(first).rejects.toThrow();
    await vi.waitFor(() => expect(remote.download).toHaveBeenCalledTimes(1));
    controller.abort();
    release({ data: blob, error: null });
    await rejected;
    expect(await joined).toBe(blob);
    expect(remote.download).toHaveBeenCalledTimes(2);
  });
  it("does not expose a shared result to a cancelled joining consumer", async () => {
    let release!: (v: { data: Blob; error: null }) => void;
    remote.download.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const first = getBuildPreview("owner", "two", 1, false);
    const controller = new AbortController();
    const joined = getBuildPreview("owner", "two", 1, false, controller.signal);
    const rejected = expect(joined).rejects.toThrow();
    await vi.waitFor(() => expect(remote.download).toHaveBeenCalledTimes(1));
    controller.abort();
    release({ data: blob, error: null });
    expect(await first).toBe(blob);
    await rejected;
    expect(remote.download).toHaveBeenCalledTimes(1);
  });
  it("discards private downloads when the signed-in account changes", async () => {
    let release!: (v: { data: Blob; error: null }) => void;
    remote.download.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const first = getBuildPreview("owner", "three", 1, false);
    await vi.waitFor(() => expect(remote.download).toHaveBeenCalledTimes(1));
    remote.user = "other";
    release({ data: blob, error: null });
    expect(await first).toBeNull();
  });
});

describe("preset source batch reuse", () => {
  beforeEach(() => {
    remote.sources.mockReset();
    remote.sources.mockImplementation(async (ids: string[]) => ({
      data: ids.map((id) => ({ id, name: id, bike_preset_items: [] })),
      error: null,
    }));
  });
  it("fetches a batch once and reuses its subset without more requests", async () => {
    const cache = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    await readCachedPresetPreviewSources(cache, ["one", "two"]);
    expect(
      Object.keys(await readCachedPresetPreviewSources(cache, ["two"])),
    ).toEqual(["two"]);
    expect(remote.sources).toHaveBeenCalledTimes(1);
    await readCachedPresetPreviewSources(cache, ["two", "three"]);
    expect(remote.sources).toHaveBeenLastCalledWith(["three"]);
    cache.clear();
  });
  it("refreshes invalidated sources and never reuses an identity-cleared cache", async () => {
    const cache = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    await readCachedPresetPreviewSources(cache, ["one"]);
    await cache.invalidateQueries({ queryKey: ["preset-preview-source"] });
    await readCachedPresetPreviewSources(cache, ["one"]);
    expect(remote.sources).toHaveBeenCalledTimes(2);
    cache.clear();
    await readCachedPresetPreviewSources(cache, ["one"]);
    expect(remote.sources).toHaveBeenCalledTimes(3);
    cache.clear();
  });
});

describe("renamed saved preview", () => {
  it("reuses a confirmed preview without preparing the bike again", async () => {
    remote.user = "owner";
    remote.upload.mockResolvedValue({ error: null });
    vi.mocked(readBuild).mockResolvedValue({ revision: 2 } as Awaited<ReturnType<typeof readBuild>>);
    vi.mocked(readVariants).mockClear();
    const configuration = { ...emptyConfiguration(), name: "Renamed", items: [{ slot: "frame" as const, variantId: "frame", finishId: "black", customColor: null }] };
    expect(await captureSavedBuild("owner", "rename", 2, configuration, {}, blob)).toBe(blob);
    expect(readVariants).not.toHaveBeenCalled();
    expect(remote.upload).toHaveBeenCalledWith("builds/owner/rename/2-v1.webp", blob, expect.any(Object));
  });
  it("still rejects reuse when another save already changed the revision", async () => {
    remote.user = "owner";
    remote.upload.mockClear();
    vi.mocked(readBuild).mockResolvedValue({ revision: 4 } as Awaited<ReturnType<typeof readBuild>>);
    const configuration = { ...emptyConfiguration(), items: [{ slot: "frame" as const, variantId: "frame", finishId: "black", customColor: null }] };
    expect(await captureSavedBuild("owner", "rename-stale", 3, configuration, {}, blob)).toBeNull();
    expect(remote.upload).not.toHaveBeenCalled();
  });
});
