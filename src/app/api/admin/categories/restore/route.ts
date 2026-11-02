import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { restoreCategoriesFromMasterTaxonomy } from "@/lib/server/catalog/categoryRepository";

/**
 * POST /api/admin/categories/restore
 *
 * ADMIN-ONLY endpoint to explicitly restore all categories from Master Taxonomy.
 *
 * This is for when an admin wants to rebuild the category list from the default configuration.
 * This is NOT automatic - it only happens when explicitly requested.
 *
 * WARNING: This will add all default Master Taxonomy categories to the database.
 * Existing custom categories are preserved; only missing ones are added.
 */
export async function POST(request: Request) {
  try {
    await requireAdmin("categories:write", request);

    console.log("[admin-api] Admin requesting category restoration from Master Taxonomy");

    const restored = await restoreCategoriesFromMasterTaxonomy();

    console.log(
      `[admin-api] Successfully restored ${restored.length} categories from Master Taxonomy`,
    );

    return NextResponse.json({
      success: true,
      message: `Successfully restored ${restored.length} categories from Master Taxonomy`,
      restoredCount: restored.length,
      categories: restored,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[admin-api] Error restoring categories:", error);
    return adminErrorResponse(error, request);
  }
}
