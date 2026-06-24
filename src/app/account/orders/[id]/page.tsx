import { notFound } from "next/navigation";
import AccountOrderDetail from "@/components/account/AccountOrderDetail";
import { getSessionUser } from "@/lib/auth/server-session";
import { formatOrderIdDisplay } from "@/lib/orderId";
import { canAccessOrder } from "@/lib/server/orderAccess";
import { fetchProductsByIds } from "@/lib/server/firestoreCatalogRepository";
import { getOrderById } from "@/lib/server/orderService";
import { buildPublicOrderTracking } from "@/lib/server/shipmentService";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);

  return {
    title: order
      ? `Order ${formatOrderIdDisplay(order.id)}`
      : "Order details",
  };
}

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    notFound();
  }

  const order = await getOrderById(id);
  if (
    !order ||
    !canAccessOrder(order, {
      userId: sessionUser.uid,
      email: sessionUser.email ?? undefined,
    })
  ) {
    notFound();
  }

  const [{ shipment }, products] = await Promise.all([
    buildPublicOrderTracking(order),
    fetchProductsByIds(order.items.map((item) => item.productId)),
  ]);

  return (
    <AccountOrderDetail
      order={order}
      shipment={shipment}
      products={products.map((product) => ({
        id: product.id,
        slug: product.slug,
        image: product.image,
        images: product.images,
        imageColor: product.imageColor,
      }))}
    />
  );
}
