import PopularCategories from "@/components/sections/PopularCategories/PopularCategories";
import HtmlChunk from "@/components/vibe/HtmlChunk";

export default function HomePage() {
  return (
    <>
      <HtmlChunk name="main-head" />
      <PopularCategories />
      <HtmlChunk name="main-tail" />
    </>
  );
}
