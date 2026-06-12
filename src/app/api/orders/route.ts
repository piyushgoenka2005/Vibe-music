import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { listOrdersForUser } from "@/lib/server/orderService";

export async function GET() {
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
    const message =
      error instanceof Error ? error.message : "Unable to fetch orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
