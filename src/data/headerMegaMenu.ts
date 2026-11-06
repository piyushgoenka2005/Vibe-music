import { categoryPath } from "@/lib/routes";
import { getMegaMenuFeaturedImage } from "@/lib/categoryImages";
import { slugify } from "@/lib/slug";

export interface MegaMenuLink {
  label: string;
  href: string;
  children?: MegaMenuLink[];
}

export interface MegaMenuColumn {
  heading: string;
  links: MegaMenuLink[];
}

export interface MegaMenuFeatured {
  title: string;
  href: string;
  image: string;
  imageClassName?: string;
}

export interface MegaMenuItem {
  slug: string;
  name: string;
  href: string;
  columns: MegaMenuColumn[];
  featured: MegaMenuFeatured[];
}

export function subCategoryPath(mainSlug: string, subSlugOrLabel: string): string {
  return `${categoryPath(mainSlug)}?subcat=${encodeURIComponent(slugify(subSlugOrLabel))}`;
}

/**
 * Route category/subcategory navigation links to genuine category listing pages
 * with subcategory query filters instead of search result pages.
 * @deprecated Use `subCategoryPath` directly.
 */
export function subSearch(slug: string, query: string): string {
  return subCategoryPath(slug, query);
}

function featured(
  slug: string,
  title: string,
  subcatOrQuery: string,
  variant?: string,
  imageClassName?: string,
): MegaMenuFeatured {
  return {
    title,
    href: subCategoryPath(slug, subcatOrQuery),
    image: getMegaMenuFeaturedImage(slug, variant),
    imageClassName,
  };
}

function featuredCategory(
  slug: string,
  title: string,
  variant?: string,
  imageClassName?: string,
): MegaMenuFeatured {
  return {
    title,
    href: categoryPath(slug),
    image: getMegaMenuFeaturedImage(slug, variant),
    imageClassName,
  };
}

