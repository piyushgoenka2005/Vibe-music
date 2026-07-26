import { Suspense } from "react";
import FindYourProductSection from "@/components/home/find-your-product/FindYourProductSection";

export default function FindYourProductSectionLazy() {
  return (
    <Suspense fallback={null}>
      <FindYourProductSection />
    </Suspense>
  );
}
