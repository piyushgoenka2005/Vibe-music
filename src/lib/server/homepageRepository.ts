import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  DEFAULT_HOMEPAGE_SECTIONS,
  HOMEPAGE_SECTION_KEYS,
  type CreateHomepageSectionInput,
  type CreateHomepageSectionItemInput,
  type HomepageSection,
  type HomepageSectionItem,
  type HomepageSectionKey,
  type HomepageSectionLayout,
  type HomepageSourceMode,
  type UpdateHomepageSectionInput,
  type UpdateHomepageSectionItemInput,
} from "@/types/homepage";

const SECTIONS = "homepage_sections";
const ITEMS = "homepage_section_items";

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

function isSectionKey(value: string): value is HomepageSectionKey {
  return (HOMEPAGE_SECTION_KEYS as readonly string[]).includes(value);
}

function normalizeSection(
  id: string,
  data: FirebaseFirestore.DocumentData
): HomepageSection | null {
  const sectionKey = String(data.sectionKey ?? id);
  if (!isSectionKey(sectionKey)) return null;

  const layout = String(data.layout ?? "product_carousel") as HomepageSectionLayout;
  const sourceMode = (data.sourceMode === "manual" ? "manual" : "auto") as HomepageSourceMode;

  return {
    id,
    sectionKey,
    title: String(data.title ?? ""),
    subtitle: data.subtitle ? String(data.subtitle) : undefined,
    accentLabel: data.accentLabel ? String(data.accentLabel) : undefined,
    ctaText: data.ctaText ? String(data.ctaText) : undefined,
    ctaLink: data.ctaLink ? String(data.ctaLink) : undefined,
    isActive: data.isActive !== false,
    sortOrder: Number(data.sortOrder ?? 0),
    sourceMode,
    maxItems: Math.max(1, Number(data.maxItems ?? 8)),
    layout,
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
  };
}

