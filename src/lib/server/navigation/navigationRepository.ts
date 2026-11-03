import { prisma } from "@/lib/db/prisma";
import { invalidateAllStorefrontCaches } from "@/lib/server/storefront/storefrontCacheInvalidation";

export interface NavigationMenuItemRecord {
  id: string;
  menuId: string;
  parentId: string | null;
  label: string;
  url: string;
  categoryId: string | null;
  icon: string | null;
  sortOrder: number;
  itemType: string;
  megaMenuData: unknown | null;
  isActive: boolean;
  visibleDesktop: boolean;
  visibleMobile: boolean;
  openInNewTab: boolean;
  badgeText: string | null;
  createdAt: string;
  updatedAt: string;
  children?: NavigationMenuItemRecord[];
}

export interface NavigationMenuRecord {
  id: string;
  handle: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  items: NavigationMenuItemRecord[];
}

export interface HeaderSettingRecord {
  id: string;
  logoAsset: string | null;
  searchVisibility: boolean;
  searchPlaceholder: string;
  profileVisibility: boolean;
  profileDestination: string;
  wishlistVisibility: boolean;
  wishlistDestination: string;
  cartVisibility: boolean;
  cartDestination: string;
  utilityBarActive: boolean;
  shippingAnnouncement: string | null;
  shippingThreshold: number | null;
  updatedAt: string;
}

export async function getHeaderSettings(): Promise<HeaderSettingRecord> {
  const row = await prisma.headerSetting.findUnique({ where: { id: "default" } });
  if (row) {
    return row;
  }
  const now = new Date().toISOString();
  return prisma.headerSetting.create({
    data: {
      id: "default",
      logoAsset: "/brand/header-logo.webp",
      searchVisibility: true,
      searchPlaceholder: "Search for guitars, keyboards, microphones and more...",
      profileVisibility: true,
      profileDestination: "/account",
      wishlistVisibility: true,
      wishlistDestination: "/account/wishlist",
      cartVisibility: true,
      cartDestination: "/cart",
      utilityBarActive: true,
      shippingAnnouncement: "Free Shipping on Orders Above ₹5,000*",
      shippingThreshold: 5000,
      updatedAt: now,
    },
  });
}

export async function updateHeaderSettings(
  patch: Partial<Omit<HeaderSettingRecord, "id" | "updatedAt">>,
): Promise<HeaderSettingRecord> {
  const now = new Date().toISOString();
  const updated = await prisma.headerSetting.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      logoAsset: patch.logoAsset ?? "/brand/header-logo.webp",
      searchVisibility: patch.searchVisibility ?? true,
      searchPlaceholder:
        patch.searchPlaceholder ?? "Search for guitars, keyboards, microphones and more...",
      profileVisibility: patch.profileVisibility ?? true,
      profileDestination: patch.profileDestination ?? "/account",
      wishlistVisibility: patch.wishlistVisibility ?? true,
      wishlistDestination: patch.wishlistDestination ?? "/account/wishlist",
      cartVisibility: patch.cartVisibility ?? true,
      cartDestination: patch.cartDestination ?? "/cart",
      utilityBarActive: patch.utilityBarActive ?? true,
      shippingAnnouncement: patch.shippingAnnouncement ?? "Free Shipping on Orders Above ₹5,000*",
      shippingThreshold: patch.shippingThreshold ?? 5000,
      updatedAt: now,
    },
    update: {
      ...patch,
      updatedAt: now,
    },
  });

  try {
    invalidateAllStorefrontCaches();
  } catch {
    /* outside request scope */
  }
  return updated;
}

