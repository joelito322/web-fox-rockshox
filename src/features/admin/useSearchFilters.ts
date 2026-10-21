import { useEffect, useState } from "react";

// Commit search and its first page together: typing on a later page must not
// request that page with either the old search or a partial new search.
export function useSearchFilters(search: string, page: number, scope = "") {
  const [committed, setCommitted] = useState({ search, page, scope });
  useEffect(() => {
    if (scope !== committed.scope) {
      setCommitted({ search, page, scope });
      return;
    }
    if (search === committed.search) return;
    const timer = setTimeout(() => setCommitted({ search, page, scope }), 300);
    return () => clearTimeout(timer);
  }, [search, page, scope, committed.search, committed.scope]);
  if (scope !== committed.scope) return { search, page };
  return search === committed.search ? { search, page } : committed;
}
