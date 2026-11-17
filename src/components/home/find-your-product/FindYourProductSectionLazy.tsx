import { Suspense } from "react";
import FindYourProductSection from "@/components/home/find-your-product/FindYourProductSection";
import type { ResolvedHomepageSection } from "@/types/homepage";

export default function FindYourProductSectionLazy({
  section,
}: {
  section?: ResolvedHomepageSection;
} = {}) {
  return (
    <Suspense fallback={null}>
      <FindYourProductSection section={section} />
    </Suspense>
  );
}
