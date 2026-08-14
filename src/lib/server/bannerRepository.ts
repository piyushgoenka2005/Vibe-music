import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import { unstable_cache } from "next/cache";
import * as pg from "@/lib/server/prisma/contentRepository";
import type {
  BannerStatus,
  CreateBannerInput,
  HomepageBanner,
  UpdateBannerInput,
} from "@/types/banner";

const ACTIVE_BANNERS_CACHE_KEY = "homepage-active-banners";
const ACTIVE_BANNERS_REVALIDATE_SECONDS = 30;

function invalidateBannerCache(): void {
  try {
    revalidateTag("banners", "max");
    revalidatePath("/");
  } catch {
    /* ignore outside request context */
  }
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
  return pg.listAllBanners() as Promise<HomepageBanner[]>;
}

async function fetchActiveBannersFromDb(): Promise<HomepageBanner[]> {
  const banners = await listAllBanners();
  return banners.filter((banner) => banner.status === "active");
}

const getCachedActiveBannerRows = unstable_cache(
  fetchActiveBannersFromDb,
  [ACTIVE_BANNERS_CACHE_KEY],
  { revalidate: ACTIVE_BANNERS_REVALIDATE_SECONDS, tags: ["banners"] }
);

export async function listActiveBanners(at = new Date()): Promise<HomepageBanner[]> {
  const rows = await getCachedActiveBannerRows();
  return rows
    .filter((banner) => isBannerScheduledActive(banner, at))
    .sort((a, b) => a.priority - b.priority || a.createdAt.localeCompare(b.createdAt));
}

export async function getBannerById(id: string): Promise<HomepageBanner | null> {
  return pg.getBannerById(id) as Promise<HomepageBanner | null>;
}

export async function createBanner(input: CreateBannerInput): Promise<HomepageBanner> {
  const banner = await pg.createBanner(input);
  invalidateBannerCache();
  return banner;
}

export async function updateBanner(
  id: string,
  input: UpdateBannerInput
): Promise<HomepageBanner> {
  const banner = await pg.updateBannerRecord(id, input);
  invalidateBannerCache();
  return banner;
}

export async function deleteBanner(id: string): Promise<void> {
  const existing = await getBannerById(id);
  if (!existing) throw new Error("Banner not found");
  await pg.deleteBannerRecord(id);
  invalidateBannerCache();
}

export async function reorderBanners(orderedIds: string[]): Promise<HomepageBanner[]> {
  const banners = await pg.reorderBannerRecords(orderedIds);
  invalidateBannerCache();
  return banners;
}

export type { BannerStatus };
