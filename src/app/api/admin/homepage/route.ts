import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  invalidateHomepageCache,
  listAllSectionItems,
  listAllSections,
} from "@/lib/server/homepageService";
import {
  ensureMissingHomepageSections,
  resetHomepageSectionsEnsureGate,
} from "@/lib/server/prisma/contentRepository";

export async function GET() {
  try {
    await requireAdmin("homepage:read");
    // Ensure all section keys exist and backfill empty curated defaults (stories, brands, …).
    resetHomepageSectionsEnsureGate();
    await ensureMissingHomepageSections();
    invalidateHomepageCache();
    const [sections, items] = await Promise.all([listAllSections(), listAllSectionItems()]);
    return NextResponse.json({ sections, items });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
