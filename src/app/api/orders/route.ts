import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api/route-utils";
import { getSessionUser } from "@/lib/auth/server-session";
import { listOrdersForUser } from "@/lib/server/orderService";

export async function GET(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await listOrdersForUser(
      sessionUser.uid,
      sessionUser.email ?? undefined
    );

    return NextResponse.json({ orders });
  } catch (error) {
    return handleRouteError(error, "api/orders", request);
  }
}
