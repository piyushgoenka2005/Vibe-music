const STACK_KEY = "vibe:nav-stack";
const BACK_INTENT_KEY = "vibe:nav-back-intent";
const MAX_STACK = 40;

export type StorefrontNavEntry = {
  path: string;
};

function readStack(): StorefrontNavEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STACK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is StorefrontNavEntry =>
        Boolean(entry) &&
        typeof entry === "object" &&
        typeof (entry as StorefrontNavEntry).path === "string"
    );
  } catch {
    return [];
  }
}

/** Paths from the persisted in-app nav stack (newest last). */
export function getStorefrontNavStackPaths(): string[] {
  return readStack().map((entry) => entry.path);
}

function writeStack(stack: StorefrontNavEntry[]) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STACK_KEY, JSON.stringify(stack.slice(-MAX_STACK)));
  } catch {
    /* quota / private mode */
  }
}

export function currentStorefrontPath(): string {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}`;
}

function notifyStackChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("vibe:nav-stack"));
}

/** Record a forward navigation (same path twice is ignored). */
export function recordStorefrontNavigation(path: string, isBack = false): void {
  const stack = readStack();
  let next = stack;
  if (isBack) {
    const index = stack.map((entry) => entry.path).lastIndexOf(path);
    next = index === -1 ? stack : stack.slice(0, index + 1);
  } else if (stack[stack.length - 1]?.path !== path) {
    next = [...stack, { path }];
  }
  if (next !== stack) {
    writeStack(next);
  }
  notifyStackChange();
}

export function getPreviousStorefrontPath(): string | null {
  const stack = readStack();
  if (stack.length >= 2) {
    return stack[stack.length - 2]?.path ?? null;
  }

  // Cold stack (hard refresh / direct open): same-origin referrer is the best hint.
  if (typeof document === "undefined") return null;
  try {
    if (!document.referrer) return null;
    const ref = new URL(document.referrer);
    if (ref.origin !== window.location.origin) return null;
    const path = `${ref.pathname}${ref.search}`;
    if (!path || path === currentStorefrontPath()) return null;
    return path;
  } catch {
    return null;
  }
}

export function canGoStorefrontBack(): boolean {
  return getPreviousStorefrontPath() != null;
}

/**
 * Mark the next route change as an in-app "back" so scroll restore runs
 * even when we navigate with router.push (browser history may not match).
 */
export function markStorefrontBackIntent(targetPath: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(BACK_INTENT_KEY, targetPath);
  } catch {
    /* ignore */
  }
}

/** Peek without consuming — survives React Strict Mode double-mount. */
export function peekStorefrontBackIntent(path: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(BACK_INTENT_KEY) === path;
  } catch {
    return false;
  }
}

/** Clear intentional back marker after restore has started. */
export function clearStorefrontBackIntent(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(BACK_INTENT_KEY);
  } catch {
    /* ignore */
  }
}

/** Returns true once if this navigation was an intentional storefront back. */
export function consumeStorefrontBackIntent(path: string): boolean {
  if (!peekStorefrontBackIntent(path)) return false;
  clearStorefrontBackIntent();
  return true;
}

/** Truncate the stack to `path` (used when initiating back). */
export function rewindStorefrontStackTo(path: string): void {
  recordStorefrontNavigation(path, true);
}

/** Sensible parent when the in-app history stack is empty. */
export function defaultStorefrontBackHref(pathname: string): string {
  if (pathname.startsWith("/product/")) return "/";
  if (pathname.startsWith("/category/")) return "/";
  if (pathname.startsWith("/search/results")) return "/search";
  if (pathname.startsWith("/search")) return "/";
  if (pathname.startsWith("/cart")) return "/";
  if (pathname.startsWith("/checkout")) return "/cart";
  if (pathname.startsWith("/account")) return "/";
  if (pathname.startsWith("/deals")) return "/";
  if (pathname.startsWith("/used")) return "/";
  if (pathname.startsWith("/brands")) return "/";
  if (pathname.startsWith("/blog")) return "/";
  return "/";
}
