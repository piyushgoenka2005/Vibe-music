import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  isGlobalFirestoreCircuitOpen,
  logFirestoreWarning,
  markFirestoreUnavailable,
  tryFirestoreFast,
} from "@/lib/server/firestoreErrors";
import type { Coupon } from "@/types/admin";
import type { AppliedCouponSnapshot, CouponValidationResult } from "@/types/coupon";
import { validateCouponForSubtotal } from "@/lib/coupons/couponMath";

const COLLECTION = "coupons";

const STATIC_COUPONS: Record<string, Omit<Coupon, "id">> = {
  SAVE10: {
    code: "SAVE10",
    label: "10% off",
    type: "percentage",
    value: 10,
    usedCount: 0,
    isActive: true,
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

function normalizeCoupon(id: string, data: FirebaseFirestore.DocumentData): Coupon {
  return {
    id,
    code: String(data.code ?? "").toUpperCase(),
    label: String(data.label ?? ""),
    type: data.type === "flat" ? "flat" : "percentage",
    value: Number(data.value ?? 0),
    minOrderAmount: data.minOrderAmount != null ? Number(data.minOrderAmount) : undefined,
    maxUses: data.maxUses != null ? Number(data.maxUses) : undefined,
    usedCount: Number(data.usedCount ?? 0),
    isActive: Boolean(data.isActive ?? true),
    startsAt: data.startsAt ? String(data.startsAt) : undefined,
    expiresAt: data.expiresAt ? String(data.expiresAt) : undefined,
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
  };
}

export async function listCoupons(
  options: { limit?: number; cursor?: string } = {}
): Promise<{
  coupons: Coupon[];
  hasMore: boolean;
  nextCursor?: string;
}> {
  const db = getAdminFirestore();
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  let query: FirebaseFirestore.Query = db
    .collection(COLLECTION)
    .orderBy("createdAt", "desc");

  if (options.cursor) {
    const cursorDoc = await db.collection(COLLECTION).doc(options.cursor).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  const snap = await query.limit(limit + 1).get();
  if (snap.empty) {
    const seeded = await seedDefaultCoupons();
    return { coupons: seeded.slice(0, limit), hasMore: false };
  }

  const docs = snap.docs;
  const hasMore = docs.length > limit;
  const pageDocs = docs.slice(0, limit);
  const coupons = pageDocs.map((doc) => normalizeCoupon(doc.id, doc.data()));

  return {
    coupons,
    hasMore,
    nextCursor:
      hasMore && pageDocs.length > 0
        ? pageDocs[pageDocs.length - 1]!.id
        : undefined,
  };
}

async function seedDefaultCoupons(): Promise<Coupon[]> {
  const defaults: Omit<Coupon, "id">[] = [
    {
      code: "SAVE10",
      label: "10% off",
      type: "percentage",
      value: 10,
      usedCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      code: "SWEET15",
      label: "15% off",
      type: "percentage",
      value: 15,
      usedCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      code: "GEAR20",
      label: "20% off",
      type: "percentage",
      value: 20,
      usedCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const db = getAdminFirestore();
  const batch = db.batch();
  const coupons: Coupon[] = [];

  defaults.forEach((coupon) => {
    const ref = db.collection(COLLECTION).doc();
    const record = { ...coupon, id: ref.id };
    batch.set(ref, record);
    coupons.push(record);
  });

  await batch.commit();
  return coupons;
}

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const normalized = code.toUpperCase();

  if (isGlobalFirestoreCircuitOpen()) {
    return staticCoupon(normalized);
  }

  try {
    const coupon = await tryFirestoreFast(
      async () => {
        const db = getAdminFirestore();
        const snap = await db
          .collection(COLLECTION)
          .where("code", "==", normalized)
          .limit(1)
          .get();
        if (snap.empty) return null;
        const doc = snap.docs[0]!;
        return normalizeCoupon(doc.id, doc.data());
      },
      {
        domain: "coupons",
        context: "Using static coupon fallback — Firestore unavailable",
        fallback: () => staticCoupon(normalized),
      }
    );
    return coupon ?? staticCoupon(normalized);
  } catch (error) {
    if (markFirestoreUnavailable(error)) {
      logFirestoreWarning(
        "coupons",
        error,
        "Using static coupon fallback — Firestore unavailable"
      );
      return staticCoupon(normalized);
    }
    throw error;
  }
}

export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<CouponValidationResult> {
  const coupon = await getCouponByCode(code);
  if (!coupon) {
    return { valid: false, discount: 0, error: "Invalid coupon code" };
  }

  const outcome = validateCouponForSubtotal(coupon, subtotal);
  if (!outcome.valid) {
    return { valid: false, discount: 0, error: outcome.error };
  }

  const snapshot: AppliedCouponSnapshot = {
    code: coupon.code,
    label: coupon.label,
    type: coupon.type,
    value: coupon.value,
    minOrderAmount: coupon.minOrderAmount,
  };

  return {
    valid: true,
    discount: outcome.discount,
    coupon: snapshot,
  };
}

export async function createCoupon(
  input: Omit<Coupon, "id" | "usedCount" | "createdAt" | "updatedAt">
): Promise<Coupon> {
  const db = getAdminFirestore();
  const ref = db.collection(COLLECTION).doc();
  const now = new Date().toISOString();
  const record: Coupon = {
    ...input,
    id: ref.id,
    code: input.code.toUpperCase(),
    usedCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  await ref.set(record);
  return record;
}

export async function updateCoupon(
  id: string,
  patch: Partial<Coupon>
): Promise<Coupon> {
  const db = getAdminFirestore();
  const now = new Date().toISOString();
  const { id: _id, usedCount: _u, createdAt: _c, ...rest } = patch;
  if (rest.code) rest.code = rest.code.toUpperCase();
  await db.collection(COLLECTION).doc(id).update({ ...rest, updatedAt: now });
  const doc = await db.collection(COLLECTION).doc(id).get();
  return normalizeCoupon(doc.id, doc.data()!);
}

export async function deleteCoupon(id: string): Promise<void> {
  const db = getAdminFirestore();
  await db.collection(COLLECTION).doc(id).delete();
}

export async function incrementCouponUsage(code: string): Promise<void> {
  const coupon = await getCouponByCode(code);
  if (!coupon) return;
  const db = getAdminFirestore();
  await db
    .collection(COLLECTION)
    .doc(coupon.id)
    .update({
      usedCount: coupon.usedCount + 1,
      updatedAt: new Date().toISOString(),
    });
}
