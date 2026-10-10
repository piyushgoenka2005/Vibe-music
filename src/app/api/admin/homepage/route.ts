import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { listAllSectionItems, listAllSections } from "@/lib/server/homepageService";
import { ensureMissingHomepageSections } from "@/lib/server/prisma/contentRepository";

export async function GET(request: Request) {
  try {
    await requireAdmin("homepage:read", request);
    // Seed missing section keys once per process — do not bust caches on every admin read.
    await ensureMissingHomepageSections();
    const [sections, items] = await Promise.all([listAllSections(), listAllSectionItems()]);
    return NextResponse.json(
      { sections, items },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return adminErrorResponse(error);
  }
}
