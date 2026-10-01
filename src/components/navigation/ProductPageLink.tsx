"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { hardNavigateToHref } from "@/lib/navigation/hardNavigate";

type ProductPageLinkProps = ComponentProps<typeof Link>;

/** Product links use full navigation so PDP always loads (avoids stale homepage on failed soft nav). */
export default function ProductPageLink({
  href,
  onClick,
  prefetch = false,
  ...rest
}: ProductPageLinkProps) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        hardNavigateToHref(event, href);
      }}
      {...rest}
    />
  );
}
