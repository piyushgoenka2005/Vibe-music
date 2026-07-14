import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { adminGiveawayCampaignSchema } from "@/lib/validations/admin-giveaway";
import {
  deleteGiveawayCampaign,
  getGiveawayCampaignById,
} from "@/lib/server/giveawayRepository";
import { saveGiveawayCampaign } from "@/lib/server/giveawayEntryService";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin("giveaways:read");
    const { id } = await params;
    const campaign = await getGiveawayCampaignById(id);
    if (!campaign) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ campaign });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin("giveaways:write");
    const { id } = await params;
    const body = await request.json();
    const parsed = adminGiveawayCampaignSchema.parse({ ...body, id });
    const campaign = await saveGiveawayCampaign(
      {
        ...parsed,
        id,
        prizeImageUrl: parsed.prizeImageUrl || null,
      },
      { id: admin.uid, email: admin.email, request }
    );
    return NextResponse.json({ campaign });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin("giveaways:delete");
    const { id } = await params;
    await deleteGiveawayCampaign(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
