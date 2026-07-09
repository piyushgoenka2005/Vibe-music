"use client";

import { useQuery } from "@tanstack/react-query";
import { orderNeedsInvoiceRefresh } from "@/features/invoice/utils/invoice-utils";
import { fetchOrder, type OrderFetchResult } from "@/services/orderService";

const ACTIVE_REFETCH_MS = 5_000;
const IDLE_REFETCH_MS = 30_000;

export function useOrderDetail(orderId: string, initial?: OrderFetchResult) {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: () => fetchOrder(orderId),
    initialData: initial,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    refetchInterval: (query) => {
      const order = query.state.data?.order;
      if (!order) return false;
      return orderNeedsInvoiceRefresh(order) ? ACTIVE_REFETCH_MS : IDLE_REFETCH_MS;
    },
  });
}
