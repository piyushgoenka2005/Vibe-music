"use client";

import { ChevronRight } from "lucide-react";

const promotions = [
  {
    title: "0% Financing",
    description: "Available on qualifying purchases",
  },
  {
    title: "Free Shipping",
    description: "On thousands of products",
  },
  {
    title: "Trade-In Program",
    description: "Upgrade your gear today",
  },
  {
    title: "Summer Sale",
    description: "Save up to 50%",
  },
];

export default function PromotionalBanner() {
  return (
    <section className="bg-[#0072ba] text-white">
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {promotions.map((promo) => (
            <button
              key={promo.title}
              className="
                flex
                items-center
                justify-between
                gap-4
                px-6
                py-4
                border-r
                border-white/20
                hover:bg-[#05629c]
                transition-colors
              "
            >
              <div className="text-left">
                <h3 className="font-semibold text-sm">
                  {promo.title}
                </h3>

                <p className="text-xs text-blue-100">
                  {promo.description}
                </p>
              </div>

              <ChevronRight className="w-4 h-4 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}