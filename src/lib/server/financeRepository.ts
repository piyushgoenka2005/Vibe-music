import "server-only";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { asJsonValue } from "@/lib/server/prisma/mappers";
import type {
  FinanceApplication,
  FinanceDocument,
  FinancePlan,
  FinanceProvider,
} from "@/types/finance";

function mapProvider(row: {
  id: string;
  name: string;
  slug: string;
  type: string;
  logoUrl: string | null;
  description: string;
  status: string;
  minOrderValue: number;
  maxOrderValue: number;
  processingFeePct: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  _count?: { plans: number };
}): FinanceProvider {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    type: row.type as FinanceProvider["type"],
    logoUrl: row.logoUrl,
    description: row.description,
    status: row.status,
    minOrderValue: row.minOrderValue,
    maxOrderValue: row.maxOrderValue,
    processingFeePct: row.processingFeePct,
    sortOrder: row.sortOrder,
    planCount: row._count?.plans,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapPlan(row: {
  id: string;
  providerId: string;
  name: string;
  tenureMonths: number;
  interestRateAnnual: number;
  isNoCostEmi: boolean;
  emiType: string;
  minOrderValue: number;
  maxOrderValue: number;
  downPaymentMinPct: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  provider?: { name: string; slug: string; processingFeePct: number };
}): FinancePlan {
  return {
    id: row.id,
    providerId: row.providerId,
    providerName: row.provider?.name,
    providerSlug: row.provider?.slug,
    name: row.name,
    tenureMonths: row.tenureMonths,
    interestRateAnnual: row.interestRateAnnual,
    isNoCostEmi: row.isNoCostEmi,
    emiType: row.emiType as FinancePlan["emiType"],
    minOrderValue: row.minOrderValue,
    maxOrderValue: row.maxOrderValue,
    downPaymentMinPct: row.downPaymentMinPct,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapApplication(row: {
  id: string;
  applicationNumber: string;
  userId: string | null;
  email: string;
  customerName: string;
  customerPhone: string;
  isGuest: boolean;
  productName: string;
  productSlug: string | null;
  orderValue: number;
  downPayment: number;
  tenureMonths: number;
  providerId: string;
  planId: string;
  emiType: string;
  monthlyInstallment: number;
  totalPayable: number;
  interestAmount: number;
  processingFee: number;
  status: string;
  rejectionReason: string | null;
  panNumber: string | null;
  employmentType: string | null;
  monthlyIncome: number | null;
  documents: unknown;
  notes: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
}): FinanceApplication {
  const documents = Array.isArray(row.documents)
    ? (row.documents as FinanceDocument[])
    : [];
  return {
    id: row.id,
    applicationNumber: row.applicationNumber,
    userId: row.userId,
    email: row.email,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    isGuest: row.isGuest,
    productName: row.productName,
    productSlug: row.productSlug,
    orderValue: row.orderValue,
    downPayment: row.downPayment,
    tenureMonths: row.tenureMonths,
    providerId: row.providerId,
    planId: row.planId,
    emiType: row.emiType as FinanceApplication["emiType"],
    monthlyInstallment: row.monthlyInstallment,
    totalPayable: row.totalPayable,
    interestAmount: row.interestAmount,
    processingFee: row.processingFee,
    status: row.status as FinanceApplication["status"],
    rejectionReason: row.rejectionReason,
    panNumber: row.panNumber,
    employmentType: row.employmentType,
    monthlyIncome: row.monthlyIncome,
    documents,
    notes: row.notes,
    approvedAt: row.approvedAt,
    rejectedAt: row.rejectedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listFinanceProviders(options?: {
  includeInactive?: boolean;
}): Promise<FinanceProvider[]> {
  const rows = await prisma.financeProvider.findMany({
    where: options?.includeInactive ? undefined : { status: "active" },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { plans: true } } },
  });
  return rows.map(mapProvider);
}

export async function listFinancePlans(filters?: {
  providerId?: string;
  providerSlug?: string;
  emiType?: string;
  includeInactive?: boolean;
}): Promise<FinancePlan[]> {
  const where: Record<string, unknown> = {};
  if (!filters?.includeInactive) where.status = "active";
  if (filters?.providerId) where.providerId = filters.providerId;
  if (filters?.providerSlug) where.provider = { slug: filters.providerSlug };
  if (filters?.emiType) where.emiType = filters.emiType;

  const rows = await prisma.financePlan.findMany({
    where,
    include: { provider: { select: { name: true, slug: true, processingFeePct: true } } },
    orderBy: [{ tenureMonths: "asc" }],
  });
  return rows.map(mapPlan);
}

export async function getFinancePlanById(id: string): Promise<FinancePlan | null> {
  const row = await prisma.financePlan.findUnique({
    where: { id },
    include: { provider: { select: { name: true, slug: true, processingFeePct: true } } },
  });
  return row ? mapPlan(row) : null;
}

export async function getFinanceProviderById(id: string): Promise<FinanceProvider | null> {
  const row = await prisma.financeProvider.findUnique({
    where: { id },
    include: { _count: { select: { plans: true } } },
  });
  return row ? mapProvider(row) : null;
}

export async function getFinanceApplicationById(id: string): Promise<FinanceApplication | null> {
  const row = await prisma.financeApplication.findUnique({ where: { id } });
  return row ? mapApplication(row) : null;
}

export async function listFinanceApplicationsForUser(userId: string): Promise<FinanceApplication[]> {
  const rows = await prisma.financeApplication.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapApplication);
}

export async function listAllFinanceApplications(options?: {
  status?: string;
  limit?: number;
}): Promise<FinanceApplication[]> {
  const rows = await prisma.financeApplication.findMany({
    where: options?.status ? { status: options.status } : undefined,
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 100,
  });
  return rows.map(mapApplication);
}

export async function allocateNextFinanceApplicationNumber(): Promise<string> {
  const year = Number(
    new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", year: "numeric" }).format(
      new Date()
    )
  );
  const key = `finance_app_${year}`;
  const counter = await prisma.counter.upsert({
    where: { id: key },
    create: { id: key, value: 1000 },
    update: { value: { increment: 1 } },
  });
  return `FIN-${String(counter.value).padStart(6, "0")}-${year}`;
}

export async function createFinanceApplicationRecord(
  application: Omit<FinanceApplication, "id" | "applicationNumber"> & {
    id?: string;
    applicationNumber?: string;
  }
): Promise<FinanceApplication> {
  const id = application.id ?? randomUUID();
  const applicationNumber =
    application.applicationNumber ?? (await allocateNextFinanceApplicationNumber());
  const now = new Date().toISOString();

  await prisma.financeApplication.create({
    data: {
      id,
      applicationNumber,
      userId: application.userId ?? null,
      email: application.email.trim().toLowerCase(),
      customerName: application.customerName,
      customerPhone: application.customerPhone,
      isGuest: application.isGuest,
      productName: application.productName,
      productSlug: application.productSlug ?? null,
      orderValue: application.orderValue,
      downPayment: application.downPayment,
      tenureMonths: application.tenureMonths,
      providerId: application.providerId,
      planId: application.planId,
      emiType: application.emiType,
      monthlyInstallment: application.monthlyInstallment,
      totalPayable: application.totalPayable,
      interestAmount: application.interestAmount,
      processingFee: application.processingFee,
      status: application.status,
      rejectionReason: application.rejectionReason ?? null,
      panNumber: application.panNumber ?? null,
      employmentType: application.employmentType ?? null,
      monthlyIncome: application.monthlyIncome ?? null,
      documents: asJsonValue(application.documents ?? []),
      notes: application.notes ?? null,
      approvedAt: application.approvedAt ?? null,
      rejectedAt: application.rejectedAt ?? null,
      createdAt: application.createdAt || now,
      updatedAt: application.updatedAt || now,
      events: {
        create: {
          id: randomUUID(),
          status: application.status,
          note: "Application submitted",
          createdAt: now,
        },
      },
    },
  });

  const saved = await getFinanceApplicationById(id);
  if (!saved) throw new Error("Failed to create finance application");
  return saved;
}

export async function updateFinanceApplicationFields(
  id: string,
  patch: Partial<FinanceApplication>
): Promise<FinanceApplication> {
  const now = new Date().toISOString();
  await prisma.financeApplication.update({
    where: { id },
    data: {
      status: patch.status,
      rejectionReason: patch.rejectionReason,
      documents: patch.documents ? asJsonValue(patch.documents) : undefined,
      notes: patch.notes,
      approvedAt: patch.approvedAt,
      rejectedAt: patch.rejectedAt,
      updatedAt: now,
    },
  });
  const saved = await getFinanceApplicationById(id);
  if (!saved) throw new Error("Application not found");
  return saved;
}

export async function appendFinanceApplicationEvent(input: {
  applicationId: string;
  status: string;
  note?: string;
  createdBy?: string;
}): Promise<void> {
  await prisma.financeApplicationEvent.create({
    data: {
      id: randomUUID(),
      applicationId: input.applicationId,
      status: input.status,
      note: input.note ?? null,
      createdBy: input.createdBy ?? null,
      createdAt: new Date().toISOString(),
    },
  });
}

export async function upsertFinanceProvider(input: FinanceProvider): Promise<FinanceProvider> {
  const now = new Date().toISOString();
  const row = await prisma.financeProvider.upsert({
    where: { id: input.id },
    create: { ...input, logoUrl: input.logoUrl ?? null, createdAt: input.createdAt || now, updatedAt: now },
    update: {
      name: input.name,
      slug: input.slug,
      type: input.type,
      logoUrl: input.logoUrl ?? null,
      description: input.description,
      status: input.status,
      minOrderValue: input.minOrderValue,
      maxOrderValue: input.maxOrderValue,
      processingFeePct: input.processingFeePct,
      sortOrder: input.sortOrder,
      updatedAt: now,
    },
    include: { _count: { select: { plans: true } } },
  });
  return mapProvider(row);
}

export async function upsertFinancePlan(input: FinancePlan): Promise<FinancePlan> {
  const now = new Date().toISOString();
  const row = await prisma.financePlan.upsert({
    where: { id: input.id },
    create: {
      id: input.id,
      providerId: input.providerId,
      name: input.name,
      tenureMonths: input.tenureMonths,
      interestRateAnnual: input.interestRateAnnual,
      isNoCostEmi: input.isNoCostEmi,
      emiType: input.emiType,
      minOrderValue: input.minOrderValue,
      maxOrderValue: input.maxOrderValue,
      downPaymentMinPct: input.downPaymentMinPct,
      status: input.status,
      createdAt: input.createdAt || now,
      updatedAt: now,
    },
    update: {
      name: input.name,
      tenureMonths: input.tenureMonths,
      interestRateAnnual: input.interestRateAnnual,
      isNoCostEmi: input.isNoCostEmi,
      emiType: input.emiType,
      minOrderValue: input.minOrderValue,
      maxOrderValue: input.maxOrderValue,
      downPaymentMinPct: input.downPaymentMinPct,
      status: input.status,
      updatedAt: now,
    },
    include: { provider: { select: { name: true, slug: true, processingFeePct: true } } },
  });
  return mapPlan(row);
}

export async function getFinanceAnalyticsSummary() {
  const apps = await prisma.financeApplication.findMany({
    select: { status: true, orderValue: true, providerId: true },
  });
  const providers = await prisma.financeProvider.findMany({ select: { id: true, name: true } });
  const providerName = new Map(providers.map((p) => [p.id, p.name]));

  const applicationsByStatus: Record<string, number> = {};
  const providerCounts = new Map<string, number>();
  let totalOrderValue = 0;
  let pendingReview = 0;
  let approved = 0;
  let rejected = 0;

  for (const app of apps) {
    applicationsByStatus[app.status] = (applicationsByStatus[app.status] ?? 0) + 1;
    totalOrderValue += app.orderValue;
    providerCounts.set(app.providerId, (providerCounts.get(app.providerId) ?? 0) + 1);
    if (["submitted", "under_review"].includes(app.status)) pendingReview += 1;
    if (app.status === "approved" || app.status === "disbursed") approved += 1;
    if (app.status === "rejected") rejected += 1;
  }

  const topProviders = [...providerCounts.entries()]
    .map(([providerId, count]) => ({
      providerId,
      name: providerName.get(providerId) ?? providerId,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalApplications: apps.length,
    pendingReview,
    approved,
    rejected,
    totalOrderValue: Math.round(totalOrderValue * 100) / 100,
    applicationsByStatus,
    topProviders,
  };
}
