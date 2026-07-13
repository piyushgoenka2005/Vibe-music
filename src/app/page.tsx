import HomePage from "@/components/home/HomePage";

/** Cache rendered homepage HTML for 60s — faster repeat visits in production. */
export const revalidate = 60;

export default function Home() {
  // LCP image priority is set on HomepageBannerHero via next/image —
  // avoid a second raw preload that races the optimized `/_next/image` URL.
  return <HomePage />;
}
