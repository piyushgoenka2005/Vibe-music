import { cache } from "react";
import { HEADER_MEGA_MENUS, type MegaMenuItem } from "@/data/headerMegaMenu";
import { buildCategoryMegaMenus } from "@/lib/navigation/buildCategoryMegaMenus";
import { listCategories } from "@/lib/server/catalog/categoryRepository";
import { getTaxonomySubcategoriesForHeader } from "@/lib/server/taxonomy/taxonomyRepository";
import { isPostgresConfigured } from "@/lib/db/prisma";
import type { Category } from "@/types/category";
import {
  getHeaderSettings,
  getNavigationMenuByHandle,
  type HeaderSettingRecord,
  type NavigationMenuItemRecord,
} from "@/lib/server/navigation/navigationRepository";

export interface ResolvedHeaderData {
  settings: HeaderSettingRecord;
  utilityItems: NavigationMenuItemRecord[];
  navItems: NavigationMenuItemRecord[];
  megaMenus: MegaMenuItem[];
}

const DEFAULT_SETTINGS: HeaderSettingRecord = {
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
  updatedAt: new Date().toISOString(),
};

const DEFAULT_UTILITY_ITEMS: NavigationMenuItemRecord[] = [
  {
    id: "def_util_1",
    menuId: "utility_bar",
    parentId: null,
    label: "Free Shipping on Orders Above ₹5,000*",
    url: "/shipping-policy",
    categoryId: null,
    icon: "Truck",
    sortOrder: 0,
    itemType: "link",
    megaMenuData: null,
    isActive: true,
    visibleDesktop: true,
    visibleMobile: true,
    openInNewTab: false,
    badgeText: null,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "def_util_2",
    menuId: "utility_bar",
    parentId: null,
    label: "100% Genuine Products",
    url: "/why-shop-with-us",
    categoryId: null,
    icon: "ShieldCheck",
    sortOrder: 1,
    itemType: "link",
    megaMenuData: null,
    isActive: true,
    visibleDesktop: true,
    visibleMobile: true,
    openInNewTab: false,
    badgeText: null,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "def_util_3",
    menuId: "utility_bar",
    parentId: null,
    label: "Expert Support",
    url: "/support",
    categoryId: null,
    icon: "Headphones",
    sortOrder: 2,
    itemType: "link",
    megaMenuData: null,
    isActive: true,
    visibleDesktop: true,
    visibleMobile: true,
    openInNewTab: false,
    badgeText: null,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "def_util_4",
    menuId: "utility_bar",
    parentId: null,
    label: "Track Order",
    url: "/account/orders",
    categoryId: null,
    icon: "Package",
    sortOrder: 3,
    itemType: "link",
    megaMenuData: null,
    isActive: true,
    visibleDesktop: true,
    visibleMobile: true,
    openInNewTab: false,
    badgeText: null,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "def_util_5",
    menuId: "utility_bar",
    parentId: null,
    label: "Help & Support",
    url: "/support",
    categoryId: null,
    icon: "HelpCircle",
    sortOrder: 4,
    itemType: "link",
    megaMenuData: null,
    isActive: true,
    visibleDesktop: true,
    visibleMobile: true,
    openInNewTab: false,
    badgeText: null,
    createdAt: "",
    updatedAt: "",
  },
];

const DEFAULT_MAIN_NAV_ITEMS: NavigationMenuItemRecord[] = [
  {
    id: "def_nav_0",
    menuId: "main_nav",
    parentId: null,
    label: "All Categories",
    url: "/categories",
    categoryId: null,
    icon: "Grid",
    sortOrder: 0,
    itemType: "mega_menu",
    megaMenuData: null,
    isActive: true,
    visibleDesktop: true,
    visibleMobile: true,
    openInNewTab: false,
    badgeText: "Explore",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "def_nav_1",
    menuId: "main_nav",
    parentId: null,
    label: "Brands",
    url: "/brands",
    categoryId: null,
    icon: null,
    sortOrder: 1,
    itemType: "dropdown",
    megaMenuData: null,
    isActive: true,
    visibleDesktop: true,
    visibleMobile: true,
    openInNewTab: false,
    badgeText: null,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "def_nav_2",
    menuId: "main_nav",
    parentId: null,
    label: "Guitars",
    url: "/category/guitars",
    categoryId: "guitars",
    icon: null,
    sortOrder: 2,
    itemType: "dropdown",
    megaMenuData: null,
    isActive: true,
    visibleDesktop: true,
    visibleMobile: true,
    openInNewTab: false,
    badgeText: null,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "def_nav_3",
    menuId: "main_nav",
    parentId: null,
    label: "Studio & Recording",
    url: "/category/studio-recording",
    categoryId: "studio-recording",
    icon: null,
    sortOrder: 3,
    itemType: "dropdown",
    megaMenuData: null,
    isActive: true,
    visibleDesktop: true,
    visibleMobile: true,
    openInNewTab: false,
    badgeText: null,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "def_nav_4",
    menuId: "main_nav",
    parentId: null,
    label: "Drums & Percussion",
    url: "/category/drums-percussion",
    categoryId: "drums-percussion",
    icon: null,
    sortOrder: 4,
    itemType: "dropdown",
    megaMenuData: null,
    isActive: true,
    visibleDesktop: true,
    visibleMobile: true,
    openInNewTab: false,
    badgeText: null,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "def_nav_5",
    menuId: "main_nav",
    parentId: null,
    label: "Keyboards & Synthesizers",
    url: "/category/keyboards-pianos",
    categoryId: "keyboards-pianos",
    icon: null,
    sortOrder: 5,
    itemType: "dropdown",
    megaMenuData: null,
    isActive: true,
    visibleDesktop: true,
    visibleMobile: true,
    openInNewTab: false,
    badgeText: null,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "def_nav_6",
    menuId: "main_nav",
    parentId: null,
    label: "Microphones & Wireless",
    url: "/category/microphones-wireless",
    categoryId: "microphones-wireless",
    icon: null,
    sortOrder: 6,
    itemType: "dropdown",
    megaMenuData: null,
    isActive: true,
    visibleDesktop: true,
    visibleMobile: true,
    openInNewTab: false,
    badgeText: null,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "def_nav_7",
    menuId: "main_nav",
    parentId: null,
    label: "Deals",
    url: "/deals",
    categoryId: null,
    icon: null,
    sortOrder: 7,
    itemType: "link",
    megaMenuData: null,
    isActive: true,
    visibleDesktop: true,
    visibleMobile: true,
    openInNewTab: false,
    badgeText: "Hot",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "def_nav_8",
    menuId: "main_nav",
    parentId: null,
    label: "Grand Piano",
    url: "/gp9",
    categoryId: null,
    icon: null,
    sortOrder: 9,
    itemType: "link",
    megaMenuData: null,
    isActive: true,
    visibleDesktop: true,
    visibleMobile: true,
    openInNewTab: false,
    badgeText: "Flagship",
    createdAt: "",
    updatedAt: "",
  },
];

