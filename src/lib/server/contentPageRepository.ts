import "server-only";

import {
  CONTENT_PAGES,
  type ContentPage,
} from "@/data/contentPages";
import { prisma } from "@/lib/db/prisma";
import { asJsonValue } from "@/lib/server/prisma/mappers";

export const CONTENT_PAGES_COLLECTION = "contentPages";

function mapContentPage(row: {
  slug: string;
  title: string;
  eyebrow: string;
  sections: unknown;
}): ContentPage {
  return {
    slug: row.slug,
    title: row.title,
    eyebrow: row.eyebrow,
    sections: Array.isArray(row.sections)
      ? row.sections.map((section) => {
          const item = section as { heading?: string; paragraphs?: string[] };
          return {
            heading: item.heading ? String(item.heading) : undefined,
            paragraphs: Array.isArray(item.paragraphs)
              ? item.paragraphs.map(String)
              : [],
          };
        })
      : [],
  };
}

export async function getContentPageFromDb(
  slug: string
): Promise<ContentPage | null> {
  const row = await prisma.contentPage.findUnique({ where: { slug } });
  return row ? mapContentPage(row) : null;
}

export async function resolveContentPage(slug: string): Promise<ContentPage | undefined> {
  try {
    const fromDatabase = await getContentPageFromDb(slug);
    if (fromDatabase) return fromDatabase;
  } catch {
    // Fall back to static content when PostgreSQL is unavailable.
  }
  return CONTENT_PAGES[slug];
}

export async function listContentPages(): Promise<ContentPage[]> {
  const rows = await prisma.contentPage.findMany({ orderBy: { title: "asc" } });
  const merged = new Map<string, ContentPage>();

  Object.values(CONTENT_PAGES).forEach((page) => merged.set(page.slug, page));
  rows.map(mapContentPage).forEach((page) => merged.set(page.slug, page));

  return Array.from(merged.values()).sort((a, b) => a.title.localeCompare(b.title));
}

export async function upsertContentPage(page: ContentPage): Promise<ContentPage> {
  const now = new Date().toISOString();
  await prisma.contentPage.upsert({
    where: { slug: page.slug },
    create: {
      slug: page.slug,
      title: page.title,
      eyebrow: page.eyebrow,
      sections: asJsonValue(page.sections),
      updatedAt: now,
    },
    update: {
      title: page.title,
      eyebrow: page.eyebrow,
      sections: asJsonValue(page.sections),
      updatedAt: now,
    },
  });
  return page;
}

export async function deleteContentPage(slug: string): Promise<{
  deleted: boolean;
  revertedToSeed: boolean;
}> {
  const seeded = Boolean(CONTENT_PAGES[slug]);
  const existing = await prisma.contentPage.findUnique({ where: { slug } });
  if (!existing && !seeded) {
    return { deleted: false, revertedToSeed: false };
  }
  if (existing) {
    await prisma.contentPage.delete({ where: { slug } });
  }
  // Seeded pages remain available from static CONTENT_PAGES after DB delete.
  if (!seeded && !existing) {
    return { deleted: false, revertedToSeed: false };
  }
  return { deleted: true, revertedToSeed: seeded };
}

export function isSeededContentPage(slug: string): boolean {
  return Boolean(CONTENT_PAGES[slug]);
}
