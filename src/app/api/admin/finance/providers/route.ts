import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { logAuditEvent } from "@/lib/server/auditLog";
import { upsertFinanceProvider } from "@/lib/server/financeRepository";
import { adminFinanceProviderSchema } from "@/lib/validations/admin-finance";
import { slugify } from "@/lib/slug";
import { listFinanceProviders } from "@/lib/server/financeRepository";

export async function GET() {
  try {
    await requireAdmin("finance:read");
    const providers = await listFinanceProviders({ includeInactive: true });
    return NextResponse.json({ providers });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin("finance:write", request);
    const body = await request.json();
    const parsed = adminFinanceProviderSchema.parse(body);
    const now = new Date().toISOString();
    const provider = await upsertFinanceProvider({
      id: parsed.id ?? randomUUID(),
      name: parsed.name,
      slug: parsed.slug || slugify(parsed.name),
      type: parsed.type ?? "bank",
      logoUrl: parsed.logoUrl || null,
      description: parsed.description ?? "",
      status: parsed.status ?? "active",
      minOrderValue: parsed.minOrderValue ?? 5000,
      maxOrderValue: parsed.maxOrderValue ?? 500000,
      processingFeePct: parsed.processingFeePct ?? 0,
      sortOrder: parsed.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    });
    await logAuditEvent({
      action: "finance.provider.upserted",
      actorId: admin.uid,
      actorEmail: admin.email,
      resourceType: "finance_provider",
      resourceId: provider.id,
      request,
    });
    return NextResponse.json({ provider }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
