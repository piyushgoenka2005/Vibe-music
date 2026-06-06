import HeroSection from "@/components/sections/HeroSection/HeroSection";
import HtmlSection from "@/components/sweetwater/HtmlSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <HtmlSection file="main" />
      <HtmlSection file="footer" />
    </>
  );
}
