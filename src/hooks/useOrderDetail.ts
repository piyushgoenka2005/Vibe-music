"use client";

import { useQuery } from "@tanstack/react-query";
import { orderNeedsInvoiceRefresh } from "@/features/invoice/utils/invoice-utils";
import { fetchOrder, type OrderFetchResult } from "@/services/orderService";

const ACTIVE_REFETCH_MS = 5_000;
const IDLE_REFETCH_MS = 60_000;
const INITIAL_STALE_MS = 60_000;

export function useOrderDetail(orderId: string, initial?: OrderFetchResult) {
  const needsRefresh = initial?.order
    ? orderNeedsInvoiceRefresh(initial.order)
    : false;

  return useQuery({
    queryKey: ["order", orderId],
    queryFn: () => fetchOrder(orderId),
    initialData: initial,
    staleTime: initial && !needsRefresh ? INITIAL_STALE_MS : 0,
    refetchOnWindowFocus: (query) => {
      const order = query.state.data?.order;
      return Boolean(order && orderNeedsInvoiceRefresh(order));
    },
    refetchIntervalInBackground: false,
    refetchInterval: (query) => {
      const order = query.state.data?.order;
      if (!order) return false;
      return orderNeedsInvoiceRefresh(order) ? ACTIVE_REFETCH_MS : IDLE_REFETCH_MS;
    },
  });
}
