import HomepageInitializer from "@/components/vibe/HomepageInitializer";
import HtmlSection from "@/components/vibe/HtmlSection";

export default function Home() {
  return (
    <>
      <HtmlSection file="header" />
      <HtmlSection file="main" />
      <HtmlSection file="footer" />
      <HomepageInitializer />
    </>
  );
}
