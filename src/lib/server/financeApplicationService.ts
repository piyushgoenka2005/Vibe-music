import "server-only";

import { randomUUID } from "node:crypto";
import { evaluateFinanceEligibility } from "@/lib/finance/eligibilityEngine";
import { calculateEmi } from "@/lib/finance/emiEngine";
import { logAuditEvent } from "@/lib/server/auditLog";
import {
  appendFinanceApplicationEvent,
  createFinanceApplicationRecord,
  getFinanceApplicationById,
  getFinancePlanById,
  getFinanceProviderById,
  listFinancePlans,
  updateFinanceApplicationFields,
} from "@/lib/server/financeRepository";
import { sendFinanceApplicationEmail } from "@/lib/server/financeEmailService";
import { notifyFinanceApplicationUpdate } from "@/lib/server/financeNotificationService";
import type {
  CreateFinanceApplicationPayload,
  EmiCalculationInput,
  FinanceDocument,
  FinanceEligibilityInput,
} from "@/types/finance";

function normalizeFinanceDocuments(
  documents: CreateFinanceApplicationPayload["documents"],
  uploadedAt: string
): FinanceDocument[] {
  return (documents ?? []).map((doc) => ({
    id: doc.id ?? randomUUID(),
    type: doc.type,
    fileName: doc.fileName,
    fileUrl: doc.fileUrl,
    uploadedAt: doc.uploadedAt ?? uploadedAt,
  }));
}

export async function calculateFinanceEmi(input: EmiCalculationInput) {
  return calculateEmi(input);
}

export async function checkFinanceEligibility(input: FinanceEligibilityInput) {
  const plan = await getFinancePlanById(input.planId);
  if (!plan) throw new Error("Finance plan not found");
  const provider = await getFinanceProviderById(plan.providerId);
  if (!provider) throw new Error("Finance provider not found");
  return evaluateFinanceEligibility({ plan, provider, eligibility: input });
}

export async function listComparisonsForOrder(input: {
  orderValue: number;
  downPayment?: number;
  emiType?: string;
}) {
  const plans = await listFinancePlans({
    emiType: input.emiType,
  });
  const results = [];
  for (const plan of plans) {
    const provider = await getFinanceProviderById(plan.providerId);
    if (!provider) continue;
    const eligibility = evaluateFinanceEligibility({
      plan,
      provider,
      eligibility: {
        orderValue: input.orderValue,
        downPayment: input.downPayment,
        planId: plan.id,
      },
    });
    if (eligibility.calculation) {
      results.push({
        plan,
        provider,
        eligible: eligibility.eligible,
        reasons: eligibility.reasons,
        calculation: eligibility.calculation,
      });
    }
  }
  return results;
}

export async function submitFinanceApplication(
  payload: CreateFinanceApplicationPayload,
  userId?: string
) {
  const eligibility = await checkFinanceEligibility({
    orderValue: payload.orderValue,
    downPayment: payload.downPayment,
    planId: payload.planId,
    monthlyIncome: payload.monthlyIncome,
  });

  if (!eligibility.eligible || !eligibility.calculation || !eligibility.plan || !eligibility.provider) {
    throw new Error(eligibility.reasons[0] ?? "Not eligible for selected finance plan");
  }

  const calc = eligibility.calculation;
  const now = new Date().toISOString();

  const application = await createFinanceApplicationRecord({
    id: randomUUID(),
    userId: userId ?? null,
    email: payload.email,
    customerName: payload.customerName,
    customerPhone: payload.customerPhone,
    isGuest: !userId,
    productName: payload.productName,
    productSlug: payload.productSlug ?? null,
    orderValue: payload.orderValue,
    downPayment: calc.downPayment,
    tenureMonths: calc.tenureMonths,
    providerId: eligibility.provider.id,
    planId: eligibility.plan.id,
    emiType: eligibility.plan.emiType,
    monthlyInstallment: calc.monthlyInstallment,
    totalPayable: calc.totalPayable,
    interestAmount: calc.totalInterest,
    processingFee: calc.processingFee,
    status: "submitted",
    panNumber: payload.panNumber ?? null,
    employmentType: payload.employmentType ?? null,
    monthlyIncome: payload.monthlyIncome ?? null,
    documents: normalizeFinanceDocuments(payload.documents, now),
    notes: payload.notes ?? null,
    createdAt: now,
    updatedAt: now,
  });

  await sendFinanceApplicationEmail(application, "submitted");
  await notifyFinanceApplicationUpdate(application, "submitted");
  return application;
}

export async function approveFinanceApplication(input: {
  applicationId: string;
  actorId?: string;
  actorEmail?: string;
  note?: string;
  request?: Request;
}) {
  const application = await getFinanceApplicationById(input.applicationId);
  if (!application) throw new Error("Application not found");
  if (["approved", "rejected", "disbursed"].includes(application.status)) {
    throw new Error("Application cannot be approved");
  }

  const now = new Date().toISOString();
  await updateFinanceApplicationFields(application.id, {
    status: "approved",
    approvedAt: now,
  });
  await appendFinanceApplicationEvent({
    applicationId: application.id,
    status: "approved",
    note: input.note,
    createdBy: input.actorId,
  });
  await logAuditEvent({
    action: "finance.application.approved",
    actorId: input.actorId,
    actorEmail: input.actorEmail,
    resourceType: "finance_application",
    resourceId: application.id,
    request: input.request,
  });

  const updated = await getFinanceApplicationById(application.id);
  if (updated) {
    await sendFinanceApplicationEmail(updated, "approved");
    await notifyFinanceApplicationUpdate(updated, "approved");
  }
  return updated;
}

export async function rejectFinanceApplication(input: {
  applicationId: string;
  reason: string;
  actorId?: string;
  actorEmail?: string;
  request?: Request;
}) {
  const application = await getFinanceApplicationById(input.applicationId);
  if (!application) throw new Error("Application not found");

  const now = new Date().toISOString();
  await updateFinanceApplicationFields(application.id, {
    status: "rejected",
    rejectionReason: input.reason,
    rejectedAt: now,
  });
  await appendFinanceApplicationEvent({
    applicationId: application.id,
    status: "rejected",
    note: input.reason,
    createdBy: input.actorId,
  });
  await logAuditEvent({
    action: "finance.application.rejected",
    actorId: input.actorId,
    actorEmail: input.actorEmail,
    resourceType: "finance_application",
    resourceId: application.id,
    request: input.request,
    metadata: { reason: input.reason },
  });

  const updated = await getFinanceApplicationById(application.id);
  if (updated) {
    await sendFinanceApplicationEmail(updated, "rejected");
    await notifyFinanceApplicationUpdate(updated, "rejected");
  }
  return updated;
}

export async function markFinanceUnderReview(applicationId: string, actorId?: string) {
  await updateFinanceApplicationFields(applicationId, { status: "under_review" });
  await appendFinanceApplicationEvent({
    applicationId,
    status: "under_review",
    note: "Moved to review",
    createdBy: actorId,
  });
  return getFinanceApplicationById(applicationId);
}
