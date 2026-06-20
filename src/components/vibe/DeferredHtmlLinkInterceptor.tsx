"use client";

import dynamic from "next/dynamic";

const HtmlLinkInterceptor = dynamic(
  () => import("@/components/vibe/HtmlLinkInterceptor"),
  { ssr: false, loading: () => null }
);

export default HtmlLinkInterceptor;
