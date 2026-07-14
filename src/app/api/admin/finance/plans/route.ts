import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { logAuditEvent } from "@/lib/server/auditLog";
import { listFinancePlans, upsertFinancePlan } from "@/lib/server/financeRepository";
import { adminFinancePlanSchema } from "@/lib/validations/admin-finance";

export async function GET() {
  try {
    await requireAdmin("finance:read");
    const plans = await listFinancePlans({ includeInactive: true });
    return NextResponse.json({ plans });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin("finance:write", request);
    const body = await request.json();
    const parsed = adminFinancePlanSchema.parse(body);
    const now = new Date().toISOString();
    const plan = await upsertFinancePlan({
      id: parsed.id ?? randomUUID(),
      providerId: parsed.providerId,
      name: parsed.name,
      tenureMonths: parsed.tenureMonths,
      interestRateAnnual: parsed.interestRateAnnual ?? 0,
      isNoCostEmi: parsed.isNoCostEmi ?? false,
      emiType: parsed.emiType ?? "card",
      minOrderValue: parsed.minOrderValue ?? 5000,
      maxOrderValue: parsed.maxOrderValue ?? 500000,
      downPaymentMinPct: parsed.downPaymentMinPct ?? 0,
      status: parsed.status ?? "active",
      createdAt: now,
      updatedAt: now,
    });
    await logAuditEvent({
      action: "finance.plan.upserted",
      actorId: admin.uid,
      actorEmail: admin.email,
      resourceType: "finance_plan",
      resourceId: plan.id,
      request,
    });
    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
