"use client";

import Link from "next/link";
import { Menu, ShoppingCart, User } from "lucide-react";
import { PHONE } from "@/lib/constants";
import TopBar from "./TopBar";
import Navigation from "./Navigation";
import SearchBar from "./SearchBar";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white shadow-[0_0_10px_rgba(0,0,0,0.1)]">
      <TopBar />
      <div className="sw-container">
        <div className="flex min-h-[60px] flex-wrap items-center gap-0 md:min-h-[72px]">
          <button
            type="button"
            aria-label="Open menu"
            className="flex h-[60px] w-[42px] shrink-0 items-center justify-center md:hidden"
          >
            <Menu className="h-6 w-6 text-[var(--grey100)]" />
          </button>

          <div className="ml-2 flex h-[60px] shrink-0 items-center md:ml-0 md:mr-4 md:h-[72px] md:w-[190px]">
            <Link href="/" className="flex h-full items-center outline-offset-[-1px]">
              <span className="text-[28px] font-bold leading-none tracking-[-0.02em] text-[var(--blue)] md:text-[32px]">
                ViBE
                <sup className="ml-0.5 text-[10px] font-normal">®</sup>
              </span>
            </Link>
          </div>

          <div className="order-last w-full px-2 pb-2 md:order-none md:mx-4 md:flex md:flex-1 md:px-0 md:pb-0">
            <SearchBar />
          </div>

          <div className="hidden shrink-0 items-center lg:flex">
            <Link
              href={`tel:${PHONE.replace(/\D/g, "")}`}
              className="flex items-center px-4 transition-colors hover:bg-[var(--grey0)] hover:text-[var(--blue)]"
            >
              <div className="text-left">
                <span className="block text-[22px] font-semibold leading-none text-[var(--blue)]">
                  {PHONE}
                </span>
                <span className="mt-1 block text-[13px] text-[var(--grey100)]">
                  Talk to an expert!
                </span>
              </div>
            </Link>
          </div>

          <div className="ml-auto flex shrink-0 items-center">
            <Link
              href="/account"
              className="hidden h-[60px] w-[50px] items-center justify-center transition-colors hover:bg-[var(--grey0)] hover:text-[var(--blue)] md:flex md:h-[72px]"
              aria-label="Account"
            >
              <User className="h-6 w-6" strokeWidth={1.5} />
            </Link>

            <Link
              href="/cart"
              className="relative flex h-[60px] w-[68px] items-center justify-center md:h-[72px]"
              aria-label="Cart"
            >
              <ShoppingCart className="h-7 w-7 fill-[var(--grey100)] text-[var(--grey100)]" strokeWidth={0} />
              <span className="absolute left-[55%] top-[41%] flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-xs font-semibold text-white [text-shadow:1px_0_#3b7d1a,-1px_0_#3b7d1a,0_1px_#3b7d1a,0_-1px_#3b7d1a]">
                0
              </span>
            </Link>
          </div>
        </div>
      </div>

      <Navigation />
    </header>
  );
}
