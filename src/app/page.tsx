import HomePage from "@/components/home/HomePage";
import HomepageInitializer from "@/components/vibe/HomepageInitializer";
import HtmlSection from "@/components/vibe/HtmlSection";

export default function Home() {
  return (
    <>
      <HomePage />
      <HtmlSection file="footer" />
      <HomepageInitializer />
    </>
  );
}
