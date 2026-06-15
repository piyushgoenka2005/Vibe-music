import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  listAllSectionItems,
  listAllSections,
} from "@/lib/server/homepageService";

export async function GET() {
  try {
    await requireAdmin("homepage:read");
    const [sections, items] = await Promise.all([
      listAllSections(),
      listAllSectionItems(),
    ]);
    return NextResponse.json({ sections, items });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
