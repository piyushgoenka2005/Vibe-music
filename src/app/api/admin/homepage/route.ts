import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { listAllSectionItems, listAllSections } from "@/lib/server/homepageService";
import { ensureMissingHomepageSections } from "@/lib/server/prisma/contentRepository";

const getAdminHomepageConfig = unstable_cache(
  async () => {
    const [sections, items] = await Promise.all([listAllSections(), listAllSectionItems()]);
    return { sections, items };
  },
  ["admin-homepage-config-v1"],
  { revalidate: 15, tags: ["homepage"] },
);

export async function GET(request: Request) {
  try {
    await requireAdmin("homepage:read", request);
    // Seed missing section keys once per process — do not bust caches on every admin read.
    await ensureMissingHomepageSections();
    const data = await getAdminHomepageConfig();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, max-age=15" },
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
