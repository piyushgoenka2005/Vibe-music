import HomepageBannerHero from "@/components/home/homepage-banner-hero/HomepageBannerHero";
import { resolveHomepageBannerSlides } from "@/lib/server/homepageBannerSlides";

export default async function HomepageBannerHeroSection() {
  const slides = await resolveHomepageBannerSlides();
  return <HomepageBannerHero slides={slides} />;
}
