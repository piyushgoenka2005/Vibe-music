import { randomBytes, randomUUID } from "crypto";
import * as pg from "@/lib/server/prisma/contentRepository";
import { buildCouponShareUrl } from "@/lib/coupons/couponShareUrl";
import type { Coupon } from "@/types/admin";
import type {
  AppliedCouponSnapshot,
  CouponRedemptionContext,
  CouponValidateContext,
  CouponValidationResult,
  StorefrontCouponOffer,
} from "@/types/coupon";
import type { CouponCartLineItem as ScopeCartLine } from "@/lib/coupons/couponProductScope";
import {
  couponAppliesToAnyProduct,
  couponAppliesToProduct,
} from "@/lib/coupons/couponProductScope";
import { mapCouponPdpFields } from "@/lib/coupons/couponPdpDisplay";
import { validateCouponForSubtotal } from "@/lib/coupons/couponMath";
import type { CouponCartLineItem } from "@/types/coupon";

const STATIC_COUPONS: Record<string, Omit<Coupon, "id">> = {
  SAVE10: {
    code: "SAVE10",
    label: "10% off",
    type: "percentage",
    value: 10,
    usedCount: 0,
    isActive: true,
    kind: "standard",
    scope: "store",
    productIds: [],
    createdAt: "",
    updatedAt: "",
  },
  SWEET15: {
    code: "SWEET15",
    label: "15% off",
    type: "percentage",
    value: 15,
    usedCount: 0,
    isActive: true,
    kind: "standard",
    scope: "store",
    productIds: [],
    createdAt: "",
    updatedAt: "",
  },
  GEAR20: {
    code: "GEAR20",
    label: "20% off",
    type: "percentage",
    value: 20,
    usedCount: 0,
    isActive: true,
    kind: "standard",
    scope: "store",
    productIds: [],
    createdAt: "",
    updatedAt: "",
  },
};

function staticCoupon(code: string): Coupon | null {
  const normalized = code.toUpperCase();
  const template = STATIC_COUPONS[normalized];
  if (!template) return null;
  return {
    ...template,
    id: `static-${normalized}`,
    code: normalized,
  };
}

function isStaticCouponId(id: string): boolean {
  return id.startsWith("static-");
}

async function seedDefaultCoupons(): Promise<Coupon[]> {
  const now = new Date().toISOString();
  const defaults: Omit<Coupon, "id">[] = [
    {
      code: "SAVE10",
      label: "10% off",
      type: "percentage",
      value: 10,
      usedCount: 0,
      isActive: true,
      kind: "standard",
      scope: "store",
      productIds: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      code: "SWEET15",
      label: "15% off",
      type: "percentage",
      value: 15,
      usedCount: 0,
      isActive: true,
      kind: "standard",
      scope: "store",
      productIds: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      code: "GEAR20",
      label: "20% off",
      type: "percentage",
      value: 20,
      usedCount: 0,
      isActive: true,
      kind: "standard",
      scope: "store",
      productIds: [],
      createdAt: now,
      updatedAt: now,
    },
  ];

  const coupons: Coupon[] = [];
  for (const coupon of defaults) {
    const record = { ...coupon, id: randomUUID() };
    await pg.createCouponRecord(record);
    coupons.push(record);
  }
  return coupons;
}

export async function listCoupons(options: { limit?: number; cursor?: string } = {}): Promise<{
  coupons: Coupon[];
  hasMore: boolean;
  nextCursor?: string;
  total: number;
}> {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);

  if ((await pg.countCoupons()) === 0) {
    await seedDefaultCoupons();
  }

  const [page, total] = await Promise.all([
    pg.listCouponPage({ limit, afterCreatedAt: options.cursor }),
    pg.countCoupons(),
  ]);

  return { ...page, total };
}

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const normalized = code.toUpperCase();
  const coupon = await pg.getCouponByCode(normalized);
  return coupon ?? staticCoupon(normalized);
}

export async function getCouponById(id: string): Promise<Coupon | null> {
  if (isStaticCouponId(id)) return null;
  return pg.getCouponById(id);
}

export async function getReferralCouponForUser(userId: string): Promise<Coupon | null> {
  return pg.getReferralCouponForUser(userId);
}

function toScopeCartLines(items?: CouponCartLineItem[]): ScopeCartLine[] | undefined {
  if (!items?.length) return undefined;
  return items.map((item) => ({
    productId: item.productId,
    lineTotal: item.price * item.quantity,
  }));
}

async function resolveUserRedemptionCount(
  coupon: Coupon,
  context?: CouponValidateContext,
): Promise<number> {
  if (!coupon.maxUsesPerUser || isStaticCouponId(coupon.id)) return 0;
  if (!context?.userId && !context?.customerEmail) return 0;

  return pg.countCouponRedemptionsForUser(coupon.id, {
    userId: context.userId,
    customerEmail: context.customerEmail,
  });
}

