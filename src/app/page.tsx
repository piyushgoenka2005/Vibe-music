import HomePage from "@/components/home/HomePage";
import HomepageInitializer from "@/components/vibe/HomepageInitializer";
import HtmlSection from "@/components/vibe/HtmlSection";
import { listActiveBanners } from "@/lib/server/bannerService";

export default async function Home() {
  const banners = await listActiveBanners();

  return (
    <>
      <HtmlSection file="header" />
      <HomePage banners={banners} />
      <HtmlSection file="footer" />
      <HomepageInitializer />
    </>
  );
}
