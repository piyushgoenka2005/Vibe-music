import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  getHeaderSettings,
  updateHeaderSettings,
} from "@/lib/server/navigation/navigationRepository";
import { z } from "zod";

const headerSettingsSchema = z.object({
  logoAsset: z.string().nullable().optional(),
  searchVisibility: z.boolean().optional(),
  searchPlaceholder: z.string().max(255).optional(),
  profileVisibility: z.boolean().optional(),
  profileDestination: z.string().optional(),
  wishlistVisibility: z.boolean().optional(),
  wishlistDestination: z.string().optional(),
  cartVisibility: z.boolean().optional(),
  cartDestination: z.string().optional(),
  utilityBarActive: z.boolean().optional(),
  shippingAnnouncement: z.string().nullable().optional(),
  shippingThreshold: z.number().nullable().optional(),
});

export async function GET(request: Request) {
  try {
    await requireAdmin("settings:read", request);
    const settings = await getHeaderSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    return adminErrorResponse(error, request);
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin("settings:write", request);
    const body = await request.json();
    const parsed = headerSettingsSchema.parse(body);
    const settings = await updateHeaderSettings(parsed);
    return NextResponse.json({ settings });
  } catch (error) {
    return adminErrorResponse(error, request);
  }
}
