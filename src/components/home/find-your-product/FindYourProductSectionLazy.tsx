"use client";

import dynamic from "next/dynamic";

const FindYourProductSection = dynamic(
  () => import("@/components/home/find-your-product/FindYourProductSection"),
  { loading: () => null }
);

export default FindYourProductSection;
