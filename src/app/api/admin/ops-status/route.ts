import { NextResponse } from "next/server";
import {
  adminErrorResponse,
  requireAdmin,
} from "@/lib/auth/require-admin";
import { getOpsStatusReport } from "@/lib/server/integrationConfig";

export const dynamic = "force-dynamic";

/** Non-secret production ops matrix for admin Settings. */
export async function GET(request: Request) {
  try {
    await requireAdmin("settings:read");
    return NextResponse.json(getOpsStatusReport());
  } catch (error) {
    return adminErrorResponse(error, request);
  }
}
