"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const widgets = [
  {
    headline: "Trending Categories",
    items: [
      { title: "Solidbody Guitars", image: "https://media.vibemusic.in/m/products/image/d55a7ca800bRKFzzzI1LkoPdgD1ymbxu18tLjQgI.png" },
      { title: "4-string Basses", image: "https://media.vibemusic.in/m/products/image/d8c2bbdeccm3Y090lrRNsEkbuepCOgoAPS5sINA5.png" },
      { title: "6-string Acoustic Guitars", image: "https://media.vibemusic.in/m/products/image/00bd892379Sq23f6EBR8T8HvBcYs9YAESicgOubo.png" },
      { title: "Guitar Combo Amps", image: "https://media.vibemusic.in/m/products/image/bfc31b3826CWeDbC6X6IuFyWAjODXQOkmAEnHPW7.jpg" },
    ],
  },
  {
    headline: "Open a ViBE Card",
    single: true,
    cta: "Apply Now",
    items: [
      {
        title: "Earn $50 in Bonus Bucks** Now thru June 8",
        image: "https://media.vibemusic.in/m/home/welcome-tiles/0203-OpenEarn-HPBanner-Slot2-940x820-square.webp",
      },
    ],
  },
  {
    headline: "NEW at ViBE!",
    single: true,
    cta: "Shop Now",
    items: [
      {
        title: "Camera Drones",
        image: "https://media.vibemusic.in/m/home/0817-gx-new-homepagetile.jpg?format=webp",
      },
    ],
  },
  {
    headline: "Top Deals",
    items: [
      { title: "IK Multimedia TONEX Pedal", image: "https://media.vibemusic.in/m/products/image/b26fe96b93ir7YHzi8IW3B2sVDCy1V9ynJFdMPr2.jpg?quality=82&width=400&format=webp" },
      { title: "Allen & Heath Qu-16 Mixer", image: "https://media.vibemusic.in/m/products/image/052250cf73nOL3KRtEQEEmF9AByd84tPzCw64Ycd.jpg?quality=82&height=400" },
      { title: "Universal Audio Apollo Twin X", image: "https://media.vibemusic.in/m/products/image/b26fe96b93ir7YHzi8IW3B2sVDCy1V9ynJFdMPr2.jpg?quality=82&width=750&format=webp" },
      { title: "Studio Headphones", image: "https://media.vibemusic.in/m/promotions/2025/1202_CyberWeek/Homepage-Takeover/Adjacency4Up/1202-CyberWeek-Adjacency-Headphones-HPFeatured-1600x1600.jpg" },
    ],
  },
];

export default function WelcomeSection() {
  return (
    <section className="sw-section border-b border-[var(--grey10)] bg-white">
      <div className="sw-container">
        <h2 className="mb-4 text-[1.875rem] font-semibold text-[var(--grey100)]">
          Welcome!
        </h2>

        <div className="relative">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Scroll Previous"
              className="hidden shrink-0 rounded-full border border-[var(--grey20)] p-0 text-[var(--grey100)] hover:bg-[var(--grey0)] md:flex"
            >
              <ChevronLeft className="h-10 w-10 p-2" />
            </button>

            <div className="scrollbar-minimal flex flex-1 gap-4 overflow-x-auto pb-2">
              {widgets.map((widget) => (
                <div
                  key={widget.headline}
                  className={`shrink-0 rounded border border-[var(--grey10)] bg-white ${
                    widget.single ? "w-[280px]" : "w-[320px]"
                  }`}
                >
                  <div className="p-4">
                    <p className="mb-3 text-[15px] font-semibold text-[var(--grey100)]">
                      {widget.headline}
                    </p>

                    <div className={`grid gap-3 ${widget.single ? "grid-cols-1" : "grid-cols-2"}`}>
                      {widget.items.map((item) => (
                        <Link key={item.title} href="#" className="group block">
                          <div className="mb-2 aspect-square overflow-hidden rounded bg-[var(--grey0)]">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="h-full w-full object-contain p-2 transition-transform group-hover:scale-105"
                            />
                          </div>
                          <p className="text-[13px] leading-snug text-[var(--grey100)] group-hover:text-[var(--blue)]">
                            {item.title}
                          </p>
                        </Link>
                      ))}
                    </div>

                    {widget.cta && (
                      <Link
                        href="#"
                        className="sw-btn sw-btn-blue mt-4 w-full text-sm"
                      >
                        {widget.cta}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              aria-label="Scroll Next"
              className="hidden shrink-0 rounded-full border border-[var(--grey20)] p-0 text-[var(--grey100)] hover:bg-[var(--grey0)] md:flex"
            >
              <ChevronRight className="h-10 w-10 p-2" />
            </button>
          </div>
        </div>

        <Link href="/account" className="homepage-btn__section-cta-outline blue">
          Login to Personalize
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10.5 9">
            <path d="M10.45 4.22a.62.62 0 0 0-.17-.25L6.53.22C6.46.14 6.37.1 6.28.05S6.1 0 6 0s-.19.02-.28.05-.18.1-.25.17a.72.72 0 0 0-.22.53.7.7 0 0 0 .22.53l2.46 2.47H.75a.75.75 0 0 0-.7.46.75.75 0 0 0 0 .58.73.73 0 0 0 .7.46h7.18L5.47 7.72l-.1.11-.07.14-.04.14-.01.14.01.14.04.14.07.14c.02.04.06.08.1.1A.69.69 0 0 0 6 9c.1.01.19 0 .28-.04s.18-.1.25-.17l3.75-3.75a.72.72 0 0 0 .22-.53.8.8 0 0 0-.05-.28z" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
