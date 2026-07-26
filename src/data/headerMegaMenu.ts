import { ROUTES, categoryPath } from "@/lib/routes";
import { getMegaMenuFeaturedImage } from "@/lib/categoryImages";

export interface MegaMenuLink {
  label: string;
  href: string;
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

function subSearch(slug: string, query: string): string {
  return `${ROUTES.searchResults}?q=${encodeURIComponent(query)}&category=${slug}`;
}

function featured(
  slug: string,
  title: string,
  query: string,
  variant?: string,
  imageClassName?: string
): MegaMenuFeatured {
  return {
    title,
    href: subSearch(slug, query),
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
          { label: "Solid body", href: subSearch("guitars", "solid body electric") },
          { label: "Semi-hollow", href: subSearch("guitars", "semi hollow") },
          { label: "Left-handed", href: subSearch("guitars", "left handed guitar") },
          { label: "Starter packs", href: subSearch("guitars", "electric guitar pack") },
        ],
      },
      {
        heading: "Acoustic",
        links: [
          { label: "Steel string", href: subSearch("guitars", "acoustic steel") },
          { label: "Classical & nylon", href: subSearch("guitars", "classical guitar") },
          { label: "12-string", href: subSearch("guitars", "12 string") },
          { label: "Travel guitars", href: subSearch("guitars", "travel guitar") },
        ],
      },
      {
        heading: "Bass & more",
        links: [
          { label: "Electric bass", href: subSearch("guitars", "bass guitar") },
          { label: "Amps & pedals", href: subSearch("guitars", "guitar amp") },
          { label: "Strings & picks", href: subSearch("guitars", "guitar strings") },
          { label: "Shop all guitars", href: categoryPath("guitars") },
        ],
      },
    ],
    featured: [
      featured("guitars", "Electric", "electric guitar", "electric"),
      featured("guitars", "Acoustic", "acoustic guitar", "acoustic"),
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
          { label: "Audio interfaces", href: subSearch("studio-recording", "audio interface") },
          { label: "Studio monitors", href: subSearch("studio-recording", "studio monitor") },
          { label: "Microphones", href: subSearch("studio-recording", "condenser mic") },
          { label: "Headphones", href: subSearch("studio-recording", "studio headphones") },
        ],
      },
      {
        heading: "Production",
        links: [
          { label: "MIDI controllers", href: subSearch("studio-recording", "midi controller") },
          { label: "Studio furniture", href: subSearch("studio-recording", "studio desk") },
          { label: "Acoustic treatment", href: subSearch("studio-recording", "acoustic panel") },
          { label: "Cables & stands", href: subSearch("studio-recording", "mic stand") },
        ],
      },
      {
        heading: "Shop studio",
        links: [
          { label: "Home studio bundles", href: subSearch("studio-recording", "home studio bundle") },
          { label: "Podcast gear", href: subSearch("studio-recording", "podcast") },
          { label: "USB mics", href: subSearch("studio-recording", "usb microphone") },
          { label: "Shop all studio", href: categoryPath("studio-recording") },
        ],
      },
    ],
    featured: [
      featured("studio-recording", "Interfaces", "audio interface"),
      featured("studio-recording", "Monitors", "studio monitor", "monitors"),
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
          { label: "Acoustic kits", href: subSearch("drums-percussion", "acoustic drum kit") },
          { label: "Electronic kits", href: subSearch("drums-percussion", "electronic drum") },
          { label: "Snare drums", href: subSearch("drums-percussion", "snare drum") },
          { label: "Cymbals", href: subSearch("drums-percussion", "cymbal") },
        ],
      },
      {
        heading: "Percussion",
        links: [
          { label: "Hand percussion", href: subSearch("drums-percussion", "hand percussion") },
          { label: "Congas & bongos", href: subSearch("drums-percussion", "conga") },
          { label: "Cajons", href: subSearch("drums-percussion", "cajon") },
          { label: "Drum hardware", href: subSearch("drums-percussion", "drum hardware") },
        ],
      },
      {
        heading: "Accessories",
        links: [
          { label: "Sticks & brushes", href: subSearch("drums-percussion", "drum sticks") },
          { label: "Drum heads", href: subSearch("drums-percussion", "drum head") },
          { label: "Practice pads", href: subSearch("drums-percussion", "practice pad") },
          { label: "Shop all drums", href: categoryPath("drums-percussion") },
        ],
      },
    ],
    featured: [
      featured("drums-percussion", "Drum kits", "drum kit"),
      featured("drums-percussion", "Electronic", "electronic drum", "electronic"),
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
          { label: "Digital pianos", href: subSearch("keyboards-synthesizers", "digital piano") },
          { label: "Stage pianos", href: subSearch("keyboards-synthesizers", "stage piano") },
          { label: "Arranger keyboards", href: subSearch("keyboards-synthesizers", "arranger") },
          { label: "MIDI keyboards", href: subSearch("keyboards-synthesizers", "midi keyboard") },
        ],
      },
      {
        heading: "Synths",
        links: [
          { label: "Analog synths", href: subSearch("keyboards-synthesizers", "analog synth") },
          { label: "Workstations", href: subSearch("keyboards-synthesizers", "workstation") },
          { label: "Groove boxes", href: subSearch("keyboards-synthesizers", "groovebox") },
          { label: "Modules & racks", href: subSearch("keyboards-synthesizers", "synth module") },
        ],
      },
      {
        heading: "Essentials",
        links: [
          { label: "Keyboard stands", href: subSearch("keyboards-synthesizers", "keyboard stand") },
          { label: "Pedals & benches", href: subSearch("keyboards-synthesizers", "sustain pedal") },
          { label: "Cases & bags", href: subSearch("keyboards-synthesizers", "keyboard bag") },
          { label: "Shop all keys", href: categoryPath("keyboards-synthesizers") },
        ],
      },
    ],
    featured: [
      featured("keyboards-synthesizers", "Digital pianos", "digital piano"),
      featured("keyboards-synthesizers", "Synthesizers", "synthesizer", "synthesizer"),
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
          { label: "Active PA speakers", href: subSearch("live-sound-lighting", "PA speaker") },
          { label: "DSP speakers", href: subSearch("live-sound-lighting", "DSP") },
          { label: "Shop all live sound", href: categoryPath("live-sound-lighting") },
        ],
      },
      {
        heading: "Stage essentials",
        links: [
          { label: "Live performance PA", href: categoryPath("live-sound-lighting") },
          { label: "DJ & karaoke PA", href: subSearch("live-sound-lighting", "DJ") },
          { label: "Browse live sound", href: categoryPath("live-sound-lighting") },
        ],
      },
    ],
    featured: [
      featured("live-sound-lighting", "PA speakers", "PA speaker"),
      featured("live-sound-lighting", "Active speakers", "active speaker"),
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
          { label: "Dynamic mics", href: subSearch("microphones-wireless", "dynamic mic") },
          { label: "Condenser mics", href: subSearch("microphones-wireless", "condenser mic") },
          { label: "Shop all microphones", href: categoryPath("microphones-wireless") },
        ],
      },
      {
        heading: "Wireless",
        links: [
          { label: "Wireless systems", href: subSearch("microphones-wireless", "wireless") },
          { label: "Browse microphones", href: categoryPath("microphones-wireless") },
        ],
      },
    ],
    featured: [
      featured("microphones-wireless", "Dynamic mics", "dynamic mic"),
      featured("microphones-wireless", "Wireless", "wireless mic"),
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
          { label: "USB mixers", href: subSearch("dj-equipment", "USB mixer") },
          { label: "Bluetooth mixers", href: subSearch("dj-equipment", "Bluetooth mixer") },
          { label: "Multi-channel consoles", href: subSearch("dj-equipment", "mixer console") },
          { label: "Shop all DJ", href: categoryPath("dj-equipment") },
        ],
      },
      {
        heading: "Live & studio",
        links: [
          { label: "Karaoke mixers", href: subSearch("dj-equipment", "karaoke") },
          { label: "PA mixers", href: subSearch("dj-equipment", "PA mixer") },
          { label: "Open-box mixers", href: subSearch("dj-equipment", "open box") },
          { label: "Browse DJ gear", href: categoryPath("dj-equipment") },
        ],
      },
    ],
    featured: [
      featured("dj-equipment", "Mixers", "mixer"),
      featured("dj-equipment", "Consoles", "console"),
    ],
  },
  {
    slug: "cables-cases-accessories",
    name: "Accessories",
    href: categoryPath("cables-cases-accessories"),
    columns: [
      {
        heading: "Cables",
        links: [
          { label: "Instrument cables", href: subSearch("cables-cases-accessories", "instrument cable") },
          { label: "XLR & mic cables", href: subSearch("cables-cases-accessories", "xlr cable") },
          { label: "Patch cables", href: subSearch("cables-cases-accessories", "patch cable") },
          { label: "Power & adapters", href: subSearch("cables-cases-accessories", "power adapter") },
        ],
      },
      {
        heading: "Cases & bags",
        links: [
          { label: "Guitar cases", href: subSearch("cables-cases-accessories", "guitar case") },
          { label: "Keyboard bags", href: subSearch("cables-cases-accessories", "keyboard bag") },
          { label: "Rack cases", href: subSearch("cables-cases-accessories", "rack case") },
          { label: "Pedalboards", href: subSearch("cables-cases-accessories", "pedalboard") },
        ],
      },
      {
        heading: "Essentials",
        links: [
          { label: "Stands", href: subSearch("cables-cases-accessories", "mic stand") },
          { label: "Tuners & metronomes", href: subSearch("cables-cases-accessories", "tuner") },
          { label: "Care & cleaning", href: subSearch("cables-cases-accessories", "cleaning kit") },
          { label: "Shop all accessories", href: categoryPath("cables-cases-accessories") },
        ],
      },
    ],
    featured: [
      featured("cables-cases-accessories", "Cables", "instrument cable", "cables"),
      featured("cables-cases-accessories", "Cases", "guitar case", "cases"),
    ],
  },
];

export const MEGA_MENU_BY_SLUG = Object.fromEntries(
  HEADER_MEGA_MENUS.map((menu) => [menu.slug, menu])
) as Record<string, MegaMenuItem>;
