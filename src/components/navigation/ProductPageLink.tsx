"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { hardNavigateToHref } from "@/lib/navigation/hardNavigate";

interface ProductPageLinkProps extends ComponentProps<typeof Link> {
  hardNavigate?: boolean;
}

/**
 * Fast client navigation for PDP with prefetch enabled.
 * Soft navigates instantly without full document reload.
 */
export default function ProductPageLink({
  href,
  onClick,
  prefetch,
  hardNavigate = false,
  ...rest
}: ProductPageLinkProps) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
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
