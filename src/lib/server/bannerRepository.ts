import "server-only";

import { unstable_cache } from "next/cache";
import {
  getAdminFirestore,
  isFirebaseAdminConfigured,
} from "@/lib/firebase/admin";
import {
  isFirestoreUnavailableError,
  isGlobalFirestoreCircuitOpen,
  logFirestoreWarning,
  tryFirestoreFast,
} from "@/lib/server/firestoreErrors";
import type {
  BannerStatus,
  CreateBannerInput,
  HomepageBanner,
  UpdateBannerInput,
} from "@/types/banner";

const COLLECTION = "banners";
const ACTIVE_BANNERS_CACHE_KEY = "homepage-active-banners";
const ACTIVE_BANNERS_REVALIDATE_SECONDS = 300;

function logFirestoreBannerWarning(error: unknown, context: string): void {
  logFirestoreWarning("banners", error, context);
}

function now(): string {
  return new Date().toISOString();
}

function normalizeBanner(
  id: string,
  data: FirebaseFirestore.DocumentData
): HomepageBanner {
  return {
    id,
    title: String(data.title ?? ""),
    subtitle: data.subtitle ? String(data.subtitle) : undefined,
    image: String(data.image ?? ""),
    mobileImage: data.mobileImage ? String(data.mobileImage) : undefined,
    ctaText: String(data.ctaText ?? ""),
    ctaLink: String(data.ctaLink ?? ""),
    startDate: data.startDate ? String(data.startDate) : null,
    endDate: data.endDate ? String(data.endDate) : null,
    priority: Number(data.priority ?? 0),
    status: (data.status === "inactive" ? "inactive" : "active") as BannerStatus,
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
  };
}

function isBannerScheduledActive(
  banner: HomepageBanner,
  at: Date
): boolean {
  if (banner.status !== "active") return false;

  if (banner.startDate) {
    const start = new Date(banner.startDate);
    if (!Number.isNaN(start.getTime()) && at < start) return false;
  }

  if (banner.endDate) {
    const end = new Date(banner.endDate);
    if (!Number.isNaN(end.getTime()) && at > end) return false;
  }

  return true;
}

export async function listAllBanners(): Promise<HomepageBanner[]> {
  if (!isFirebaseAdminConfigured()) {
    return [];
  }

  try {
    const snap = await getAdminFirestore().collection(COLLECTION).get();
    return snap.docs
      .map((doc) => normalizeBanner(doc.id, doc.data()))
      .sort((a, b) => a.priority - b.priority || b.createdAt.localeCompare(a.createdAt));
  } catch (error) {
    if (isFirestoreUnavailableError(error)) {
      logFirestoreBannerWarning(error, "Unable to list banners for admin");
      return [];
    }

    throw error;
  }
}

async function fetchActiveBannersFromFirestore(): Promise<HomepageBanner[]> {
  return tryFirestoreFast(
    async () => {
      const snap = await getAdminFirestore()
        .collection(COLLECTION)
        .where("status", "==", "active")
        .get();

      return snap.docs.map((doc) => normalizeBanner(doc.id, doc.data()));
    },
    {
      domain: "banners",
      context: "Firestore unavailable — using static hero fallback",
      fallback: () => [],
    }
  );
}

const getCachedActiveBannerRows = unstable_cache(
  fetchActiveBannersFromFirestore,
  [ACTIVE_BANNERS_CACHE_KEY],
  { revalidate: ACTIVE_BANNERS_REVALIDATE_SECONDS, tags: ["banners"] }
);

export async function listActiveBanners(at = new Date()): Promise<HomepageBanner[]> {
  if (
    !isFirebaseAdminConfigured() ||
    process.env.DISABLE_FIRESTORE_BANNERS === "true" ||
    isGlobalFirestoreCircuitOpen()
  ) {
    return [];
  }

  try {
    const rows = await getCachedActiveBannerRows();
    return rows
      .filter((banner) => isBannerScheduledActive(banner, at))
      .sort((a, b) => a.priority - b.priority || a.createdAt.localeCompare(b.createdAt));
  } catch (error) {
    if (isFirestoreUnavailableError(error)) {
      logFirestoreBannerWarning(error, "Firestore unavailable — using static hero fallback");
      return [];
    }

    throw error;
  }
}

export async function getBannerById(id: string): Promise<HomepageBanner | null> {
  if (!isFirebaseAdminConfigured()) {
    return null;
  }

  try {
    const doc = await getAdminFirestore().collection(COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data();
    if (!data) return null;
    return normalizeBanner(doc.id, data);
  } catch (error) {
    if (isFirestoreUnavailableError(error)) {
      logFirestoreBannerWarning(error, `Unable to load banner ${id}`);
      return null;
    }

    throw error;
  }
}

async function getNextPriority(): Promise<number> {
  const banners = await listAllBanners();
  if (banners.length === 0) return 0;
  return Math.max(...banners.map((b) => b.priority)) + 1;
}

export async function createBanner(input: CreateBannerInput): Promise<HomepageBanner> {
  const db = getAdminFirestore();
  const ref = db.collection(COLLECTION).doc();
  const timestamp = now();
  const priority =
    input.priority !== undefined ? input.priority : await getNextPriority();

  const banner: HomepageBanner = {
    id: ref.id,
    title: input.title.trim(),
    subtitle: input.subtitle?.trim() || undefined,
    image: input.image.trim(),
    mobileImage: input.mobileImage?.trim() || undefined,
    ctaText: input.ctaText.trim(),
    ctaLink: input.ctaLink.trim(),
    startDate: input.startDate ?? null,
    endDate: input.endDate ?? null,
    priority,
    status: input.status,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await ref.set(banner);
  return banner;
}

export async function updateBanner(
  id: string,
  input: UpdateBannerInput
): Promise<HomepageBanner> {
  const existing = await getBannerById(id);
  if (!existing) throw new Error("Banner not found");

  const patch: Record<string, unknown> = { updatedAt: now() };

  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.subtitle !== undefined) {
    patch.subtitle = input.subtitle.trim() || null;
  }
  if (input.image !== undefined) patch.image = input.image.trim();
  if (input.mobileImage !== undefined) {
    patch.mobileImage = input.mobileImage.trim() || null;
  }
  if (input.ctaText !== undefined) patch.ctaText = input.ctaText.trim();
  if (input.ctaLink !== undefined) patch.ctaLink = input.ctaLink.trim();
  if (input.startDate !== undefined) patch.startDate = input.startDate;
  if (input.endDate !== undefined) patch.endDate = input.endDate;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.status !== undefined) patch.status = input.status;

  await getAdminFirestore().collection(COLLECTION).doc(id).update(patch);

  const updated = await getBannerById(id);
  if (!updated) throw new Error("Banner not found after update");
  return updated;
}

export async function deleteBanner(id: string): Promise<void> {
  const existing = await getBannerById(id);
  if (!existing) throw new Error("Banner not found");
  await getAdminFirestore().collection(COLLECTION).doc(id).delete();
}

export async function reorderBanners(orderedIds: string[]): Promise<HomepageBanner[]> {
  const db = getAdminFirestore();
  const batch = db.batch();
  const timestamp = now();

  orderedIds.forEach((id, index) => {
    batch.update(db.collection(COLLECTION).doc(id), {
      priority: index,
      updatedAt: timestamp,
    });
  });

  await batch.commit();
  return listAllBanners();
}