export async function ensureDefaultNavigationMenus(): Promise<void> {
  const menusCount = await prisma.navigationMenu.count();
  if (menusCount > 0) return;

  const now = new Date().toISOString();

  // 1. Utility bar menu
  const utilityMenu = await prisma.navigationMenu.create({
    data: {
      handle: "utility_bar",
      name: "Top Utility & Announcement Bar",
      description: "Utility items shown in the top strip above the main header",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  });

  const utilityItems = [
    {
      label: "Free Shipping on Orders Above ₹5,000*",
      url: "/shipping-policy",
      icon: "Truck",
      sortOrder: 0,
    },
    { label: "100% Genuine Products", url: "/why-shop-with-us", icon: "ShieldCheck", sortOrder: 1 },
    { label: "Expert Support", url: "/support", icon: "Headphones", sortOrder: 2 },
    { label: "Track Order", url: "/account/orders", icon: "Package", sortOrder: 3 },
    { label: "Help & Support", url: "/support", icon: "HelpCircle", sortOrder: 4 },
  ];

  for (const item of utilityItems) {
    await prisma.navigationMenuItem.create({
      data: {
        menuId: utilityMenu.id,
        label: item.label,
        url: item.url,
        icon: item.icon,
        sortOrder: item.sortOrder,
        itemType: "link",
        isActive: true,
        visibleDesktop: true,
        visibleMobile: true,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  // 2. Primary Navigation menu (Row 3)
  const mainMenu = await prisma.navigationMenu.create({
    data: {
      handle: "main_nav",
      name: "Primary Header Navigation",
      description: "Primary navigation bar with All Categories trigger and departmental dropdowns",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  });

  const mainNavItems = [
    {
      label: "All Categories",
      url: "/categories",
      itemType: "mega_menu",
      badgeText: "Explore",
      sortOrder: 0,
    },
    { label: "Brands", url: "/brands", itemType: "dropdown", sortOrder: 1 },
    {
      label: "Guitars",
      url: "/category/guitars",
      categoryId: "guitars",
      itemType: "dropdown",
      sortOrder: 2,
    },
    {
      label: "Studio & Recording",
      url: "/category/studio-recording",
      categoryId: "studio-recording",
      itemType: "dropdown",
      sortOrder: 3,
    },
    {
      label: "Drums & Percussion",
      url: "/category/drums-percussion",
      categoryId: "drums-percussion",
      itemType: "dropdown",
      sortOrder: 4,
    },
    {
      label: "Keyboards & Synthesizers",
      url: "/category/keyboards-pianos",
      categoryId: "keyboards-pianos",
      itemType: "dropdown",
      sortOrder: 5,
    },
    {
      label: "Microphones & Wireless",
      url: "/category/microphones-wireless",
      categoryId: "microphones-wireless",
      itemType: "dropdown",
      sortOrder: 6,
    },
    { label: "Deals", url: "/deals", itemType: "link", badgeText: "Hot", sortOrder: 7 },
    { label: "Today Deals", url: "/deals", itemType: "link", sortOrder: 8 },
    { label: "Grand Piano", url: "/gp9", itemType: "link", badgeText: "Flagship", sortOrder: 9 },
  ];

  for (const item of mainNavItems) {
    await prisma.navigationMenuItem.create({
      data: {
        menuId: mainMenu.id,
        label: item.label,
        url: item.url,
        categoryId: item.categoryId ?? null,
        itemType: item.itemType,
        badgeText: item.badgeText ?? null,
        sortOrder: item.sortOrder,
        isActive: true,
        visibleDesktop: true,
        visibleMobile: true,
        createdAt: now,
        updatedAt: now,
      },
    });
  }
}

export async function getNavigationMenus(): Promise<NavigationMenuRecord[]> {
  await ensureDefaultNavigationMenus();
  const menus = await prisma.navigationMenu.findMany({
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return menus.map((menu) => ({
    id: menu.id,
    handle: menu.handle,
    name: menu.name,
    description: menu.description,
    isActive: menu.isActive,
    createdAt: menu.createdAt,
    updatedAt: menu.updatedAt,
    items: menu.items as NavigationMenuItemRecord[],
  }));
}

export async function getNavigationMenuByHandle(
  handle: string,
): Promise<NavigationMenuRecord | null> {
  await ensureDefaultNavigationMenus();
  const menu = await prisma.navigationMenu.findUnique({
    where: { handle },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!menu) return null;

  return {
    id: menu.id,
    handle: menu.handle,
    name: menu.name,
    description: menu.description,
    isActive: menu.isActive,
    createdAt: menu.createdAt,
    updatedAt: menu.updatedAt,
    items: menu.items as NavigationMenuItemRecord[],
  };
}

export async function createNavigationMenuItem(input: {
  menuId: string;
  parentId?: string | null;
  label: string;
  url: string;
  categoryId?: string | null;
  icon?: string | null;
  sortOrder?: number;
  itemType?: string;
  megaMenuData?: unknown;
  isActive?: boolean;
  visibleDesktop?: boolean;
  visibleMobile?: boolean;
  openInNewTab?: boolean;
  badgeText?: string | null;
}): Promise<NavigationMenuItemRecord> {
  const now = new Date().toISOString();
  const maxOrder = await prisma.navigationMenuItem.findFirst({
    where: { menuId: input.menuId, parentId: input.parentId ?? null },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const item = await prisma.navigationMenuItem.create({
    data: {
      menuId: input.menuId,
      parentId: input.parentId ?? null,
      label: input.label,
      url: input.url,
      categoryId: input.categoryId ?? null,
      icon: input.icon ?? null,
      sortOrder: input.sortOrder ?? (maxOrder ? maxOrder.sortOrder + 1 : 0),
      itemType: input.itemType ?? "link",
      megaMenuData: input.megaMenuData ? JSON.parse(JSON.stringify(input.megaMenuData)) : undefined,
      isActive: input.isActive ?? true,
      visibleDesktop: input.visibleDesktop ?? true,
      visibleMobile: input.visibleMobile ?? true,
      openInNewTab: input.openInNewTab ?? false,
      badgeText: input.badgeText ?? null,
      createdAt: now,
      updatedAt: now,
    },
  });

  try {
    invalidateAllStorefrontCaches();
  } catch {
    /* outside request scope */
  }

  return item as NavigationMenuItemRecord;
}

export async function updateNavigationMenuItem(
  id: string,
  patch: Partial<Omit<NavigationMenuItemRecord, "id" | "createdAt" | "updatedAt">>,
): Promise<NavigationMenuItemRecord> {
  const now = new Date().toISOString();
  const item = await prisma.navigationMenuItem.update({
    where: { id },
    data: {
      ...(patch.label !== undefined ? { label: patch.label } : {}),
      ...(patch.url !== undefined ? { url: patch.url } : {}),
      ...(patch.categoryId !== undefined ? { categoryId: patch.categoryId } : {}),
      ...(patch.parentId !== undefined ? { parentId: patch.parentId } : {}),
      ...(patch.icon !== undefined ? { icon: patch.icon } : {}),
      ...(patch.sortOrder !== undefined ? { sortOrder: patch.sortOrder } : {}),
      ...(patch.itemType !== undefined ? { itemType: patch.itemType } : {}),
      ...(patch.megaMenuData !== undefined
        ? {
            megaMenuData: patch.megaMenuData
              ? JSON.parse(JSON.stringify(patch.megaMenuData))
              : null,
          }
        : {}),
      ...(patch.isActive !== undefined ? { isActive: patch.isActive } : {}),
      ...(patch.visibleDesktop !== undefined ? { visibleDesktop: patch.visibleDesktop } : {}),
      ...(patch.visibleMobile !== undefined ? { visibleMobile: patch.visibleMobile } : {}),
      ...(patch.openInNewTab !== undefined ? { openInNewTab: patch.openInNewTab } : {}),
      ...(patch.badgeText !== undefined ? { badgeText: patch.badgeText } : {}),
      updatedAt: now,
    },
  });

  try {
    invalidateAllStorefrontCaches();
  } catch {
    /* outside request scope */
  }

  return item as NavigationMenuItemRecord;
}

export async function deleteNavigationMenuItem(id: string): Promise<void> {
  // CRITICAL: Deleting a menu item deletes ONLY the menu item (and any children),
  // NEVER the linked category or taxonomy!
  await prisma.navigationMenuItem.delete({
    where: { id },
  });

  try {
    invalidateAllStorefrontCaches();
  } catch {
    /* outside request scope */
  }
}

export async function reorderNavigationMenuItems(
  items: { id: string; sortOrder: number }[],
): Promise<void> {
  const now = new Date().toISOString();
  await prisma.$transaction(
    items.map((item) =>
      prisma.navigationMenuItem.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder, updatedAt: now },
      }),
    ),
  );

  try {
    invalidateAllStorefrontCaches();
  } catch {
    /* outside request scope */
  }
}
