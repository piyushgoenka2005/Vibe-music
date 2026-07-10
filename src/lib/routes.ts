import { slugify } from "@/lib/slug";

/** WRD canonical routes */
export const ROUTES = {
  home: "/",
  search: "/search",
  searchResults: "/search/results",
  cart: "/cart",
  checkout: "/checkout",
  checkoutSuccess: "/checkout/success",
  orderPay: (orderId: string, email?: string) =>
    email
      ? `/orders/${orderId}/pay?email=${encodeURIComponent(email)}`
      : `/orders/${orderId}/pay`,
  trackOrder: "/track-order",
  account: "/account",
  accountOrders: "/account/orders",
  accountOrder: (orderId: string) => `/account/orders/${orderId}`,
  accountProfile: "/account/profile",
  accountAddresses: "/account/addresses",
  accountSettings: "/account/settings",
  accountNotifications: "/account/notifications",
  accountSupport: "/account/support",
  accountWishlist: "/account/wishlist",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  admin: "/admin",
  adminLogin: "/admin/login",
  adminProducts: "/admin/products",
  adminProductNew: "/admin/products/new",
  adminOrders: "/admin/orders",
  adminCustomers: "/admin/customers",
  adminCategories: "/admin/categories",
  adminCoupons: "/admin/coupons",
  adminReviews: "/admin/reviews",
  adminInventory: "/admin/inventory",
  adminAnalytics: "/admin/analytics",
  adminBanners: "/admin/banners",
  adminHomepage: "/admin/homepage",
  adminAuditLogs: "/admin/audit-logs",
  adminBrands: "/admin/brands",
  adminReturns: "/admin/returns",
  adminQuestions: "/admin/questions",
  adminUsers: "/admin/users",
  adminRoles: "/admin/roles",
  adminSupport: "/admin/support",
  adminNotifications: "/admin/notifications",
  adminCms: "/admin/cms",
  adminShipping: "/admin/shipping",
  adminSettings: "/admin/settings",
  adminBlog: "/admin/blog",
  blog: "/blog",
  gp9: "/gp9",
  deals: "/deals",
  brands: "/brands",
  compare: "/compare",
  contact: "/contact",
  careers: "/pages/careers",
  page: (slug: string) => `/pages/${slug}`,
} as const;

export function categoryPath(slug: string): string {
  return `/category/${slug}`;
}

export function productPath(slug: string): string {
  return `/product/${slug}`;
}

const PLACEHOLDER_REDIRECTS: Record<string, string> = {
  "/categories": ROUTES.search,
  "/products": ROUTES.search,
  "/wishlist": ROUTES.accountWishlist,
};

/** Longest-prefix shop paths → category slug */
const SHOP_PREFIX_RULES: Array<{ prefix: string; target: string }> = [
  { prefix: "/shop/studio-recording/microphones", target: categoryPath("microphones-wireless") },
  { prefix: "/shop/guitars", target: categoryPath("guitars") },
  { prefix: "/shop/guitar", target: categoryPath("guitars") },
  { prefix: "/shop/bass", target: categoryPath("bass") },
  { prefix: "/shop/amplifiers-effects", target: categoryPath("guitars") },
  { prefix: "/shop/studio-recording", target: categoryPath("studio-recording") },
  { prefix: "/shop/software", target: categoryPath("software-plug-ins") },
  { prefix: "/shop/pro-tools", target: categoryPath("software-plug-ins") },
  { prefix: "/shop/live-sound", target: categoryPath("live-sound-lighting") },
  { prefix: "/shop/keyboards-synthesizers", target: categoryPath("keyboards-synthesizers") },
  { prefix: "/shop/keyboard-synthesizer", target: categoryPath("keyboards-synthesizers") },
  { prefix: "/shop/pianos", target: categoryPath("keyboards-synthesizers") },
  { prefix: "/shop/dj-equipment", target: categoryPath("dj-equipment") },
  { prefix: "/shop/drums-percussion", target: categoryPath("drums-percussion") },
  { prefix: "/shop/drum-percussion", target: categoryPath("drums-percussion") },
  { prefix: "/shop/drum-month", target: categoryPath("drums-percussion") },
  { prefix: "/shop/band-and-orchestra", target: categoryPath("band-orchestra") },
  { prefix: "/shop/band-orchestra", target: categoryPath("band-orchestra") },
  { prefix: "/shop/home-audio-and-electronics", target: categoryPath("home-audio-electronics") },
  { prefix: "/shop/commercial-audio", target: categoryPath("commercial-audio-installation") },
  { prefix: "/shop/video-equipment", target: categoryPath("video-cameras") },
  { prefix: "/shop/accessories", target: categoryPath("cables-cases-accessories") },
  { prefix: "/shop/cables", target: categoryPath("cables-cases-accessories") },
  { prefix: "/shop/cases", target: categoryPath("cables-cases-accessories") },
  { prefix: "/shop/stands", target: categoryPath("cables-cases-accessories") },
  { prefix: "/shop/snakes", target: categoryPath("cables-cases-accessories") },
  { prefix: "/shop/by-category", target: ROUTES.search },
  { prefix: "/shop/microphone", target: categoryPath("microphones-wireless") },
].sort((a, b) => b.prefix.length - a.prefix.length);

