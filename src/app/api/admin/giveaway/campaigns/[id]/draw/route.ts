import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { adminGiveawayDrawSchema } from "@/lib/validations/admin-giveaway";
import { runGiveawayDraw } from "@/lib/server/giveawayEntryService";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin("giveaways:write");
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const parsed = adminGiveawayDrawSchema.parse(body);
    const result = await runGiveawayDraw({
      campaignId: id,
      winnerCount: parsed.winnerCount,
      actorId: admin.uid,
      actorEmail: admin.email,
      request,
    });
    return NextResponse.json(result);
  } catch (error) {
    return adminErrorResponse(error);
  }
}
