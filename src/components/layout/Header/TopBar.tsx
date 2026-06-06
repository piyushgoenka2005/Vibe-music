import Link from "next/link";
import { BLACK_BAR_LINKS, BLACK_BAR_LOGOS } from "@/lib/constants";

export default function TopBar() {
  return (
    <section
      className="border-b border-[var(--grey10)]"
      style={{ backgroundColor: "var(--black-bar-bg)", color: "var(--black-bar-text)" }}
    >
      <div className="sw-container flex h-9 items-center justify-between gap-4 overflow-x-auto text-[13px]">
        <div className="flex shrink-0 items-center gap-5">
          {BLACK_BAR_LOGOS.map((logo) => (
            <Link
              key={logo.label}
              href={logo.href}
              className={`whitespace-nowrap transition-colors hover:text-[var(--blue)] ${
                logo.active
                  ? "font-semibold text-[var(--grey100)]"
                  : "text-[var(--grey60)]"
              }`}
            >
              {logo.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-5 lg:flex">
          {BLACK_BAR_LINKS.map((link) => (
            <Link
              key={link}
              href="#"
              className="whitespace-nowrap text-[var(--grey60)] transition-colors hover:text-[var(--blue)]"
            >
              {link}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
