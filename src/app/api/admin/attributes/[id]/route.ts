import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getProductAttributeById,
  updateProductAttribute,
  deleteProductAttribute,
} from "@/lib/server/catalog/attributesRepository";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin("categories:read", request);
    const { id } = await params;
    const attribute = await getProductAttributeById(id);

    if (!attribute) {
      return NextResponse.json({ error: "Attribute not found" }, { status: 404 });
    }

    return NextResponse.json({ attribute });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("Unauthorized") || message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin("categories:write", request);
    const { id } = await params;
    const body = await request.json();

    const updated = await updateProductAttribute(id, {
      ...(body.name && { name: String(body.name).trim() }),
      ...(body.category && { category: String(body.category).trim() }),
      ...(body.type && { type: body.type }),
      ...(body.isFilterable !== undefined && { isFilterable: Boolean(body.isFilterable) }),
      ...(body.isRequired !== undefined && { isRequired: Boolean(body.isRequired) }),
      ...(Array.isArray(body.values) && {
        values: body.values
          .map(String)
          .map((v: string) => v.trim())
          .filter(Boolean),
      }),
      ...(body.description !== undefined && { description: String(body.description).trim() }),
    });

    if (!updated) {
      return NextResponse.json({ error: "Attribute not found" }, { status: 404 });
    }

    return NextResponse.json({ attribute: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update attribute";
    const status = message.includes("Unauthorized") || message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin("categories:delete", request);
    const { id } = await params;

    const ok = await deleteProductAttribute(id);
    if (!ok) {
      return NextResponse.json({ error: "Attribute not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete attribute";
    const status = message.includes("Unauthorized") || message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
