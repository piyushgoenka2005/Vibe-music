"use client";

import Link from "next/link";
import { useState } from "react";
import type { MegaMenuItem } from "@/data/headerMegaMenu";
import type { MegaMenuLink } from "@/data/headerMegaMenu";

interface HeaderMegaMenuProps {
  menu: MegaMenuItem | null;
  open: boolean;
}

export default function HeaderMegaMenu({ menu, open }: HeaderMegaMenuProps) {
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  if (!menu) return null;

  const renderLinks = (links: MegaMenuLink[], parentKey = "") =>
    links.map((link) => {
      const linkKey = `${parentKey}${link.href}:${link.label}`;
      const hasChildren = Boolean(link.children?.length);
      return (
        <li
          key={linkKey}
          className="header-mega__link-item"
          onMouseEnter={() => setHoveredLink(linkKey)}
          onMouseLeave={() => setHoveredLink(null)}
        >
          <Link href={link.href} className="header-mega__link">
            {link.label}
            {hasChildren ? <span className="header-mega__link-indicator">›</span> : null}
          </Link>
          {hasChildren && hoveredLink === linkKey ? (
            <div className="header-mega__link-submenu" role="menu">
              <p className="header-mega__link-submenu-title">{link.label}</p>
              {renderLinks(link.children ?? [], `${linkKey}:`)}
            </div>
          ) : null}
        </li>
      );
    });

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
                <ul className="header-mega__links">{renderLinks(column.links)}</ul>
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
