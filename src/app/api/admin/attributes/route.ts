import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getProductAttributes,
  createProductAttribute,
} from "@/lib/server/catalog/attributesRepository";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin("categories:read", request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const category = searchParams.get("category") || undefined;

    const attributes = await getProductAttributes({ search, category });

    const stats = {
      total: attributes.length,
      filterable: attributes.filter((a) => a.isFilterable).length,
      categoriesCount: new Set(attributes.map((a) => a.category)).size,
      totalValues: attributes.reduce((acc, curr) => acc + curr.values.length, 0),
    };

    return NextResponse.json({ attributes, stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load attributes";
    const status = message.includes("Unauthorized") || message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin("categories:write", request);

    const body = await request.json();
    if (!body.name || !body.code) {
      return NextResponse.json({ error: "Attribute name and code are required." }, { status: 400 });
    }

    const attribute = await createProductAttribute({
      name: String(body.name).trim(),
      code: String(body.code)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_"),
      category: String(body.category || "All").trim(),
      type: body.type || "select",
      isFilterable: Boolean(body.isFilterable),
      isRequired: Boolean(body.isRequired),
      values: Array.isArray(body.values)
        ? body.values
            .map(String)
            .map((v: string) => v.trim())
            .filter(Boolean)
        : [],
      description: body.description ? String(body.description).trim() : undefined,
    });

    return NextResponse.json({ attribute }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create attribute";
    const status = message.includes("Unauthorized") || message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
