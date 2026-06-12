import { getAdminFirestore } from "@/lib/firebase/admin";
import type { Coupon } from "@/types/admin";

const COLLECTION = "coupons";

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

export async function listCoupons(): Promise<Coupon[]> {
  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTION).orderBy("createdAt", "desc").get();
  if (snap.empty) {
    return seedDefaultCoupons();
  }
  return snap.docs.map((doc) => normalizeCoupon(doc.id, doc.data()));
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
  const db = getAdminFirestore();
  const snap = await db
    .collection(COLLECTION)
    .where("code", "==", code.toUpperCase())
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0]!;
  return normalizeCoupon(doc.id, doc.data());
}

export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<{ valid: boolean; discount: number; coupon?: Coupon; error?: string }> {
  const coupon = await getCouponByCode(code);
  if (!coupon) return { valid: false, discount: 0, error: "Invalid coupon code" };
  if (!coupon.isActive) return { valid: false, discount: 0, error: "Coupon is inactive" };

  const now = new Date();
  if (coupon.startsAt && new Date(coupon.startsAt) > now) {
    return { valid: false, discount: 0, error: "Coupon not yet active" };
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
    return { valid: false, discount: 0, error: "Coupon has expired" };
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, discount: 0, error: "Coupon usage limit reached" };
  }
  if (coupon.minOrderAmount != null && subtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      discount: 0,
      error: `Minimum order amount is ₹${coupon.minOrderAmount}`,
    };
  }

  const discount =
    coupon.type === "percentage"
      ? Math.round(subtotal * (coupon.value / 100) * 100) / 100
      : Math.min(coupon.value, subtotal);

  return { valid: true, discount, coupon };
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
