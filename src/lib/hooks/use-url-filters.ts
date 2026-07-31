"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

/**
 * URL-driven filters that stay responsive while the server refetches.
 *
 * Every filter/tab change is a server round-trip (new searchParams → new RSC
 * payload). A bare `router.push` blocks with no feedback, so the screen looks
 * frozen for the whole trip — the felt "lag". Wrapping the navigation in a
 * transition hands back `isPending` (dim the affected list while it loads) and
 * keeps the current UI interactive. `replace` + `scroll: false` means filter
 * tweaks neither stack browser history nor jump the viewport to the top.
 */
export function useUrlFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Low-level: navigate to an already-built param set. For callers whose param
  // logic isn't a simple set/delete patch (e.g. resetting dependent params).
  const commit = useCallback(
    (params: URLSearchParams) => {
      const query = params.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [router, pathname],
  );

  // Set (truthy) or delete (null/empty) keys against the current params.
  const updateParams = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      commit(params);
    },
    [searchParams, commit],
  );

  return { isPending, updateParams, commit, searchParams };
}
