import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useSearchFilters } from "./useSearchFilters";

afterEach(() => vi.useRealTimers());
describe("administration search requests", () => {
  it("commits a rapid search and its page together without intermediate requests", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ search, page }) => useSearchFilters(search, page), {
      initialProps: { search: "", page: 3 },
    });
    rerender({ search: "f", page: 0 });
    rerender({ search: "fox", page: 0 });
    expect(result.current).toMatchObject({ search: "", page: 3 });
    act(() => vi.advanceTimersByTime(299));
    expect(result.current).toMatchObject({ search: "", page: 3 });
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toMatchObject({ search: "fox", page: 0 });
    rerender({ search: "fox", page: 1 });
    expect(result.current).toMatchObject({ search: "fox", page: 1 });
  });
  it("switches categories immediately and cancels the previous pending search", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ search, scope }) => useSearchFilters(search, 0, scope), {
      initialProps: { search: "", scope: "frame" },
    });
    rerender({ search: "canyon", scope: "frame" });
    rerender({ search: "", scope: "fork" });
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toMatchObject({ search: "", page: 0 });
    rerender({ search: "fox", scope: "fork" });
    expect(result.current).toMatchObject({ search: "", page: 0 });
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toMatchObject({ search: "fox", page: 0 });
  });
});
