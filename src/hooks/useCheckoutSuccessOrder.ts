"use client";

import { useQuery } from "@tanstack/react-query";
import { orderNeedsPlacementRefresh } from "@/lib/orderPlacement";
import {
  fetchGuestOrder,
  fetchOrder,
  type OrderFetchResult,
} from "@/services/orderService";

const ACTIVE_REFETCH_MS = 3_000;

export function useCheckoutSuccessOrder(options: {
  orderId: string | null;
  email: string | null;
  trackingToken: string | null;
  isAuthenticated: boolean;
  initial?: OrderFetchResult | null;
}) {
  const { orderId, email, trackingToken, isAuthenticated, initial } = options;

  return useQuery({
    queryKey: ["checkout-success-order", orderId, email, trackingToken, isAuthenticated],
    enabled: Boolean(orderId),
    queryFn: async (): Promise<OrderFetchResult> => {
      if (!orderId) {
        throw new Error("Order ID missing");
      }

      if (isAuthenticated) {
        return fetchOrder(orderId);
      }

      if (!trackingToken && !email) {
        throw new Error("Email or tracking token is required to view this order");
      }

      return fetchGuestOrder(orderId, {
        email: email ?? undefined,
        trackingToken: trackingToken ?? undefined,
      });
    },
    initialData: initial ?? undefined,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    refetchInterval: (query) => {
      const order = query.state.data?.order;
      if (!order) return false;
      return orderNeedsPlacementRefresh(order) ? ACTIVE_REFETCH_MS : false;
    },
  });
}
