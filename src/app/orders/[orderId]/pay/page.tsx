import { notFound, redirect } from "next/navigation";
import { ResumePaymentClient } from "@/components/orders/ResumePaymentClient";
import { getSessionUser } from "@/lib/auth/server-session";
import { getAdminSession } from "@/lib/server/adminService";
import { isDemoPaymentsAllowed, isRazorpayConfigured } from "@/lib/server/env";
import { canAccessOrder } from "@/lib/server/orderAccess";
import { getOrderById } from "@/lib/server/orderService";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
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
  searchParams: Promise<{ email?: string }>;
}) {
  const { orderId } = await params;
  const { email: emailParam } = await searchParams;
  const guestEmail = emailParam?.trim().toLowerCase();

  const order = await getOrderById(orderId);
  if (!order) notFound();

  const sessionUser = await getSessionUser();
  const adminSession = sessionUser
    ? await getAdminSession(sessionUser.uid)
    : null;

  const hasAccess =
    Boolean(adminSession) ||
    canAccessOrder(order, {
      userId: sessionUser?.uid,
      email: guestEmail ?? sessionUser?.email?.toLowerCase(),
    });

  if (!hasAccess) notFound();

  const email = guestEmail ?? sessionUser?.email?.toLowerCase() ?? order.email;

  if (order.paymentStatus === "paid") {
    const params = new URLSearchParams({ orderId: order.id, email });
    redirect(`/checkout/success?${params.toString()}`);
  }

  if (order.paymentStatus !== "pending" || order.paymentMethod !== "razorpay") {
    notFound();
  }

  const demoMode = !isRazorpayConfigured() && isDemoPaymentsAllowed();

  return (
    <main className="storefront-page storefront-page--subtle" id="main-content">
      <ResumePaymentClient order={order} email={email} demoMode={demoMode} />
    </main>
  );
}