export const HEADER_MEGA_MENUS: MegaMenuItem[] = [
  {
    slug: "guitars",
    name: "Guitars",
    href: categoryPath("guitars"),
    columns: [
      {
        heading: "Electric",
        links: [
          { label: "Solid body", href: subCategoryPath("guitars", "solid-body") },
          { label: "Semi-hollow", href: subCategoryPath("guitars", "semi-hollow") },
          { label: "Left-handed", href: subCategoryPath("guitars", "left-handed") },
          { label: "Starter packs", href: subCategoryPath("guitars", "starter-packs") },
        ],
      },
      {
        heading: "Acoustic",
        links: [
          { label: "Steel string", href: subCategoryPath("guitars", "acoustic-guitars") },
          { label: "Classical & nylon", href: subCategoryPath("guitars", "classical-guitars") },
          { label: "12-string", href: subCategoryPath("guitars", "12-string") },
          { label: "Travel guitars", href: subCategoryPath("guitars", "travel-guitars") },
        ],
      },
      {
        heading: "Bass & more",
        links: [
          { label: "Electric bass", href: subCategoryPath("guitars", "bass-guitars") },
          { label: "Amps & pedals", href: subCategoryPath("guitars", "guitar-amplifiers") },
          { label: "Strings & picks", href: subCategoryPath("guitars", "guitar-accessories") },
          { label: "Shop all guitars", href: categoryPath("guitars") },
        ],
      },
    ],
    featured: [
      featured("guitars", "Electric", "electric-guitars", "electric"),
      featured("guitars", "Acoustic", "acoustic-guitars", "acoustic"),
    ],
  },
  {
    slug: "studio-recording",
    name: "Studio",
    href: categoryPath("studio-recording"),
    columns: [
      {
        heading: "Recording",
        links: [
          {
            label: "Audio interfaces",
            href: subCategoryPath("studio-recording", "audio-interfaces"),
          },
          {
            label: "Studio monitors",
            href: subCategoryPath("studio-recording", "studio-monitors"),
          },
          { label: "Microphones", href: subCategoryPath("studio-recording", "microphones") },
          { label: "Headphones", href: subCategoryPath("studio-recording", "headphones") },
        ],
      },
      {
        heading: "Production",
        links: [
          {
            label: "MIDI controllers",
            href: subCategoryPath("studio-recording", "midi-controllers"),
          },
          {
            label: "Studio furniture",
            href: subCategoryPath("studio-recording", "studio-furniture"),
          },
          {
            label: "Acoustic treatment",
            href: subCategoryPath("studio-recording", "acoustic-treatment"),
          },
          { label: "Cables & stands", href: subCategoryPath("studio-recording", "cables-stands") },
        ],
      },
      {
        heading: "Shop studio",
        links: [
          {
            label: "Home studio bundles",
            href: subCategoryPath("studio-recording", "home-studio-bundles"),
          },
          { label: "Podcast gear", href: subCategoryPath("studio-recording", "podcast-gear") },
          { label: "USB mics", href: subCategoryPath("studio-recording", "usb-mics") },
          { label: "Shop all studio", href: categoryPath("studio-recording") },
        ],
      },
    ],
    featured: [
      featured("studio-recording", "Interfaces", "audio-interfaces"),
      featured("studio-recording", "Monitors", "studio-monitors", "monitors"),
    ],
  },
  {
    slug: "drums-percussion",
    name: "Drums",
    href: categoryPath("drums-percussion"),
    columns: [
      {
        heading: "Drum kits",
        links: [
          {
            label: "Acoustic kits",
            href: subCategoryPath("drums-percussion", "acoustic-drum-kits"),
          },
          {
            label: "Electronic kits",
            href: subCategoryPath("drums-percussion", "electronic-drum-kits"),
          },
          { label: "Snare drums", href: subCategoryPath("drums-percussion", "snare-drums") },
          { label: "Cymbals", href: subCategoryPath("drums-percussion", "cymbals") },
        ],
      },
      {
        heading: "Percussion",
        links: [
          {
            label: "Hand percussion",
            href: subCategoryPath("drums-percussion", "hand-percussion"),
          },
          { label: "Congas & bongos", href: subCategoryPath("drums-percussion", "congas-bongos") },
          { label: "Cajons", href: subCategoryPath("drums-percussion", "cajons") },
          { label: "Drum hardware", href: subCategoryPath("drums-percussion", "drum-hardware") },
        ],
      },
      {
        heading: "Accessories",
        links: [
          {
            label: "Sticks & brushes",
            href: subCategoryPath("drums-percussion", "sticks-brushes"),
          },
          { label: "Drum heads", href: subCategoryPath("drums-percussion", "drum-heads") },
          { label: "Practice pads", href: subCategoryPath("drums-percussion", "practice-pads") },
          { label: "Shop all drums", href: categoryPath("drums-percussion") },
        ],
      },
    ],
    featured: [
      featured("drums-percussion", "Drum kits", "acoustic-drum-kits"),
      featured("drums-percussion", "Electronic", "electronic-drum-kits", "electronic"),
    ],
  },
  {
    slug: "keyboards-synthesizers",
    name: "Keys",
    href: categoryPath("keyboards-synthesizers"),
    columns: [
      {
        heading: "Keyboards",
        links: [
          { label: "Shop all keys", href: categoryPath("keyboards-synthesizers") },
          {
            label: "Synthesizers",
            href: subCategoryPath("keyboards-synthesizers", "synthesizers"),
          },
          {
            label: "Stage keyboards",
            href: subCategoryPath("keyboards-synthesizers", "stage-keyboards"),
          },
          {
            label: "Performance pianos",
            href: subCategoryPath("keyboards-synthesizers", "performance-pianos"),
          },
        ],
      },
    ],
    featured: [
      featured("keyboards-synthesizers", "Synthesizers", "synthesizers", "keyboard"),
      featured("keyboards-synthesizers", "Stage keyboards", "stage-keyboards", "stage"),
    ],
  },
  {
    slug: "live-sound-lighting",
    name: "Live Sound",
    href: categoryPath("live-sound-lighting"),
    columns: [
      {
        heading: "PA systems",
        links: [
          {
            label: "Active PA speakers",
            href: subCategoryPath("live-sound-lighting", "active-pa-speakers"),
          },
          { label: "DSP speakers", href: subCategoryPath("live-sound-lighting", "dsp-speakers") },
          { label: "Shop all live sound", href: categoryPath("live-sound-lighting") },
        ],
      },
      {
        heading: "Stage essentials",
        links: [
          {
            label: "Live performance PA",
            href: subCategoryPath("live-sound-lighting", "live-performance-pa"),
          },
          {
            label: "DJ & karaoke PA",
            href: subCategoryPath("live-sound-lighting", "dj-karaoke-pa"),
          },
          { label: "Browse live sound", href: categoryPath("live-sound-lighting") },
        ],
      },
    ],
    featured: [
      featured("live-sound-lighting", "PA speakers", "pa-speakers"),
      featured("live-sound-lighting", "Active speakers", "active-speakers"),
    ],
  },
  {
    slug: "microphones-wireless",
    name: "Microphones",
    href: categoryPath("microphones-wireless"),
    columns: [
      {
        heading: "Wired mics",
        links: [
          { label: "Dynamic mics", href: subCategoryPath("microphones-wireless", "dynamic-mics") },
          {
            label: "Condenser mics",
            href: subCategoryPath("microphones-wireless", "condenser-mics"),
          },
          { label: "Shop all microphones", href: categoryPath("microphones-wireless") },
        ],
      },
      {
        heading: "Wireless",
        links: [
          {
            label: "Wireless systems",
            href: subCategoryPath("microphones-wireless", "wireless-systems"),
          },
          { label: "Browse microphones", href: categoryPath("microphones-wireless") },
        ],
      },
    ],
    featured: [
      featured("microphones-wireless", "Dynamic mics", "dynamic-mics"),
      featured("microphones-wireless", "Wireless", "wireless-systems"),
    ],
  },
  {
    slug: "dj-equipment",
    name: "DJ",
    href: categoryPath("dj-equipment"),
    columns: [
      {
        heading: "Mixers",
        links: [
          { label: "USB mixers", href: subCategoryPath("dj-equipment", "usb-mixers") },
          { label: "Bluetooth mixers", href: subCategoryPath("dj-equipment", "bluetooth-mixers") },
          {
            label: "Multi-channel consoles",
            href: subCategoryPath("dj-equipment", "mixer-consoles"),
          },
          { label: "Shop all DJ", href: categoryPath("dj-equipment") },
        ],
      },
      {
        heading: "Live & studio",
        links: [
          { label: "Karaoke mixers", href: subCategoryPath("dj-equipment", "karaoke-mixers") },
          { label: "PA mixers", href: subCategoryPath("dj-equipment", "pa-mixers") },
          { label: "Open-box mixers", href: subCategoryPath("dj-equipment", "open-box-mixers") },
          { label: "Browse DJ gear", href: categoryPath("dj-equipment") },
        ],
      },
    ],
    featured: [
      featured("dj-equipment", "Mixers", "mixers"),
      featured("dj-equipment", "Consoles", "consoles"),
    ],
  },
  {
    slug: "accessories",
    name: "Accessories",
    href: categoryPath("accessories"),
    columns: [
      {
        heading: "Cables",
        links: [
          {
            label: "Instrument cables",
            href: subCategoryPath("cables", "instrument-cables"),
          },
          { label: "XLR & mic cables", href: subCategoryPath("cables", "xlr-cables") },
          { label: "Patch cables", href: subCategoryPath("cables", "patch-cables") },
          {
            label: "Power & adapters",
            href: subCategoryPath("cables", "power-adapters"),
          },
        ],
      },
      {
        heading: "Cases & bags",
        links: [
          { label: "Guitar cases", href: subCategoryPath("accessories", "guitar-cases") },
          { label: "Keyboard bags", href: subCategoryPath("accessories", "keyboard-bags") },
          { label: "Rack cases", href: subCategoryPath("accessories", "rack-cases") },
          { label: "Pedalboards", href: subCategoryPath("accessories", "pedalboards") },
        ],
      },
      {
        heading: "Essentials",
        links: [
          { label: "Stands", href: subCategoryPath("accessories", "stands") },
          {
            label: "Tuners & metronomes",
            href: subCategoryPath("accessories", "tuners-metronomes"),
          },
          { label: "Care & cleaning", href: subCategoryPath("accessories", "care-cleaning") },
          { label: "Shop all accessories", href: categoryPath("accessories") },
        ],
      },
    ],
    featured: [
      featuredCategory("cables", "Cables", "cables"),
      featuredCategory("cases-bags", "Cases", "cases"),
    ],
  },
];

const menuEntries: [string, MegaMenuItem][] = [];
for (const menu of HEADER_MEGA_MENUS) {
  menuEntries.push([menu.slug, menu]);
  menuEntries.push([`cat_${menu.slug}`, menu]);
  menuEntries.push([`cat-${menu.slug}`, menu]);
}
const accessoriesMenu = HEADER_MEGA_MENUS.find((m) => m.slug === "accessories");
if (accessoriesMenu) {
  menuEntries.push(["cables-cases-accessories", accessoriesMenu]);
  menuEntries.push(["cat_accessories", accessoriesMenu]);
  menuEntries.push(["cat-13", accessoriesMenu]);
}

export const MEGA_MENU_BY_SLUG = Object.fromEntries(menuEntries) as Record<string, MegaMenuItem>;
