import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { exportGiveawayEntriesCsv } from "@/lib/server/giveawayEntryService";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin("giveaways:read");
    const { id } = await params;
    const csv = await exportGiveawayEntriesCsv(id);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="giveaway-${id}-entries.csv"`,
      },
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
