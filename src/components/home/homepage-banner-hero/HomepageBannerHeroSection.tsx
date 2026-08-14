import HomepageBannerHeroLive from "@/components/home/homepage-banner-hero/HomepageBannerHeroLive";
import { resolveHomepageBannerSlides } from "@/lib/server/homepageBannerSlides";

export default async function HomepageBannerHeroSection() {
  const slides = await resolveHomepageBannerSlides();
  return <HomepageBannerHeroLive initialSlides={slides} />;
}
