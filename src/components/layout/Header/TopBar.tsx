import Link from "next/link";
import { BLACK_BAR_LINKS, BLACK_BAR_LOGOS } from "@/lib/constants";
import { ROUTES } from "@/lib/routes";

const LINK_HREFS: Record<string, string> = {
  Support: `${ROUTES.search}?q=support`,
  Financing: `${ROUTES.search}?q=financing`,
  Blog: `${ROUTES.search}?q=articles`,
};

export default function TopBar() {
  return (
    <div className="top-bar">
      <div className="container">
        <div className="top-bar-left">
          {BLACK_BAR_LOGOS.map((logo) => (
            <Link
              key={logo.label}
              href={logo.href}
              className={logo.active ? "active" : undefined}
            >
              {logo.label}
            </Link>
          ))}
        </div>

        <div className="top-bar-right">
          {BLACK_BAR_LINKS.map((link) => (
            <Link key={link} href={LINK_HREFS[link] ?? ROUTES.search}>
              {link}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
