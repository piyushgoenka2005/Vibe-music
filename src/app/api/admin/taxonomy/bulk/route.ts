import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  deleteTaxonomyNodes,
  deleteAllTaxonomyNodes,
} from "@/lib/server/taxonomy/taxonomyRepository";
import { taxonomyApiErrorResponse } from "@/lib/server/taxonomyApiErrors";
import { z } from "zod";

const bulkTaxonomySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("delete"),
    ids: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    action: z.literal("delete_all"),
    category: z.string().optional(),
    search: z.string().optional(),
  }),
]);

export async function POST(request: NextRequest) {
  try {
    await requireAdmin("categories:delete", request);
    const body = await request.json();
    const parsed = bulkTaxonomySchema.parse(body);

    if (parsed.action === "delete") {
      const deleted = await deleteTaxonomyNodes(parsed.ids);
      return NextResponse.json({ ok: true, deleted });
    }

    if (parsed.action === "delete_all") {
      const deleted = await deleteAllTaxonomyNodes({
        category: parsed.category,
        search: parsed.search,
      });
      return NextResponse.json({ ok: true, deleted });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return taxonomyApiErrorResponse(error, request);
  }
}
