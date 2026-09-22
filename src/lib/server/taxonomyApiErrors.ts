import { NextResponse } from "next/server";
import { adminErrorResponse } from "@/lib/auth/require-admin";
import { isPrismaMissingTableError } from "@/lib/db/prisma-errors";

export const TAXONOMY_TABLE_MESSAGE =
  "Catalog taxonomy database table is missing. Run database migrations on the server (npm run db:migrate) and reload this page.";

export function taxonomyApiErrorResponse(error: unknown, request?: Request) {
  if (isPrismaMissingTableError(error, "catalog_taxonomies")) {
    return NextResponse.json({ error: TAXONOMY_TABLE_MESSAGE }, { status: 503 });
  }
  return adminErrorResponse(error, request);
}
