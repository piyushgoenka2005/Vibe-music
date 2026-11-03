import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  getNavigationMenus,
  getHeaderSettings,
  createNavigationMenuItem,
} from "@/lib/server/navigation/navigationRepository";
import { z } from "zod";

const createItemSchema = z.object({
  menuId: z.string().min(1),
  parentId: z.string().nullable().optional(),
  label: z.string().min(1).max(255),
  url: z.string().min(1),
  categoryId: z.string().nullable().optional(),
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

export async function GET(request: Request) {
  try {
    await requireAdmin("settings:read", request);
    const [menus, settings] = await Promise.all([getNavigationMenus(), getHeaderSettings()]);
    return NextResponse.json({ menus, settings });
  } catch (error) {
    return adminErrorResponse(error, request);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin("settings:write", request);
    const body = await request.json();
    const parsed = createItemSchema.parse(body);
    const item = await createNavigationMenuItem(parsed);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error, request);
  }
}
