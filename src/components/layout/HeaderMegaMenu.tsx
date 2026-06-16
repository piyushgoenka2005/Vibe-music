"use client";

import Link from "next/link";
import type { MegaMenuItem } from "@/data/headerMegaMenu";

interface HeaderMegaMenuProps {
  menu: MegaMenuItem | null;
  open: boolean;
}

export default function HeaderMegaMenu({ menu, open }: HeaderMegaMenuProps) {
  if (!menu) return null;

  return (
    <div
      className={`header-mega${open ? " header-mega--open" : ""}`}
      role="region"
      aria-label={`${menu.name} menu`}
      aria-hidden={!open}
    >
      <div className="header-mega__panel">
        <div className="header-mega__inner">
          <div className="header-mega__columns">
            {menu.columns.map((column) => (
              <div key={column.heading} className="header-mega__column">
                <p className="header-mega__heading">{column.heading}</p>
                <ul className="header-mega__links">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="header-mega__link">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="header-mega__featured">
            {menu.featured.map((card) => (
              <Link key={card.href} href={card.href} className="header-mega__card">
                <img src={card.image} alt="" className="header-mega__card-image" loading="lazy" />
                <span className="header-mega__card-label">{card.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
