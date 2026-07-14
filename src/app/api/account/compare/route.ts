import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { jsonError } from "@/lib/api/route-utils";
import { compareListSchema } from "@/lib/validations/compare";
import { normalizeCompareItems } from "@/lib/compare/compareEngine";
import { getCompareListItems, upsertCompareListItems } from "@/lib/server/compareRepository";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("Authentication required", 401);
  const items = await getCompareListItems(user.uid);
  return NextResponse.json({ items });
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Authentication required", 401);
  const body = await request.json();
  const parsed = compareListSchema.parse(body);
  const items = await upsertCompareListItems(user.uid, normalizeCompareItems(parsed.items));
  return NextResponse.json({ items });
}