function normalizeItem(
  id: string,
  data: FirebaseFirestore.DocumentData
): HomepageSectionItem | null {
  const sectionKey = String(data.sectionKey ?? "");
  if (!isSectionKey(sectionKey)) return null;

  return {
    id,
    sectionKey,
    sortOrder: Number(data.sortOrder ?? 0),
    isActive: data.isActive !== false,
    productId: data.productId ? String(data.productId) : undefined,
    categorySlug: data.categorySlug ? String(data.categorySlug) : undefined,
    brandId: data.brandId ? String(data.brandId) : undefined,
    customImage: data.customImage ? String(data.customImage) : undefined,
    customTitle: data.customTitle ? String(data.customTitle) : undefined,
    customHref: data.customHref ? String(data.customHref) : undefined,
    badgeLabel: data.badgeLabel ? String(data.badgeLabel) : undefined,
    offerText: data.offerText ? String(data.offerText) : undefined,
    startDate: data.startDate ? String(data.startDate) : null,
    endDate: data.endDate ? String(data.endDate) : null,
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
  };
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

async function ensureDefaultSections(): Promise<void> {
  const db = getAdminFirestore();
  const snap = await db.collection(SECTIONS).limit(1).get();
  if (!snap.empty) return;

  const timestamp = now();
  const batch = db.batch();

  for (const section of DEFAULT_HOMEPAGE_SECTIONS) {
    const ref = db.collection(SECTIONS).doc(section.sectionKey);
    batch.set(ref, {
      ...section,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  await batch.commit();
  invalidateHomepageCache();
}

export async function listAllSections(): Promise<HomepageSection[]> {
  if (sectionsCache && isFresh(sectionsCacheAt)) {
    return sectionsCache;
  }

  await ensureDefaultSections();

  const snap = await getAdminFirestore().collection(SECTIONS).get();
  const sections = snap.docs
    .map((doc) => normalizeSection(doc.id, doc.data()))
    .filter((section): section is HomepageSection => section !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));

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

  const snap = await getAdminFirestore().collection(ITEMS).get();
  const items = snap.docs
    .map((doc) => normalizeItem(doc.id, doc.data()))
    .filter((item): item is HomepageSectionItem => item !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));

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
  const doc = await getAdminFirestore().collection(ITEMS).doc(id).get();
  if (!doc.exists) return null;
  return normalizeItem(doc.id, doc.data()!);
}

export async function updateSection(
  sectionKey: HomepageSectionKey,
  input: UpdateHomepageSectionInput
): Promise<HomepageSection> {
  const existing = await getSectionByKey(sectionKey);
  if (!existing) throw new Error("Homepage section not found");

  const patch: Record<string, unknown> = { updatedAt: now() };

  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.subtitle !== undefined) patch.subtitle = input.subtitle.trim() || null;
  if (input.accentLabel !== undefined) {
    patch.accentLabel = input.accentLabel.trim() || null;
  }
  if (input.ctaText !== undefined) patch.ctaText = input.ctaText.trim() || null;
  if (input.ctaLink !== undefined) patch.ctaLink = input.ctaLink.trim() || null;
  if (input.isActive !== undefined) patch.isActive = input.isActive;
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
  if (input.sourceMode !== undefined) patch.sourceMode = input.sourceMode;
  if (input.maxItems !== undefined) patch.maxItems = input.maxItems;
  if (input.layout !== undefined) patch.layout = input.layout;

  await getAdminFirestore()
    .collection(SECTIONS)
    .doc(existing.id)
    .update(patch);

  invalidateHomepageCache();

  const updated = await getSectionByKey(sectionKey);
  if (!updated) throw new Error("Homepage section not found after update");
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

  const db = getAdminFirestore();
  const ref = db.collection(ITEMS).doc();
  const timestamp = now();
  const sortOrder =
    input.sortOrder !== undefined
      ? input.sortOrder
      : await getNextItemSortOrder(input.sectionKey);

  const item: HomepageSectionItem = {
    id: ref.id,
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

  await ref.set(item);
  invalidateHomepageCache();
  return item;
}

export async function updateSectionItem(
  id: string,
  input: UpdateHomepageSectionItemInput
): Promise<HomepageSectionItem> {
  const existing = await getSectionItemById(id);
  if (!existing) throw new Error("Homepage section item not found");

  const patch: Record<string, unknown> = { updatedAt: now() };

  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
  if (input.isActive !== undefined) patch.isActive = input.isActive;
  if (input.productId !== undefined) patch.productId = input.productId || null;
  if (input.categorySlug !== undefined) {
    patch.categorySlug = input.categorySlug || null;
  }
  if (input.brandId !== undefined) patch.brandId = input.brandId || null;
  if (input.customImage !== undefined) patch.customImage = input.customImage || null;
  if (input.customTitle !== undefined) patch.customTitle = input.customTitle || null;
  if (input.customHref !== undefined) patch.customHref = input.customHref || null;
  if (input.badgeLabel !== undefined) patch.badgeLabel = input.badgeLabel || null;
  if (input.offerText !== undefined) patch.offerText = input.offerText || null;
  if (input.startDate !== undefined) patch.startDate = input.startDate;
  if (input.endDate !== undefined) patch.endDate = input.endDate;

  await getAdminFirestore().collection(ITEMS).doc(id).update(patch);
  invalidateHomepageCache();

  const updated = await getSectionItemById(id);
  if (!updated) throw new Error("Homepage section item not found after update");
  return updated;
}

export async function deleteSectionItem(id: string): Promise<void> {
  const existing = await getSectionItemById(id);
  if (!existing) throw new Error("Homepage section item not found");
  await getAdminFirestore().collection(ITEMS).doc(id).delete();
  invalidateHomepageCache();
}

export async function reorderSectionItems(
  sectionKey: HomepageSectionKey,
  orderedIds: string[]
): Promise<HomepageSectionItem[]> {
  const db = getAdminFirestore();
  const batch = db.batch();
  const timestamp = now();

  orderedIds.forEach((id, index) => {
    batch.update(db.collection(ITEMS).doc(id), {
      sortOrder: index,
      updatedAt: timestamp,
    });
  });

  await batch.commit();
  invalidateHomepageCache();
  return listSectionItems(sectionKey);
}

export async function upsertSection(
  input: CreateHomepageSectionInput
): Promise<HomepageSection> {
  const db = getAdminFirestore();
  const ref = db.collection(SECTIONS).doc(input.sectionKey);
  const existing = await ref.get();
  const timestamp = now();

  const section: HomepageSection = {
    id: input.sectionKey,
    ...input,
    createdAt: existing.exists
      ? String(existing.data()?.createdAt ?? timestamp)
      : timestamp,
    updatedAt: timestamp,
  };

  await ref.set(section, { merge: true });
  invalidateHomepageCache();
  return section;
}
