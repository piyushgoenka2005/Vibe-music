import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { listFinanceApplicationsForUser } from "@/lib/server/financeRepository";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const applications = await listFinanceApplicationsForUser(user.uid);
    return NextResponse.json({ applications });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load applications" },
      { status: 500 }
    );
  }
}