/**
 * Loads header data independently from navigation data sources.
 * Does NOT generate header directly from Category Management.
 * Does NOT delete or alter navigation items if categories are deleted.
 */
export const loadHeaderData = cache(async (): Promise<ResolvedHeaderData> => {
  if (!isPostgresConfigured()) {
    return {
      settings: DEFAULT_SETTINGS,
      utilityItems: DEFAULT_UTILITY_ITEMS,
      navItems: DEFAULT_MAIN_NAV_ITEMS,
      megaMenus: HEADER_MEGA_MENUS,
    };
  }

  try {
    const [settings, utilityMenu, mainMenu] = await Promise.all([
      getHeaderSettings(),
      getNavigationMenuByHandle("utility_bar"),
      getNavigationMenuByHandle("main_nav"),
    ]);

    const utilityItems =
      utilityMenu && utilityMenu.items.length > 0
        ? utilityMenu.items.filter((i) => i.isActive)
        : DEFAULT_UTILITY_ITEMS;

    const navItems =
      mainMenu && mainMenu.items.length > 0
        ? mainMenu.items.filter((i) => i.isActive)
        : DEFAULT_MAIN_NAV_ITEMS;

    // 1. Build category mega menus from database categories (so custom images from Category Management appear)
    // with graceful fallback to static definitions if categories are empty.
    let baseMegaMenus: MegaMenuItem[] = HEADER_MEGA_MENUS;
    try {
      const [categories, taxonomySubcategories] = await Promise.all([
        listCategories(),
        getTaxonomySubcategoriesForHeader(),
      ]);
      for (const menu of HEADER_MEGA_MENUS) {
        if (!taxonomySubcategories.has(menu.slug)) {
          taxonomySubcategories.set(menu.slug, []);
        }
      }
      if (categories && categories.length > 0) {
        baseMegaMenus = buildCategoryMegaMenus(
          categories as unknown as Category[],
          taxonomySubcategories,
        );
      } else {
        baseMegaMenus = buildCategoryMegaMenus([], taxonomySubcategories);
      }
    } catch (e) {
      console.warn("[headerDataLoader] Falling back to default mega menus:", e);
    }

    // 2. Build mega-menu map based on configured navigation items + category definitions
    // This allows Header & Menu Management to customize promo cards while ensuring
    // changing or deleting categories never deletes or modifies header navigation items.
    const megaMenus: MegaMenuItem[] = baseMegaMenus.map((base) => {
      // If there's a matching nav item configured with custom name or href, respect it
      const matchingNavItem = navItems.find(
        (n) =>
          n.url.includes(base.slug) ||
          n.label.toLowerCase() === base.name.toLowerCase() ||
          n.categoryId === base.slug,
      );
      if (matchingNavItem) {
        let customFeatured = base.featured;
        if (matchingNavItem.megaMenuData && typeof matchingNavItem.megaMenuData === "object") {
          const customData = matchingNavItem.megaMenuData as {
            featured?: { title: string; href: string; image: string }[];
          };
          if (Array.isArray(customData.featured) && customData.featured.length > 0) {
            customFeatured = customData.featured.map((card, idx) => ({
              title: card.title || base.featured[idx]?.title || "",
              href: card.href || base.featured[idx]?.href || matchingNavItem.url,
              image: card.image || base.featured[idx]?.image || "",
            }));
          }
        }
        return {
          ...base,
          name: matchingNavItem.label,
          href: matchingNavItem.url,
          featured: customFeatured,
        };
      }
      return base;
    });

    return {
      settings,
      utilityItems,
      navItems,
      megaMenus,
    };
  } catch (err) {
    console.error("[headerDataLoader] Failed to load from DB, using resilient defaults:", err);
    return {
      settings: DEFAULT_SETTINGS,
      utilityItems: DEFAULT_UTILITY_ITEMS,
      navItems: DEFAULT_MAIN_NAV_ITEMS,
      megaMenus: HEADER_MEGA_MENUS,
    };
  }
});
