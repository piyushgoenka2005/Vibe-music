import { WHY_SHOP_HEADING, WHY_SHOP_ITEMS } from "@/data/whyShop";
import Reveal from "@/components/layout/Reveal";
import RevealGroup from "@/components/layout/RevealGroup";
import WhyShopCard from "./WhyShopCard";

export default function WhyShopSection() {
  return (
    <section
      className="bg-[#F9FAFB] px-4 pt-12 pb-16 sm:px-5 sm:pt-14 sm:pb-20 md:px-6 md:pt-16"
      aria-labelledby="why-shop-title"
    >
      <div className="mx-auto w-full max-w-[1320px]">
        <Reveal as="header" className="text-center">
          <h2
            id="why-shop-title"
            className="m-0 mb-10 text-[2.25rem] font-bold leading-[1.05] tracking-[-0.04em] text-[#0F172A] sm:mb-12 sm:text-[2.75rem] md:mb-14 md:text-[3rem] lg:text-[3.5rem] xl:text-[3.75rem]"
          >
            {WHY_SHOP_HEADING}
          </h2>
        </Reveal>

        <RevealGroup
          as="div"
          role="list"
          className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-8"
        >
          {WHY_SHOP_ITEMS.map((item) => (
            <div key={item.id} role="listitem" className="h-full min-w-0">
              <WhyShopCard item={item} />
            </div>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
