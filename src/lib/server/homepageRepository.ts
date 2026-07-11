import "server-only";

import { randomUUID } from "crypto";
import * as pg from "@/lib/server/prisma/contentRepository";
import {
  type CreateHomepageSectionInput,
  type CreateHomepageSectionItemInput,
  type HomepageSection,
  type HomepageSectionItem,
  type HomepageSectionKey,
  type UpdateHomepageSectionInput,
  type UpdateHomepageSectionItemInput,
} from "@/types/homepage";

const CACHE_TTL_MS = 45_000;

let sectionsCache: HomepageSection[] | null = null;
let sectionsCacheAt = 0;
let itemsCache: HomepageSectionItem[] | null = null;
let itemsCacheAt = 0;

function now(): string {
  return new Date().toISOString();
}

function isFresh(ts: number): boolean {
  return Date.now() - ts < CACHE_TTL_MS;
}

export function invalidateHomepageCache(): void {
  sectionsCache = null;
  sectionsCacheAt = 0;
  itemsCache = null;
  itemsCacheAt = 0;
}

export function isHomepageItemScheduledActive(
  item: Pick<HomepageSectionItem, "startDate" | "endDate">,
  at: Date
): boolean {
  if (item.startDate) {
    const start = new Date(item.startDate);
    if (!Number.isNaN(start.getTime()) && at < start) return false;
  }

  if (item.endDate) {
    const end = new Date(item.endDate);
    if (!Number.isNaN(end.getTime()) && at > end) return false;
  }

  return true;
}

export async function listAllSections(): Promise<HomepageSection[]> {
  if (sectionsCache && isFresh(sectionsCacheAt)) {
    return sectionsCache;
  }

  const sections = await pg.listHomepageSectionsMapped();
  sectionsCache = sections;
  sectionsCacheAt = Date.now();
  return sections;
}

export async function listActiveSections(): Promise<HomepageSection[]> {
  const sections = await listAllSections();
  return sections.filter((section) => section.isActive);
}

export async function getSectionByKey(
  sectionKey: HomepageSectionKey
): Promise<HomepageSection | null> {
  const sections = await listAllSections();
  return sections.find((section) => section.sectionKey === sectionKey) ?? null;
}

export async function listAllSectionItems(): Promise<HomepageSectionItem[]> {
  if (itemsCache && isFresh(itemsCacheAt)) {
    return itemsCache;
  }

  const items = await pg.listHomepageSectionItemsMapped();
  itemsCache = items;
  itemsCacheAt = Date.now();
  return items;
}

export async function listSectionItems(
  sectionKey: HomepageSectionKey
): Promise<HomepageSectionItem[]> {
  const items = await listAllSectionItems();
  return items.filter((item) => item.sectionKey === sectionKey);
}

export async function listActiveSectionItems(
  sectionKey: HomepageSectionKey,
  at = new Date()
): Promise<HomepageSectionItem[]> {
  const items = await listSectionItems(sectionKey);
  return items
    .filter((item) => item.isActive && isHomepageItemScheduledActive(item, at))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getSectionItemById(
  id: string
): Promise<HomepageSectionItem | null> {
  return pg.getHomepageSectionItemById(id);
}

export async function updateSection(
  sectionKey: HomepageSectionKey,
  input: UpdateHomepageSectionInput
): Promise<HomepageSection> {
  const updated = await pg.updateHomepageSectionRecord(sectionKey, input);
  invalidateHomepageCache();
  return updated;
}

async function getNextItemSortOrder(sectionKey: HomepageSectionKey): Promise<number> {
  const items = await listSectionItems(sectionKey);
  if (items.length === 0) return 0;
  return Math.max(...items.map((item) => item.sortOrder)) + 1;
}

export async function createSectionItem(
  input: CreateHomepageSectionItemInput
): Promise<HomepageSectionItem> {
  const section = await getSectionByKey(input.sectionKey);
  if (!section) throw new Error("Homepage section not found");

  const timestamp = now();
  const sortOrder =
    input.sortOrder !== undefined
      ? input.sortOrder
      : await getNextItemSortOrder(input.sectionKey);

  const item: HomepageSectionItem = {
    id: randomUUID(),
    sectionKey: input.sectionKey,
    sortOrder,
    isActive: input.isActive ?? true,
    productId: input.productId,
    categorySlug: input.categorySlug,
    brandId: input.brandId,
    customImage: input.customImage,
    customTitle: input.customTitle,
    customHref: input.customHref,
    badgeLabel: input.badgeLabel,
    offerText: input.offerText,
    startDate: input.startDate ?? null,
    endDate: input.endDate ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await pg.createHomepageSectionItemRecord(item);
  invalidateHomepageCache();
  return item;
}

export async function updateSectionItem(
  id: string,
  input: UpdateHomepageSectionItemInput
): Promise<HomepageSectionItem> {
  const existing = await getSectionItemById(id);
  if (!existing) throw new Error("Homepage section item not found");

  const updated = await pg.updateHomepageSectionItemRecord(id, input);
  invalidateHomepageCache();
  return updated;
}

export async function deleteSectionItem(id: string): Promise<void> {
  const existing = await getSectionItemById(id);
  if (!existing) throw new Error("Homepage section item not found");
  await pg.deleteHomepageSectionItemRecord(id);
  invalidateHomepageCache();
}

export async function reorderSectionItems(
  sectionKey: HomepageSectionKey,
  orderedIds: string[]
): Promise<HomepageSectionItem[]> {
  await pg.reorderHomepageSectionItems(orderedIds);
  invalidateHomepageCache();
  return listSectionItems(sectionKey);
}

export async function upsertSection(
  input: CreateHomepageSectionInput
): Promise<HomepageSection> {
  const section = await pg.upsertHomepageSectionRecord(input);
  invalidateHomepageCache();
  return section;
}