export async function validateCoupon(
  code: string,
  subtotal: number,
  items?: CouponCartLineItem[],
  context?: CouponValidateContext,
): Promise<CouponValidationResult> {
  const coupon = await getCouponByCode(code);
  if (!coupon) {
    return { valid: false, discount: 0, error: "Invalid coupon code" };
  }

  const userRedemptionCount = await resolveUserRedemptionCount(coupon, context);

  const outcome = validateCouponForSubtotal({ ...coupon, userRedemptionCount }, subtotal, {
    items: toScopeCartLines(items),
  });
  if (!outcome.valid) {
    return { valid: false, discount: 0, error: outcome.error };
  }

  const snapshot: AppliedCouponSnapshot = {
    code: coupon.code,
    label: coupon.label,
    type: coupon.type,
    value: coupon.value,
    minOrderAmount: coupon.minOrderAmount,
    maxDiscountAmount: coupon.maxDiscountAmount,
    scope: coupon.scope,
    productIds: coupon.productIds,
  };

  return {
    valid: true,
    discount: outcome.discount,
    coupon: snapshot,
  };
}

function normalizeCouponInput(
  input: Omit<Coupon, "id" | "usedCount" | "createdAt" | "updatedAt">,
): Omit<Coupon, "id" | "usedCount" | "createdAt" | "updatedAt"> {
  const kind = input.kind === "referral" ? "referral" : "standard";
  const scope = input.scope === "products" && input.productIds.length > 0 ? "products" : "store";

  const type = input.type;
  const value = type === "free_shipping" ? 0 : input.value;

  return {
    ...input,
    code: input.code.toUpperCase(),
    type,
    value,
    kind,
    scope,
    productIds: scope === "products" ? input.productIds : [],
    referralOwnerUserId: kind === "referral" ? input.referralOwnerUserId : undefined,
    referralOwnerEmail:
      kind === "referral" ? input.referralOwnerEmail?.trim().toLowerCase() : undefined,
    utmSource: input.utmSource?.trim() || undefined,
    utmMedium: input.utmMedium?.trim() || undefined,
    utmCampaign: input.utmCampaign?.trim() || undefined,
    utmContent: input.utmContent?.trim() || undefined,
    pdpHeadline: input.pdpHeadline?.trim() || undefined,
    pdpOfferLine: input.pdpOfferLine?.trim() || undefined,
    pdpMaxDiscountLine: input.pdpMaxDiscountLine?.trim() || undefined,
    pdpTermsLine: input.pdpTermsLine?.trim() || undefined,
    pdpDisclaimer: input.pdpDisclaimer?.trim() || undefined,
    pdpFooter: input.pdpFooter?.trim() || undefined,
  };
}