const NAV_TOP_REDIRECTS: Record<string, string> = {
  "/whats-new": `${ROUTES.searchResults}?q=new`,
  "/dealzone": ROUTES.deals,
  "/used": `${ROUTES.searchResults}?q=used`,
  "/instrument-rentals": `${ROUTES.search}?q=rentals`,
  "/insync": ROUTES.blog,
  "/sweetcare": `${ROUTES.search}?q=support`,
  "/outlet-deals": ROUTES.deals,
  "/giveaway": `${ROUTES.search}?q=giveaway`,
  "/financing": `${ROUTES.search}?q=financing`,
  "/integration": ROUTES.search,
  "/tracking": ROUTES.trackOrder,
};

const ACCOUNT_REDIRECTS: Record<string, string> = {
  "/myaccount": ROUTES.account,
  "/myaccount/update_account": ROUTES.accountProfile,
  "/myaccount/accounts": ROUTES.accountAddresses,
  "/myaccount/prefs": ROUTES.accountSettings,
  "/myaccount/history": ROUTES.accountOrders,
  "/myaccount/create_account.php": ROUTES.register,
};

const STORE_REDIRECTS: Record<string, string> = {
  "/store/cart.php": ROUTES.cart,
  "/store/cart": ROUTES.cart,
  "/store/search": ROUTES.search,
  "/store/wishlist": ROUTES.accountWishlist,
  "/store/checkout": ROUTES.checkout,
};

const AUTH_REDIRECTS: Record<string, string> = {
  "/auth/signin": ROUTES.login,
  "/auth/signup": ROUTES.register,
};

