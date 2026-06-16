import HomePage from "@/components/home/HomePage";
import { listActiveBanners } from "@/lib/server/bannerService";

export default async function Home() {
  const banners = await listActiveBanners();

  return <HomePage banners={banners} />;
}
