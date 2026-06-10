export interface NewAndNotableItem {
  id: string;
  href: string;
  label: string;
  headline: string;
  imageSrc: string;
  imageAlt: string;
}

export interface NewAndNotableContent {
  sliderId: string;
  accentLabel: string;
  heading: string;
  items: NewAndNotableItem[];
}

const PROMO =
  "promo_creative=3up_new_notable_npi&promo_id=promotion_drum_month_2026&promo_name=promotion_drum_month_2026&promo_position=takeover";

function promoImg(filename: string): string {
  return `https://media.vibemusic.in/m/promotions/2026/0603-Drum-Month/homepage/NewandNotable/${filename}?format=webp&optimize=low`;
}

export const NEW_AND_NOTABLE: NewAndNotableContent = {
  sliderId: "tile-block-multi-1",
  accentLabel: "Drum Month",
  heading: "New & Notable",
  items: [
    {
      id: "GK6514SWMP",
      href: `/store/detail/GK6514SWMP--slingerland-gene-krupa-radio-king-solid-maple-snare-drum-6.5-inches-by-14-inches-white-marine-pearl?${PROMO}`,
      label: "Artist Tribute Snare",
      headline: "NEW  |  Slingerland Gene Krupa Radio King Snare",
      imageSrc: promoImg(
        "0603-DrumMonth-GK6514SWMP-HPNewNoteable-1200x1200.jpg"
      ),
      imageAlt: "Slingerland Gene Krupa Radio King Solid Maple Snare Drum",
    },
    {
      id: "DWCP9700XIL",
      href: `/dw-9000/series?sb=newest&${PROMO}`,
      label: "Innovative Premium Hardware",
      headline: "NEW  |  DW 9000X ",
      imageSrc: promoImg(
        "0603-DrumMonth-DWCP9700XIL-HPNewNoteable-1200x1200.jpg"
      ),
      imageAlt: "DW 9000 series",
    },
    {
      id: "EF3BSet",
      href: `https://www.vibemusic.in/store/manufacturer/EFNOTE?${PROMO}`,
      label: "Natural Drum Response",
      headline: "NOW AVAILABLE  |  EFNOTE Electronic Drums",
      imageSrc: promoImg("0603-DrumMonth-EF3BSet-HPNewNoteable-1200x1200.jpg"),
      imageAlt: "EF3BSet Electronic Drum Set",
    },
    {
      id: "CSFX",
      href: `https://www.vibemusic.in/store/manufacturer/Istanbul_Agop?${PROMO}`,
      label: "Hand Hammered & Tuned",
      headline: "NOW AVAILABLE  |  Istanbul Agop Cymbals",
      imageSrc: promoImg("0603-DrumMonth-CSFX-HPNewNoteable-1200x1200.jpg"),
      imageAlt: "CSFX Clapstack",
    },
    {
      id: "SD5005",
      href: `https://www.vibemusic.in/sabian-stratus/series?sb=newest&${PROMO}`,
      label: "Dark Tone, Fast Response",
      headline: "NEW  |  Sabian Stratus Dry",
      imageSrc: promoImg("0603-DrumMonth-SD5005-HPNewNoteable-1200x1200.jpg"),
      imageAlt: "Sabian Stratus Dry",
    },
    {
      id: "MBS52RZSBSN",
      href: `/store/detail/MBS52RZSBSN--tama-starclassic-performer-mbs52rzs?${PROMO}`,
      label: "Exclusive Finish",
      headline: "NEW  |  Tama Starclassic Performer",
      imageSrc: promoImg(
        "0603-DrumMonth-MBS52RZSBSN-HPNewNoteable-1200x1200.jpg"
      ),
      imageAlt: "Tama Starclassic Performer",
    },
  ],
};
