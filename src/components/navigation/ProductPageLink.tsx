"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, type ComponentProps } from "react";
import { hardNavigateToHref } from "@/lib/navigation/hardNavigate";

interface ProductPageLinkProps extends ComponentProps<typeof Link> {
  hardNavigate?: boolean;
}

function useSafeRouter() {
  try {
    return useRouter();
  } catch {
    return null;
  }
}

/**
 * Fast client navigation for PDP with prefetch enabled.
 * Soft navigates instantly without full document reload.
 */
export default function ProductPageLink({
  href,
  onClick,
  onMouseEnter,
  onPointerDown,
  onTouchStart,
  onFocus,
  prefetch = true,
  hardNavigate = false,
  ...rest
}: ProductPageLinkProps) {
  const router = useSafeRouter();

  const handleWarmup = useCallback(() => {
    try {
      if (!router || !href) return;
      const target =
        typeof href === "string"
          ? href
          : typeof href === "object" && href.pathname
            ? `${href.pathname}${href.search ?? ""}`
            : "";
      if (target && !target.startsWith("#") && !target.startsWith("http")) {
        router.prefetch(target);
      }
    } catch {
      // Best-effort prefetch
    }
  }, [href, router]);

  return (
    <Link
      href={href}
      prefetch={prefetch}
      onMouseEnter={(e) => {
        handleWarmup();
        onMouseEnter?.(e);
      }}
      onPointerDown={(e) => {
        handleWarmup();
        onPointerDown?.(e);
      }}
      onTouchStart={(e) => {
        handleWarmup();
        onTouchStart?.(e);
      }}
      onFocus={(e) => {
        handleWarmup();
        onFocus?.(e);
      }}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (hardNavigate) {
          hardNavigateToHref(event, href);
        }
      }}
      {...rest}
    />
  );
}
