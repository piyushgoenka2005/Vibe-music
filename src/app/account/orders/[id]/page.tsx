import { notFound } from "next/navigation";
import AccountOrderDetail from "@/components/account/AccountOrderDetail";
import { withServerPageError } from "@/components/common/ServerPageErrorFallback";
import { getSessionUser } from "@/lib/auth/server-session";
import { formatOrderIdDisplay } from "@/lib/orderId";
import { canAccessOrder, isPlacedOrder } from "@/lib/server/orderAccess";
import { fetchProductsByIds } from "@/lib/server/storeCatalogRepository";
import { getOrderById } from "@/lib/server/orderService";
import { raceWithTimeout } from "@/lib/server/raceWithTimeout";
import { buildPublicOrderTracking } from "@/lib/server/shipmentService";
import { buildInvoiceUrls } from "@/features/invoice/server/invoiceUrls";
import type { CatalogProduct } from "@/types/catalog";
import type { Order } from "@/types/order";
import type { PublicShipmentTracking } from "@/types/shipment";
import { toOrderTracking } from "@/types/orderTracking";

const EXTRA_DATA_TIMEOUT_MS = 400;

type OrderDetailProduct = Pick<CatalogProduct, "id" | "slug" | "image" | "images" | "imageColor">;

async function loadOrderDetailExtras(order: Order): Promise<{
  shipment: PublicShipmentTracking | null;
  products: OrderDetailProduct[];
}> {
  const trackingFallback = {
    order: toOrderTracking(order),
    shipment: null as PublicShipmentTracking | null,
  };

  const [trackingResult, products] = await Promise.all([
    raceWithTimeout(buildPublicOrderTracking(order), trackingFallback, EXTRA_DATA_TIMEOUT_MS),
    raceWithTimeout(
      fetchProductsByIds(order.items.map((item) => item.productId)),
      [] as CatalogProduct[],
      EXTRA_DATA_TIMEOUT_MS,
    ),
  ]);

  return {
    shipment: trackingResult.shipment,
    products: products.map((product) => ({
      id: product.id,
      slug: product.slug,
      image: product.image,
      images: product.images,
      imageColor: product.imageColor,
    })),
  };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(id);

  return {
    title: order ? `Order ${formatOrderIdDisplay(order.id)}` : "Order details",
  };
}

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return withServerPageError(async () => {
    const { id } = await params;
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      notFound();
    }

    const order = await getOrderById(id);
    if (
      !order ||
      !isPlacedOrder(order) ||
      !canAccessOrder(order, {
        userId: sessionUser.uid,
        email: sessionUser.email ?? undefined,
      })
    ) {
      notFound();
    }

    const { shipment, products } = await loadOrderDetailExtras(order);

    return (
      <AccountOrderDetail
        order={order}
        shipment={shipment}
        invoiceUrls={buildInvoiceUrls(order)}
        products={products}
      />
    );
  }, "Order Details");
}
