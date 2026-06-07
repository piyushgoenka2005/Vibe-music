"use client";

import { Search } from "lucide-react";

export default function SearchBar() {
  return (
    <div className="relative w-full max-w-[1000px]">
      <form
        action="/products"
        className="relative h-10 w-full rounded-[3px] border border-[var(--grey10)] bg-[var(--grey0)]"
      >
        <button
          type="submit"
          aria-label="Submit search"
          className="absolute left-0 top-0 flex h-full w-10 items-center justify-center text-[var(--grey60)]"
        >
          <Search className="h-[22px] w-[22px]" strokeWidth={2} />
        </button>

        <input
          type="search"
          name="s"
          placeholder="Search for sweet gear"
          aria-label="Search for sweet gear"
          className="h-full w-full rounded-[3px] border-0 bg-transparent py-0 pl-10 pr-4 text-base text-[var(--grey100)] outline-none focus:shadow-[0_0_0_1px_var(--blue),inset_0_0_0_1px_var(--blue)]"
        />
      </form>
    </div>
  );
}
