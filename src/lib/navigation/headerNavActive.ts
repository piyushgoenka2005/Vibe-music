import { ROUTES, categoryPath } from "@/lib/routes";

export function pathnameMatchesHref(pathname: string, href: string): boolean {
  if (!pathname || !href) return false;
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

export function isHeaderMegaMenuActive(
  pathname: string,
  categorySlug: string,
  searchCategory?: string | null,
): boolean {
  if (pathnameMatchesHref(pathname, categoryPath(categorySlug))) return true;
  if (pathname === ROUTES.searchResults && searchCategory === categorySlug) return true;
  return false;
}

export function isHeaderBrandsActive(pathname: string): boolean {
  if (pathnameMatchesHref(pathname, ROUTES.brands)) return true;
  if (pathname.startsWith(`${ROUTES.brands}/`)) return true;
  return false;
}

export function isHeaderDealsActive(pathname: string, searchQuery?: string | null): boolean {
  if (pathnameMatchesHref(pathname, ROUTES.deals)) return true;
  if (pathname === ROUTES.searchResults && searchQuery?.toLowerCase() === "deals") return true;
  return false;
}

export function isHeaderGuidesActive(pathname: string): boolean {
  return pathname === ROUTES.blog || pathname.startsWith(`${ROUTES.blog}/`);
}

export function isHeaderGrandPianoActive(pathname: string): boolean {
  return pathnameMatchesHref(pathname, ROUTES.gp9);
}

export function isHeaderProgramsActive(pathname: string): boolean {
  if (pathnameMatchesHref(pathname, ROUTES.programs)) return true;
  if (pathnameMatchesHref(pathname, ROUTES.rentals)) return true;
  if (pathnameMatchesHref(pathname, ROUTES.giveaway)) return true;
  if (pathnameMatchesHref(pathname, ROUTES.used)) return true;
  if (pathnameMatchesHref(pathname, ROUTES.gearExchange)) return true;
  if (pathnameMatchesHref(pathname, ROUTES.studios)) return true;
  if (pathnameMatchesHref(pathname, ROUTES.financing)) return true;
  return false;
}

export function isHeaderNavItemActive(options: {
  key: string;
  href: string;
  slug?: string;
  pathname: string;
  searchCategory?: string | null;
  searchQuery?: string | null;
}): boolean {
  const { key, href, slug, pathname, searchCategory, searchQuery } = options;

  if (key === "brands" || slug === "brands") return isHeaderBrandsActive(pathname);
  if (key === "deals") return isHeaderDealsActive(pathname, searchQuery);
  if (key === "guides") return isHeaderGuidesActive(pathname);
  if (key === "gp9") return isHeaderGrandPianoActive(pathname);
  if (key === "programs") return isHeaderProgramsActive(pathname);
  if (slug) return isHeaderMegaMenuActive(pathname, slug, searchCategory);

  return pathnameMatchesHref(pathname, href);
}
