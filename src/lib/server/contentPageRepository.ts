import "server-only";

import {
  CONTENT_PAGES,
  type ContentPage,
} from "@/data/contentPages";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { withFirestoreDeadline } from "@/lib/server/firestoreErrors";

export const CONTENT_PAGES_COLLECTION = "contentPages";

function normalizeContentPage(
  slug: string,
  data: FirebaseFirestore.DocumentData
): ContentPage {
  return {
    slug,
    title: String(data.title ?? ""),
    eyebrow: String(data.eyebrow ?? ""),
    sections: Array.isArray(data.sections)
      ? data.sections.map((section: { heading?: string; paragraphs?: string[] }) => ({
          heading: section.heading ? String(section.heading) : undefined,
          paragraphs: Array.isArray(section.paragraphs)
            ? section.paragraphs.map(String)
            : [],
        }))
      : [],
  };
}

export async function getContentPageFromFirestore(
  slug: string
): Promise<ContentPage | null> {
  const db = getAdminFirestore();
  const doc = await withFirestoreDeadline(() =>
    db.collection(CONTENT_PAGES_COLLECTION).doc(slug).get()
  );
  if (!doc.exists) return null;
  return normalizeContentPage(slug, doc.data()!);
}

export async function resolveContentPage(slug: string): Promise<ContentPage | undefined> {
  try {
    const fromFirestore = await getContentPageFromFirestore(slug);
    if (fromFirestore) return fromFirestore;
  } catch {
    // Fall back to static content when Firestore is unavailable.
  }
  return CONTENT_PAGES[slug];
}

export async function listContentPages(): Promise<ContentPage[]> {
  const db = getAdminFirestore();
  const snap = await db.collection(CONTENT_PAGES_COLLECTION).get();
  const firestorePages = snap.docs.map((doc) =>
    normalizeContentPage(doc.id, doc.data())
  );
  const merged = new Map<string, ContentPage>();

  Object.values(CONTENT_PAGES).forEach((page) => merged.set(page.slug, page));
  firestorePages.forEach((page) => merged.set(page.slug, page));

  return Array.from(merged.values()).sort((a, b) => a.title.localeCompare(b.title));
}

export async function upsertContentPage(page: ContentPage): Promise<ContentPage> {
  const db = getAdminFirestore();
  const now = new Date().toISOString();
  await db
    .collection(CONTENT_PAGES_COLLECTION)
    .doc(page.slug)
    .set({ ...page, updatedAt: now }, { merge: true });
  return page;
}
