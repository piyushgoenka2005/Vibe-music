import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { getFinanceApplicationById } from "@/lib/server/financeRepository";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const application = await getFinanceApplicationById(id);
    if (!application) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const sessionUser = await getSessionUser();
    const isOwner =
      (sessionUser?.uid && application.userId === sessionUser.uid) ||
      (sessionUser?.email &&
        application.email.toLowerCase() === sessionUser.email.toLowerCase());

    if (!isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ application });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load application" },
      { status: 500 }
    );
  }
}