export async function createCoupon(
  input: Omit<Coupon, "id" | "usedCount" | "createdAt" | "updatedAt">,
): Promise<Coupon> {
  const now = new Date().toISOString();
  const normalized = normalizeCouponInput(input);
  const record: Coupon = {
    ...normalized,
    id: randomUUID(),
    usedCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  return pg.createCouponRecord(record);
}

export async function updateCoupon(id: string, patch: Partial<Coupon>): Promise<Coupon> {
  if (isStaticCouponId(id)) {
    throw new Error("Static coupons cannot be edited");
  }

  const nextPatch = { ...patch };
  if (nextPatch.code) nextPatch.code = nextPatch.code.toUpperCase();
  if (nextPatch.kind && nextPatch.kind !== "referral") {
    nextPatch.referralOwnerUserId = undefined;
    nextPatch.referralOwnerEmail = undefined;
  }
  if (nextPatch.referralOwnerEmail) {
    nextPatch.referralOwnerEmail = nextPatch.referralOwnerEmail.trim().toLowerCase();
  }

  return pg.updateCouponRecord(id, nextPatch);
}

export async function deleteCoupon(id: string): Promise<void> {
  if (isStaticCouponId(id)) {
    throw new Error("Static coupons cannot be deleted");
  }
  await pg.deleteCouponRecord(id);
}

export async function duplicateCoupon(id: string): Promise<Coupon> {
  const source = await getCouponById(id);
  if (!source) throw new Error("Coupon not found");

  const suffix = randomBytes(2).toString("hex").toUpperCase();
  const baseCode = source.code.replace(/_COPY[A-Z0-9]*$/i, "").slice(0, 14);
  const code = `${baseCode}_${suffix}`;

  return createCoupon({
    code,
    label: `${source.label} (copy)`,
    type: source.type,
    value: source.value,
    minOrderAmount: source.minOrderAmount,
    maxDiscountAmount: source.maxDiscountAmount,
    maxUses: source.maxUses,
    maxUsesPerUser: source.maxUsesPerUser,
    isActive: false,
    kind: source.kind,
    scope: source.scope,
    productIds: source.productIds,
    pdpHeadline: source.pdpHeadline,
    pdpOfferLine: source.pdpOfferLine,
    pdpMaxDiscountLine: source.pdpMaxDiscountLine,
    pdpTermsLine: source.pdpTermsLine,
    pdpDisclaimer: source.pdpDisclaimer,
    pdpFooter: source.pdpFooter,
    startsAt: source.startsAt,
    expiresAt: source.expiresAt,
    utmSource: source.utmSource,
    utmMedium: source.utmMedium,
    utmCampaign: source.utmCampaign,
    utmContent: source.utmContent,
    parentCouponId: source.id,
  });
}

export interface GenerateReferralCouponInput {
  ownerUserId: string;
  ownerEmail: string;
  ownerName?: string;
  templateCouponId?: string;
  label?: string;
  type?: Coupon["type"];
  value?: number;
  maxUses?: number;
  maxUsesPerUser?: number;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export async function generateReferralCoupon(input: GenerateReferralCouponInput): Promise<Coupon> {
  const existing = await pg.getReferralCouponForUser(input.ownerUserId);
  if (existing) return existing;

  let template: Coupon | null = null;
  if (input.templateCouponId) {
    template = await getCouponById(input.templateCouponId);
  }

  const ownerSlug = input.ownerEmail
    .split("@")[0]
    ?.replace(/[^a-z0-9]/gi, "")
    .slice(0, 6)
    .toUpperCase();
  const randomPart = randomBytes(2).toString("hex").toUpperCase();
  const code = `REF${ownerSlug || "USER"}${randomPart}`;

  const ownerLabel = input.ownerName?.trim() || input.ownerEmail;

  return createCoupon({
    code,
    label: input.label ?? template?.label ?? `Referral — ${ownerLabel}`,
    type: input.type ?? template?.type ?? "percentage",
    value: input.value ?? template?.value ?? 10,
    minOrderAmount: template?.minOrderAmount,
    maxUses: input.maxUses ?? template?.maxUses,
    maxUsesPerUser: input.maxUsesPerUser ?? template?.maxUsesPerUser ?? 1,
    isActive: true,
    kind: "referral",
    referralOwnerUserId: input.ownerUserId,
    referralOwnerEmail: input.ownerEmail,
    parentCouponId: template?.id,
    scope: template?.scope ?? "store",
    productIds: template?.productIds ?? [],
    utmSource: input.utmSource ?? template?.utmSource ?? "referral",
    utmMedium: input.utmMedium ?? template?.utmMedium ?? "customer",
    utmCampaign: input.utmCampaign ?? template?.utmCampaign ?? code,
  });
}

export function getCouponShareUrl(coupon: Coupon): string {
  return buildCouponShareUrl({
    code: coupon.code,
    utmSource: coupon.utmSource,
    utmMedium: coupon.utmMedium,
    utmCampaign: coupon.utmCampaign,
    utmContent: coupon.utmContent,
  });
}

export async function incrementCouponUsage(
  code: string,
  context?: CouponRedemptionContext,
): Promise<boolean> {
  const coupon = await getCouponByCode(code);
  if (!coupon || isStaticCouponId(coupon.id)) {
    return pg.incrementCouponUsageRecord(code);
  }

  const applied = await pg.incrementCouponUsageRecord(code);
  if (!applied) return false;

  const now = new Date().toISOString();
  await pg.createCouponRedemptionRecord({
    id: randomUUID(),
    couponId: coupon.id,
    couponCode: coupon.code,
    userId: context?.userId ?? undefined,
    customerEmail: context?.customerEmail?.toLowerCase(),
    orderId: context?.orderId,
    utmSource: context?.utmSource ?? coupon.utmSource,
    utmMedium: context?.utmMedium ?? coupon.utmMedium,
    utmCampaign: context?.utmCampaign ?? coupon.utmCampaign,
    utmContent: context?.utmContent ?? coupon.utmContent,
    createdAt: now,
  });

  return true;
}

function isCouponScheduleActive(coupon: Coupon, at = new Date()): boolean {
  if (!coupon.isActive) return false;
  if (coupon.startsAt) {
    const start = new Date(coupon.startsAt);
    if (!Number.isNaN(start.getTime()) && at < start) return false;
  }
  if (coupon.expiresAt) {
    const end = new Date(coupon.expiresAt);
    if (!Number.isNaN(end.getTime()) && at > end) return false;
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) return false;
  return true;
}

export async function listActiveCouponsForStorefront(
  options: { at?: Date; productId?: string; productIds?: string[] } = {},
): Promise<StorefrontCouponOffer[]> {
  const at = options.at ?? new Date();
  const productId = options.productId?.trim();
  const cartProductIds = (options.productIds ?? []).map((id) => id.trim()).filter(Boolean);

  const { coupons } = await listCoupons({ limit: 100 });
  return coupons
    .filter((coupon) => coupon.kind !== "referral")
    .filter((coupon) => isCouponScheduleActive(coupon, at))
    .filter((coupon) => {
      if (cartProductIds.length > 0) {
        return couponAppliesToAnyProduct(coupon, cartProductIds);
      }
      if (productId) {
        return couponAppliesToProduct(coupon, productId);
      }
      return true;
    })
    .slice(0, 12)
    .map((coupon) => {
      const pdp = mapCouponPdpFields(coupon);
      return {
        code: coupon.code,
        label: coupon.label,
        type: coupon.type,
        value: coupon.value,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscountAmount: coupon.maxDiscountAmount,
        scope: coupon.scope,
        productIds: coupon.productIds,
        ...(Object.keys(pdp).length > 0 ? { pdp } : {}),
      };
    });
}
