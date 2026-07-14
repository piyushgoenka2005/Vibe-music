import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { getRentalPolicy, upsertRentalPolicy } from "@/lib/server/rentalRepository";
import { adminRentalPolicySchema } from "@/lib/validations/admin-rental";

export async function GET() {
  try {
    await requireAdmin("rentals:read");
    const policy = await getRentalPolicy();
    return NextResponse.json({ policy });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin("rentals:write", request);
    const body = await request.json();
    const parsed = adminRentalPolicySchema.parse(body);
    const policy = await upsertRentalPolicy({
      id: "default",
      ...parsed,
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ policy });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
