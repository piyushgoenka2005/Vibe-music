"use client";

import { useQuery } from "@tanstack/react-query";
import { orderNeedsInvoiceRefresh } from "@/features/invoice/utils/invoice-utils";
import { fetchUserOrders } from "@/services/orderService";
import type { Order } from "@/types/order";

const ACTIVE_REFETCH_MS = 5_000;
const IDLE_REFETCH_MS = 30_000;

export function useUserOrders(initialOrders?: Order[]) {
  return useQuery({
    queryKey: ["user-orders"],
    queryFn: fetchUserOrders,
    initialData: initialOrders,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    refetchInterval: (query) => {
      const orders = query.state.data ?? [];
      if (orders.length === 0) return false;
      return orders.some(orderNeedsInvoiceRefresh)
        ? ACTIVE_REFETCH_MS
        : IDLE_REFETCH_MS;
    },
  });
}
