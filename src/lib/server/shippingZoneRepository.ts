import "server-only";

import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import {
  isFirestoreFastFailError,
  isGlobalFirestoreCircuitOpen,
  logFirestoreWarning,
  markFirestoreUnavailable,
  withFirestoreDeadline,
} from "@/lib/server/firestoreErrors";
import type { ShippingZone } from "@/types/shippingZone";

export const SHIPPING_ZONES_COLLECTION = "shippingZones";

const DEFAULT_ZONES: Omit<ShippingZone, "createdAt" | "updatedAt">[] = [
  {
    id: "metro",
    name: "Metro cities",
    description: "Delhi NCR, Mumbai, Bengaluru, Chennai, Hyderabad, Kolkata, Pune",
    states: ["Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Telangana", "West Bengal"],
    pinCodePrefixes: ["11", "40", "56", "60", "50", "70", "41"],
    methodCharges: { standard: 99, express: 199, overnight: 399 },
    freeShippingThreshold: 9999,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "rest-of-india",
    name: "Rest of India",
    description: "All other serviceable pin codes",
    states: [],
    pinCodePrefixes: [],
    methodCharges: { standard: 149, express: 249, overnight: 499 },
    freeShippingThreshold: 9999,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "remote",
    name: "Remote & North-East",
    description: "J&K, Ladakh, Andaman, Lakshadweep, and select remote areas",
    states: ["Jammu and Kashmir", "Ladakh", "Andaman and Nicobar Islands", "Lakshadweep"],
    pinCodePrefixes: ["19", "74", "79", "68", "69"],
    methodCharges: { standard: 249, express: 399, overnight: 699 },
    isActive: true,
    sortOrder: 3,
  },
];

function normalizeZone(
  id: string,
  data: FirebaseFirestore.DocumentData
): ShippingZone {
  return {
    id,
    name: String(data.name ?? ""),
    description: data.description ? String(data.description) : undefined,
    states: Array.isArray(data.states) ? data.states.map(String) : [],
    pinCodePrefixes: Array.isArray(data.pinCodePrefixes)
      ? data.pinCodePrefixes.map(String)
      : [],
    methodCharges:
      data.methodCharges && typeof data.methodCharges === "object"
        ? {
            standard: data.methodCharges.standard,
            express: data.methodCharges.express,
            overnight: data.methodCharges.overnight,
          }
        : {},
    freeShippingThreshold:
      typeof data.freeShippingThreshold === "number"
        ? data.freeShippingThreshold
        : undefined,
    isActive: data.isActive !== false,
    sortOrder: Number(data.sortOrder ?? 0),
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
  };
}

function defaultZonesWithTimestamps(): ShippingZone[] {
  const now = new Date().toISOString();
  return DEFAULT_ZONES.map((zone) => ({ ...zone, createdAt: now, updatedAt: now }));
}

export async function listShippingZones(): Promise<ShippingZone[]> {
  if (!isFirebaseAdminConfigured() || isGlobalFirestoreCircuitOpen()) {
    return defaultZonesWithTimestamps();
  }

  try {
    const db = getAdminFirestore();
    const snap = await withFirestoreDeadline(() =>
      db.collection(SHIPPING_ZONES_COLLECTION).get()
    );
    if (snap.empty) {
      return defaultZonesWithTimestamps();
    }
    return snap.docs
      .map((doc) => normalizeZone(doc.id, doc.data()))
      .filter((zone) => zone.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  } catch (error) {
    if (markFirestoreUnavailable(error) || isFirestoreFastFailError(error)) {
      logFirestoreWarning(
        "shipping-zones",
        error,
        "Using default shipping zones — Firestore unavailable"
      );
      return defaultZonesWithTimestamps();
    }
    throw error;
  }
}

export async function listAllShippingZones(): Promise<ShippingZone[]> {
  const db = getAdminFirestore();
  const snap = await db.collection(SHIPPING_ZONES_COLLECTION).get();
  if (snap.empty) {
    const now = new Date().toISOString();
    return DEFAULT_ZONES.map((zone) => ({ ...zone, createdAt: now, updatedAt: now }));
  }
  return snap.docs
    .map((doc) => normalizeZone(doc.id, doc.data()))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getShippingZoneById(id: string): Promise<ShippingZone | null> {
  const db = getAdminFirestore();
  const doc = await db.collection(SHIPPING_ZONES_COLLECTION).doc(id).get();
  if (!doc.exists) {
    const fallback = DEFAULT_ZONES.find((zone) => zone.id === id);
    if (!fallback) return null;
    const now = new Date().toISOString();
    return { ...fallback, createdAt: now, updatedAt: now };
  }
  return normalizeZone(doc.id, doc.data()!);
}

export async function upsertShippingZone(
  zone: Omit<ShippingZone, "createdAt" | "updatedAt" | "id"> & { id?: string }
): Promise<ShippingZone> {
  const db = getAdminFirestore();
  const ref = zone.id
    ? db.collection(SHIPPING_ZONES_COLLECTION).doc(zone.id)
    : db.collection(SHIPPING_ZONES_COLLECTION).doc();
  const now = new Date().toISOString();
  const existing = zone.id ? await ref.get() : null;
  const record: ShippingZone = {
    id: ref.id,
    name: zone.name,
    description: zone.description,
    states: zone.states,
    pinCodePrefixes: zone.pinCodePrefixes,
    methodCharges: zone.methodCharges,
    freeShippingThreshold: zone.freeShippingThreshold,
    isActive: zone.isActive,
    sortOrder: zone.sortOrder,
    createdAt: existing?.exists
      ? String(existing.data()?.createdAt ?? now)
      : now,
    updatedAt: now,
  };
  await ref.set(record);
  return record;
}

export async function deleteShippingZone(id: string): Promise<void> {
  const db = getAdminFirestore();
  await db.collection(SHIPPING_ZONES_COLLECTION).doc(id).delete();
}
