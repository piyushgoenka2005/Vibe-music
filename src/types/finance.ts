export type FinanceProviderType = "bank" | "nbfc" | "card_network";

export type FinanceEmiType = "card" | "bank" | "bnpl";

export type FinanceApplicationStatus =
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "cancelled"
  | "disbursed";

export interface FinanceProvider {
  id: string;
  name: string;
  slug: string;
  type: FinanceProviderType;
  logoUrl?: string | null;
  description: string;
  status: string;
  minOrderValue: number;
  maxOrderValue: number;
  processingFeePct: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  planCount?: number;
}

export interface FinancePlan {
  id: string;
  providerId: string;
  providerName?: string;
  providerSlug?: string;
  name: string;
  tenureMonths: number;
  interestRateAnnual: number;
  isNoCostEmi: boolean;
  emiType: FinanceEmiType;
  minOrderValue: number;
  maxOrderValue: number;
  downPaymentMinPct: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceDocument {
  id: string;
  type: "pan" | "aadhaar" | "salary_slip" | "bank_statement" | "other";
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface FinanceDocumentInput {
  id?: string;
  type: FinanceDocument["type"];
  fileName: string;
  fileUrl: string;
  uploadedAt?: string;
}

export interface FinanceApplication {
  id: string;
  applicationNumber: string;
  userId?: string | null;
  email: string;
  customerName: string;
  customerPhone: string;
  isGuest: boolean;
  productName: string;
  productSlug?: string | null;
  orderValue: number;
  downPayment: number;
  tenureMonths: number;
  providerId: string;
  planId: string;
  emiType: FinanceEmiType;
  monthlyInstallment: number;
  totalPayable: number;
  interestAmount: number;
  processingFee: number;
  status: FinanceApplicationStatus;
  rejectionReason?: string | null;
  panNumber?: string | null;
  employmentType?: string | null;
  monthlyIncome?: number | null;
  documents: FinanceDocument[];
  notes?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmiCalculationInput {
  orderValue: number;
  downPayment?: number;
  tenureMonths: number;
  interestRateAnnual: number;
  isNoCostEmi?: boolean;
  processingFeePct?: number;
}

export interface EmiCalculationResult {
  orderValue: number;
  downPayment: number;
  principal: number;
  tenureMonths: number;
  interestRateAnnual: number;
  isNoCostEmi: boolean;
  monthlyInstallment: number;
  totalInterest: number;
  processingFee: number;
  totalPayable: number;
}

export interface FinanceEligibilityInput {
  orderValue: number;
  downPayment?: number;
  planId: string;
  emiType?: FinanceEmiType;
  monthlyIncome?: number;
}

export interface FinanceEligibilityResult {
  eligible: boolean;
  reasons: string[];
  plan?: FinancePlan;
  provider?: FinanceProvider;
  calculation?: EmiCalculationResult;
}

export interface CreateFinanceApplicationPayload {
  productName: string;
  productSlug?: string;
  orderValue: number;
  downPayment?: number;
  planId: string;
  email: string;
  customerName: string;
  customerPhone: string;
  panNumber?: string;
  employmentType?: string;
  monthlyIncome?: number;
  notes?: string;
  documents?: FinanceDocumentInput[];
}

export interface FinanceAnalyticsSummary {
  totalApplications: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  totalOrderValue: number;
  applicationsByStatus: Record<string, number>;
  topProviders: Array<{ providerId: string; name: string; count: number }>;
}
