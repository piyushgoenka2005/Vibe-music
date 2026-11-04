"use client";

import Link from "next/link";
import { useState } from "react";
import type { MegaMenuItem } from "@/data/headerMegaMenu";

interface HeaderMegaMenuProps {
  menu: MegaMenuItem | null;
  open: boolean;
}

export default function HeaderMegaMenu({ menu, open }: HeaderMegaMenuProps) {
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
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
                  {column.links.map((link) => {
                    const linkKey = `${link.href}:${link.label}`;
                    return (
                      <li
                        key={linkKey}
                        className="header-mega__link-item"
                        onMouseEnter={() => setHoveredLink(linkKey)}
                        onMouseLeave={() => setHoveredLink(null)}
                      >
                        <Link href={link.href} className="header-mega__link">
                          {link.label}
                        </Link>
                        {link.children && link.children.length > 0 && hoveredLink === linkKey ? (
                          <div className="header-mega__link-submenu" role="menu">
                            <p className="header-mega__link-submenu-title">{link.label}</p>
                            {link.children.map((child) => (
                              <Link
                                key={`${child.href}:${child.label}`}
                                href={child.href}
                                className="header-mega__link-submenu-link"
                                role="menuitem"
                              >
                                {child.label}
                              </Link>
                            ))}
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div className="header-mega__featured">
            {menu.featured.map((card) => (
              <Link
                key={`${card.href}:${card.title}`}
                href={card.href}
                className="header-mega__card"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- mega-menu featured card art */}
                <img
                  src={card.image}
                  alt=""
                  className={`header-mega__card-image${card.imageClassName ? ` ${card.imageClassName}` : ""}`}
                  loading="lazy"
                />
                <span className="header-mega__card-label">{card.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
