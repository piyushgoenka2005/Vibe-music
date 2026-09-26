import { ROUTES } from "@/lib/routes";

/** Header search should mirror `?q=` only on search routes; elsewhere stay empty. */
export function resolveHeaderSearchQuery(pathname: string, search: string = ""): string {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  const isSearchRoute =
    normalizedPath === ROUTES.search || normalizedPath.startsWith(ROUTES.searchResults);

  if (!isSearchRoute) return "";

  const query = new URLSearchParams(search).get("q")?.trim() ?? "";
  return query;
}
