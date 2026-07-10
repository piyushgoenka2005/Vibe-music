import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { listContentPages } from "@/lib/server/contentPageRepository";

export async function GET() {
  try {
    await requireAdmin("settings:read");
    const pages = await listContentPages();
    return NextResponse.json({ pages });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
