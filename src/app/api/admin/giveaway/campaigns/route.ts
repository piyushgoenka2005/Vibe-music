import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { adminGiveawayCampaignSchema } from "@/lib/validations/admin-giveaway";
import { saveGiveawayCampaign } from "@/lib/server/giveawayEntryService";
import { listAllGiveawayCampaigns } from "@/lib/server/giveawayRepository";

export async function GET() {
  try {
    await requireAdmin("giveaways:read");
    const campaigns = await listAllGiveawayCampaigns();
    return NextResponse.json({ campaigns });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin("giveaways:write");
    const body = await request.json();
    const parsed = adminGiveawayCampaignSchema.parse(body);
    const campaign = await saveGiveawayCampaign(
      {
        ...parsed,
        prizeImageUrl: parsed.prizeImageUrl || null,
      },
      { id: admin.uid, email: admin.email, request }
    );
    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
