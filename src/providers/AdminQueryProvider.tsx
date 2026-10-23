"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  isAdminMutationRequest,
  notifyAdminDataChanged,
  subscribeAdminDataChanged,
} from "@/lib/admin/adminLiveSync";

/** Visible admin screens re-poll so changes by other admins/tabs appear without reloads. */
const ADMIN_POLL_MS = 0;
/** Lets a mutation's own onSuccess (optimistic cache edits, targeted invalidation) run first. */
const INVALIDATE_DEBOUNCE_MS = 250;
/** Admin data cached for 5 minutes with Redis-backed invalidation */
const ADMIN_STALE_TIME_MS = 5 * 60_000;

function makeAdminQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: ADMIN_STALE_TIME_MS,
        gcTime: 30 * 60_000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchInterval: ADMIN_POLL_MS,
        refetchIntervalInBackground: false,
        retry: 1,
        // Enable structural sharing to prevent unnecessary re-renders
        structuralSharing: true,
      },
      mutations: {
        // Don't retry mutations on failure
        retry: 0,
      },
    },
  });
}

/** Prefetch admin query on link hover for instant navigation */
export function prefetchAdminQuery(
  _queryKey: readonly unknown[],
  _queryFn: () => Promise<unknown>,
) {
  // This will be called by the query client in components
  // Actual prefetching is done via useQueryClient().prefetchQuery()
}

/**
 * Admin-only query client: fast cached navigation (30s stale time, smooth tab switches),
 * and targeted live synchronization across tabs without tearing down the admin session
 * or over-fetching background queries.
 */
export default function AdminQueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(makeAdminQueryClient);

  useEffect(() => {
    let timer: number | undefined;
    const scheduleInvalidate = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        // Only refresh active queries on screen, never session or notification badges
        void client.invalidateQueries({
          type: "active",
          predicate: (query) => {
            const rootKey = query.queryKey[0];
            return rootKey !== "admin-session" && rootKey !== "admin-notifications-count";
          },
        });
      }, INVALIDATE_DEBOUNCE_MS);
    };
    const unsubscribe = subscribeAdminDataChanged(scheduleInvalidate);

    const originalFetch = window.fetch;
    const trackedFetch: typeof fetch = async (input, init) => {
      const response = await originalFetch.call(window, input, init);
      if (response.ok && isAdminMutationRequest(input, init)) notifyAdminDataChanged();
      return response;
    };
    window.fetch = trackedFetch;

    return () => {
      window.clearTimeout(timer);
      unsubscribe();
      if (window.fetch === trackedFetch) window.fetch = originalFetch;
    };
  }, [client]);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
