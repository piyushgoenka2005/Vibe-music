"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight, Sparkles } from "lucide-react";
import { categoryPath, ROUTES } from "@/lib/routes";
import type { MegaMenuItem } from "@/data/headerMegaMenu";

interface CategoryGroup {
  name: string;
  slug: string;
  subcategories: { name: string; slug: string }[];
}

const DEFAULT_CATEGORY_GROUPS: CategoryGroup[] = [
  {
    name: "Guitars",
    slug: "guitars",
    subcategories: [
      { name: "Acoustic Guitars", slug: "acoustic-guitars" },
      { name: "Electric Guitars", slug: "electric-guitars" },
      { name: "Semi-Acoustic", slug: "semi-acoustic-guitars" },
      { name: "Bass Guitars", slug: "bass-guitars" },
      { name: "Ukuleles & Violins", slug: "ukuleles-violins" },
    ],
  },
  {
    name: "Studio & Recording",
    slug: "studio-recording",
    subcategories: [
      { name: "Audio Interfaces", slug: "audio-interfaces" },
      { name: "Studio Monitors", slug: "studio-monitors" },
      { name: "Studio Headphones", slug: "studio-headphones" },
      { name: "Microphones", slug: "microphones" },
      { name: "Mixers & Consoles", slug: "mixers-consoles" },
    ],
  },
  {
    name: "Drums & Percussion",
    slug: "drums-percussion",
    subcategories: [
      { name: "Acoustic Drum Kits", slug: "acoustic-drum-kits" },
      { name: "Electronic Drum Kits", slug: "electronic-drum-kits" },
      { name: "Cymbals", slug: "cymbals" },
      { name: "Snare Drums", slug: "snare-drums" },
      { name: "Percussion & Hardware", slug: "drum-hardware" },
    ],
  },
  {
    name: "Keyboards & Pianos",
    slug: "keyboards-pianos",
    subcategories: [
      { name: "Digital Pianos", slug: "digital-pianos" },
      { name: "Portable Keyboards", slug: "portable-keyboards" },
      { name: "Synthesizers & Workstations", slug: "synthesizers" },
      { name: "MIDI Controllers", slug: "midi-controllers" },
      { name: "Grand Pianos", slug: "grand-pianos" },
    ],
  },
  {
    name: "Microphones & Wireless",
    slug: "microphones-wireless",
    subcategories: [
      { name: "Vocal Microphones", slug: "vocal-microphones" },
      { name: "Wireless Systems", slug: "wireless-systems" },
      { name: "USB & Podcasting", slug: "usb-microphones" },
      { name: "Instrument Mics", slug: "instrument-microphones" },
      { name: "Microphone Accessories", slug: "mic-accessories" },
    ],
  },
  {
    name: "Amplifiers & Effects",
    slug: "amplifiers-effects",
    subcategories: [
      { name: "Guitar Amps", slug: "guitar-amplifiers" },
      { name: "Bass Amps", slug: "bass-amplifiers" },
      { name: "Effect Pedals", slug: "effect-pedals" },
      { name: "Multi-effects Processors", slug: "multi-effects" },
      { name: "Acoustic Amps", slug: "acoustic-amplifiers" },
    ],
  },
];

interface AllCategoriesMegaMenuProps {
  open: boolean;
  menus?: MegaMenuItem[] | null;
  onClose?: () => void;
  onNavigate?: () => void;
}

export default function AllCategoriesMegaMenu({
  open,
  menus,
  onNavigate,
}: AllCategoriesMegaMenuProps) {
  if (!open) return null;

  const groups =
    menus && menus.length > 0
      ? menus.map((menu) => ({
          name: menu.name,
          slug: menu.slug,
          subcategories: menu.columns.flatMap((column) =>
            column.links
              .filter((link) => !link.label.toLowerCase().startsWith("shop all"))
              .map((link) => ({ name: link.label, slug: link.href })),
          ),
        }))
      : DEFAULT_CATEGORY_GROUPS;

  return (
    <div
      id="all-categories-mega-menu"
      className="all-cats-mega"
      role="region"
      aria-label="All Categories Navigation"
    >
      <div className="all-cats-mega__panel">
        <div className="all-cats-mega__inner">
          <div className="all-cats-mega__grid">
            {groups.map((group) => (
              <div key={group.slug} className="all-cats-mega__col">
                <Link
                  href={categoryPath(group.slug)}
                  className="all-cats-mega__heading-link"
                  onClick={onNavigate}
                >
                  <span className="all-cats-mega__heading">{group.name}</span>
                  <ChevronRight size={14} className="all-cats-mega__chevron" />
                </Link>
                <ul className="all-cats-mega__links">
                  {group.subcategories.map((sub) => (
                    <li key={sub.slug}>
                      <Link
                        href={sub.slug.startsWith("/") ? sub.slug : categoryPath(sub.slug)}
                        className="all-cats-mega__link"
                        onClick={onNavigate}
                      >
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link
                      href={group.slug.startsWith("/") ? group.slug : categoryPath(group.slug)}
                      className="all-cats-mega__link all-cats-mega__link--all"
                      onClick={onNavigate}
                    >
                      View all {group.name} &rarr;
                    </Link>
                  </li>
                </ul>
              </div>
            ))}
          </div>

          <div className="all-cats-mega__footer">
            <div className="all-cats-mega__footer-text">
              <Sparkles size={16} className="all-cats-mega__footer-icon" />
              <span>Explore our complete catalog of over 10,000+ premium musical instruments</span>
            </div>
            <Link
              href={ROUTES.categories}
              className="all-cats-mega__footer-cta"
              onClick={onNavigate}
            >
              <span>Explore All Categories</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
