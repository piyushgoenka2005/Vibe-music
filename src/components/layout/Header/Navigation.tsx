import Link from "next/link";
import { NAV_ITEMS } from "@/lib/constants";

export default function Navigation() {
  return (
    <nav className="border-t border-[var(--grey10)] bg-white">
      <div className="sw-container">
        <ul className="flex h-11 items-stretch gap-0 overflow-x-auto text-[14px] font-normal text-[var(--grey100)]">
          {NAV_ITEMS.map((item) => (
            <li key={item} className="shrink-0">
              <Link
                href="#"
                className="flex h-full items-center whitespace-nowrap px-4 transition-colors hover:bg-[var(--grey0)] hover:text-[var(--blue)]"
              >
                {item}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
