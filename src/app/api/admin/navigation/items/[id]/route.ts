import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  updateNavigationMenuItem,
  deleteNavigationMenuItem,
} from "@/lib/server/navigation/navigationRepository";
import { z } from "zod";

const updateItemSchema = z.object({
  label: z.string().min(1).max(255).optional(),
  url: z.string().min(1).optional(),
  categoryId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
  itemType: z.enum(["link", "dropdown", "mega_menu"]).optional(),
  megaMenuData: z.unknown().optional(),
  isActive: z.boolean().optional(),
  visibleDesktop: z.boolean().optional(),
  visibleMobile: z.boolean().optional(),
  openInNewTab: z.boolean().optional(),
  badgeText: z.string().nullable().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAdmin("settings:write", request);
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateItemSchema.parse(body);
    const item = await updateNavigationMenuItem(id, parsed);
    return NextResponse.json({ item });
  } catch (error) {
    return adminErrorResponse(error, request);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await requireAdmin("settings:write", request);
    const { id } = await context.params;
    await deleteNavigationMenuItem(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error, request);
  }
}
