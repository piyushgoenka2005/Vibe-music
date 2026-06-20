"use client";

import dynamic from "next/dynamic";

const GlobalSearch = dynamic(() => import("@/components/search/GlobalSearch"), {
  ssr: false,
  loading: () => null,
});

export default GlobalSearch;
