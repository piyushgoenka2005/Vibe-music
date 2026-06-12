import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { getStoreSettings, updateStoreSettings } from "@/lib/server/settingsService";
import { adminSettingsSchema } from "@/lib/validations/admin";

export async function GET() {
  try {
    await requireAdmin("settings:read");
    const settings = await getStoreSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin("settings:write");
    const body = await request.json();
    const parsed = adminSettingsSchema.parse(body);
    const settings = await updateStoreSettings(parsed);
    return NextResponse.json({ settings });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
