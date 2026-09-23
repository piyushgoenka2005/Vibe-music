import { notFound, redirect } from "next/navigation";
import { ResumePaymentClient } from "@/components/orders/ResumePaymentClient";
import { getSessionUser } from "@/lib/auth/server-session";
import { getAdminSession } from "@/lib/server/adminService";
import { canAccessOrder } from "@/lib/server/orderAccess";
import { getOrderById } from "@/lib/server/orderService";
import { withServerPageError } from "@/lib/serverPageError";

export async function generateMetadata({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await getOrderById(orderId);
  return {
    title: order ? `Pay order ${order.id}` : "Complete payment",
  };
}

export default async function ResumePaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ email?: string; trackingToken?: string }>;
}) {
  return withServerPageError(async () => {
    const { orderId } = await params;
    const { email: emailParam, trackingToken: trackingTokenParam } = await searchParams;
    const guestEmail = emailParam?.trim().toLowerCase();
    const trackingToken = trackingTokenParam?.trim();

    const order = await getOrderById(orderId);
    if (!order) notFound();

    const sessionUser = await getSessionUser();
    const adminSession = sessionUser ? await getAdminSession(sessionUser.uid) : null;

    const hasAccess =
      Boolean(adminSession) ||
      canAccessOrder(order, {
        userId: sessionUser?.uid,
        email: guestEmail ?? sessionUser?.email?.toLowerCase(),
        trackingToken,
      });

    if (!hasAccess) notFound();

    const email = guestEmail ?? sessionUser?.email?.toLowerCase() ?? order.email;

    if (order.paymentStatus === "paid") {
      const successParams = new URLSearchParams({ orderId: order.id, email });
      if (order.trackingToken) {
        successParams.set("trackingToken", order.trackingToken);
      }
      redirect(`/checkout/success?${successParams.toString()}`);
    }

    if (order.paymentStatus !== "pending" || order.paymentMethod !== "razorpay") {
      notFound();
    }

    return (
      <main className="storefront-page storefront-page--subtle">
        <ResumePaymentClient order={order} email={email} />
      </main>
    );
  }, "Resume Payment");
}