function normalizePath(pathname: string): string {
  const withoutQuery = pathname.split("?")[0]?.split("#")[0] ?? pathname;
  const trimmed = withoutQuery.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

function isValidAppRoute(path: string): boolean {
  if (path === "/") return true;
  if (path === ROUTES.search) return true;
  if (path.startsWith(`${ROUTES.searchResults}`)) return true;
  if (path === ROUTES.cart || path === ROUTES.checkout) return true;
  if (path.startsWith(`${ROUTES.checkout}/`)) return true;
  if (path === ROUTES.trackOrder) return true;
  if (path === ROUTES.account) return true;
  if (path === ROUTES.accountOrders) return true;
  if (path === ROUTES.accountProfile) return true;
  if (path === ROUTES.accountAddresses) return true;
  if (path === ROUTES.accountSettings) return true;
  if (path === ROUTES.accountWishlist) return true;
  if (path === ROUTES.accountNotifications) return true;
  if (path === ROUTES.accountSupport) return true;
  if (path === ROUTES.login || path === ROUTES.register) return true;
  if (path === ROUTES.blog || path.startsWith("/blog/")) return true;
  if (path === ROUTES.gp9 || path.startsWith(`${ROUTES.gp9}/`)) return true;
  if (path === ROUTES.deals || path === ROUTES.brands || path === ROUTES.compare) return true;
  if (path === ROUTES.contact) return true;
  if (path === "/careers" || path === ROUTES.careers || path.startsWith("/pages/")) return true;
  if (path === ROUTES.admin) return true;
  if (path.startsWith("/admin/")) return true;

  const categoryMatch = path.match(/^\/category\/([^/]+)$/);
  if (categoryMatch) return true;

  const productMatch = path.match(/^\/product\/([^/]+)$/);
  if (productMatch) return true;

  return false;
}

function resolveShopPath(path: string): string | null {
  for (const rule of SHOP_PREFIX_RULES) {
    if (path === rule.prefix || path.startsWith(`${rule.prefix}/`)) {
      return rule.target;
    }
  }
  if (path.startsWith("/shop/")) {
    return ROUTES.search;
  }
  return null;
}

/**
 * Maps legacy Vibe Music paths to WRD routes.
 * Returns null when no redirect is needed.
 */
export function resolveLegacyPath(pathname: string): string | null {
  const path = normalizePath(pathname);

  if (isValidAppRoute(path)) return null;

  if (PLACEHOLDER_REDIRECTS[path]) return PLACEHOLDER_REDIRECTS[path];

  const storeDetail = resolveStoreDetail(path);
  if (storeDetail) return storeDetail;

  if (STORE_REDIRECTS[path]) return STORE_REDIRECTS[path];
  if (AUTH_REDIRECTS[path]) return AUTH_REDIRECTS[path];
  if (ACCOUNT_REDIRECTS[path]) return ACCOUNT_REDIRECTS[path];

  for (const [key, target] of Object.entries(ACCOUNT_REDIRECTS)) {
    if (path.startsWith(`${key}/`)) return target;
  }

  if (NAV_TOP_REDIRECTS[path]) return NAV_TOP_REDIRECTS[path];
  for (const [key, target] of Object.entries(NAV_TOP_REDIRECTS)) {
    if (path.startsWith(`${key}/`)) return target;
  }

  const catalog = resolveCatalogCategory(path);
  if (catalog) return catalog;

  const shop = resolveShopPath(path);
  if (shop) return shop;

  if (path.startsWith("/dealzone")) {
    return ROUTES.deals;
  }
  if (path.startsWith("/used")) {
    return `${ROUTES.searchResults}?q=used`;
  }
  if (path.startsWith("/nowshipping")) {
    return `${ROUTES.searchResults}?q=new`;
  }
  if (path.startsWith("/insync")) {
    return ROUTES.blog;
  }
  if (path.startsWith("/store/manufacturer/")) {
    return ROUTES.search;
  }
  if (path.startsWith("/about/") || path.startsWith("/help/")) {
    return ROUTES.search;
  }
  if (path.startsWith("/newgearday")) {
    return `${ROUTES.searchResults}?q=new`;
  }
  if (path.startsWith("/financing")) {
    return `${ROUTES.search}?q=financing`;
  }

  return null;
}

function resolveStoreDetail(path: string): string | null {
  const match = path.match(/^\/store\/detail\/[^/]+--(.+)$/);
  if (!match?.[1]) return null;
  return productPath(match[1]);
}

function resolveCatalogCategory(path: string): string | null {
  const match = path.match(/^\/c\d+--(.+)$/);
  if (!match?.[1]) return null;
  const slug = slugify(match[1].replace(/_/g, " "));
  if (!slug) return null;
  return categoryPath(slug);
}

/** Resolve href for in-page link interception (preserves query + hash) */
export function resolveLinkHref(href: string): string {
  if (
    !href ||
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("sms:") ||
    href.startsWith("javascript:")
  ) {
    return href;
  }

  if (href.startsWith("http://") || href.startsWith("https://")) {
    return href;
  }

  const hashIndex = href.indexOf("#");
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const queryIndex = withoutHash.indexOf("?");
  const pathname =
    queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  const search = queryIndex >= 0 ? withoutHash.slice(queryIndex) : "";

  const resolved = resolveLegacyPath(pathname);
  if (!resolved) return href;

  if (resolved.includes("?")) {
    return `${resolved}${hash}`;
  }

  return `${resolved}${search}${hash}`;
}
