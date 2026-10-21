import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const fixture = vi.hoisted(() => ({
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  delete: vi.fn(),
  refetch: vi.fn(),
}));
vi.mock("../auth/provider", () => ({
  useAuth: () => ({
    user: { id: "owner" },
    permissions: ["builds.delete_own"],
  }),
}));
vi.mock("../bike-preview/Preview", () => ({ SavedBuildPreview: () => null }));
vi.mock("./Details", () => ({ BuildDetails: () => null }));
vi.mock("../../lib/supabase", () => ({ userError: () => "Error" }));
vi.mock("./api", () => ({
  deleteBuild: fixture.delete,
  useBuilds: (page: number) => ({
    isPending: false,
    error: null,
    refetch: fixture.refetch,
    data: {
      count: page ? 25 : 24,
      builds: [
        {
          id: page ? fixture.id : "first",
          name: page ? "Última bicicleta" : "Primera bicicleta",
          revision: 1,
          updated_at: "2026-10-21T00:00:00Z",
          part_count: 0,
        },
      ],
    },
  }),
}));
import GaragePage from "./Page";
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("invalidates every cached page, removes deleted details and returns from an emptied last page", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  fixture.delete.mockResolvedValue(undefined);
  fixture.refetch.mockResolvedValue({ data: { builds: [], count: 24 } });
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  cache.setQueryData(["builds", "owner", 0], { count: 25 });
  for (const key of ["saved-build", "build-detail", "build-preview"])
    cache.setQueryData([key, "owner", fixture.id], { old: true });
  render(
    <QueryClientProvider client={cache}>
      <MemoryRouter initialEntries={["/mis-bicicletas?page=1"]}>
        <GaragePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Opciones de Última bicicleta" }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Eliminar" }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Primera bicicleta" }),
    ).toBeVisible(),
  );
  expect(fixture.delete).toHaveBeenCalledWith(fixture.id);
  expect(cache.getQueryState(["builds", "owner", 0])?.isInvalidated).toBe(true);
  for (const key of ["saved-build", "build-detail", "build-preview"])
    expect(cache.getQueryData([key, "owner", fixture.id])).toBeUndefined();
  expect(fixture.refetch).toHaveBeenCalledTimes(1);
  cache.clear();
});
