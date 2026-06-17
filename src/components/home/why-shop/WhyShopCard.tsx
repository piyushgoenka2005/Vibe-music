import Link from "next/link";
import type { WhyShopItem } from "@/data/whyShop";
import { cn } from "@/lib/utils";
import WhyShopIcon from "./WhyShopIcons";

interface WhyShopCardProps {
  item: WhyShopItem;
  className?: string;
}

export default function WhyShopCard({ item, className }: WhyShopCardProps) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group flex h-full min-h-[220px] flex-col items-center text-center",
        "rounded-[20px] border border-[#E5E7EB] bg-white p-6 sm:min-h-[240px] sm:rounded-[24px] sm:p-7 lg:min-h-[260px] lg:p-8",
        "shadow-[0_4px_20px_rgba(0,0,0,0.04)]",
        "transition-[transform,box-shadow,border-color] duration-300 ease-out",
        "hover:-translate-y-1 hover:border-[#CBD5E1]",
        "hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#1253ED]",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        className
      )}
      aria-label={`${item.title}: ${item.description}`}
    >
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#E2E8F0] bg-[#F8FAFC] sm:h-16 sm:w-16 lg:h-[4.5rem] lg:w-[4.5rem]"
        aria-hidden
      >
        <WhyShopIcon iconId={item.iconId} />
      </div>

      <h3 className="mt-4 mb-2.5 w-full text-lg font-bold leading-[1.25] tracking-[-0.02em] text-[#0F172A] sm:mt-5 sm:mb-3 sm:text-xl lg:text-[1.375rem]">
        {item.title}
      </h3>

      <p className="m-0 w-full max-w-[18rem] px-1 text-[0.9375rem] leading-[1.7] text-[#64748B] sm:text-[15px] lg:max-w-[85%] lg:px-0 lg:text-base line-clamp-3">
        {item.description}
      </p>
    </Link>
  );
}
