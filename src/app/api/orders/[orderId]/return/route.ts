import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import {
  enforceMutationSecurity,
  enforceRateLimit,
  handleRouteError,
  jsonError,
  parseJsonBody,
} from "@/lib/api/route-utils";
import { getOrderById } from "@/lib/server/orderService";
import {
  createReturnRequest,
  listReturnRequestsByOrderId,
} from "@/lib/server/returnRequestRepository";
import { createAdminNotification } from "@/lib/server/notificationRepository";
import { ROUTES } from "@/lib/routes";
import { createReturnRequestSchema } from "@/lib/validations/wrFeatures";

type RouteContext = { params: Promise<{ orderId: string }> };

async function canAccessOrder(orderId: string, userId: string) {
  const order = await getOrderById(orderId);
  if (!order) return null;
  if (order.userId === userId) return order;
  return null;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return jsonError("Authentication required", 401);
    }

    const { orderId } = await context.params;
    const order = await canAccessOrder(orderId, sessionUser.uid);
    if (!order) {
      return jsonError("Order not found", 404);
    }

    const returns = await listReturnRequestsByOrderId(orderId);
    return NextResponse.json({ returns });
  } catch (error) {
    return handleRouteError(error, "GET /api/orders/[orderId]/return");
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const rateLimited = await enforceRateLimit(request, "return-request", {
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
    if (rateLimited) return rateLimited;

    const csrf = enforceMutationSecurity(request);
    if (csrf) return csrf;

    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return jsonError("Authentication required", 401);
    }

    const { orderId } = await context.params;
    const order = await canAccessOrder(orderId, sessionUser.uid);
    if (!order) {
      return jsonError("Order not found", 404);
    }

    if (!["delivered", "shipped"].includes(order.status)) {
      return jsonError("Returns are only available for shipped or delivered orders", 400);
    }

    const existing = await listReturnRequestsByOrderId(orderId);
    const open = existing.find((item) =>
      ["pending", "approved", "received"].includes(item.status)
    );
    if (open) {
      return jsonError("A return request is already open for this order", 409);
    }

    const body = await parseJsonBody(request, createReturnRequestSchema);
    if ("error" in body) return body.error;

    const returnRequest = await createReturnRequest({
      orderId,
      userId: sessionUser.uid,
      email: order.email,
      reason: body.data.reason,
      details: body.data.details,
    });

    void createAdminNotification({
      type: "return",
      title: "New return request",
      body: `Order ${orderId.slice(0, 8)}… — ${body.data.reason}`,
      link: ROUTES.adminReturns,
    });

    return NextResponse.json({ returnRequest }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, "POST /api/orders/[orderId]/return");
  }
}
