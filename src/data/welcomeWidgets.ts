export interface WelcomeWidgetItem {
  href: string;
  title: string;
  imageSrc: string;
  imageAlt: string;
  hpSection: string;
  hpSlot: number;
  single?: boolean;
}

export interface WelcomeWidgetBlockCta {
  href: string;
  label: string;
  hpSection: string;
  hpSlot: string;
}

export interface WelcomeWidgetHeaderCta {
  href: string;
  hpSection: string;
  hpSlot: string;
}

export interface WelcomeWidget {
  headline: string;
  variant: "default" | "single-image";
  items: WelcomeWidgetItem[];
  blockCta?: WelcomeWidgetBlockCta;
  headerCta?: WelcomeWidgetHeaderCta;
}

export const WELCOME_WIDGETS: WelcomeWidget[] = [
  {
    headline: "Trending Categories",
    variant: "default",
    items: [
      {
        href: "https://www.vibemusic.in/c590--Solidbody_Guitars",
        title: "Solidbody Guitars",
        imageSrc:
          "/images/m/products/image/d55a7ca800bRKFzzzI1LkoPdgD1ymbxu18tLjQgI.png",
        imageAlt: "Solid Body Guitar",
        hpSection: "personalization-trending-categories",
        hpSlot: 1,
      },
      {
        href: "https://www.vibemusic.in/c581--4-string_Bass_Guitars",
        title: "4-string Basses",
        imageSrc:
          "/images/m/products/image/d8c2bbdeccm3Y090lrRNsEkbuepCOgoAPS5sINA5.png",
        imageAlt: "4-string Bass Guitar",
        hpSection: "personalization-trending-categories",
        hpSlot: 2,
      },
      {
        href: "https://www.vibemusic.in/c600--6-string_Acoustic_Guitars",
        title: "6-string Acoustic Guitars",
        imageSrc:
          "/images/m/products/image/00bd892379Sq23f6EBR8T8HvBcYs9YAESicgOubo.png",
        imageAlt: "6-string Acoustic Guitar",
        hpSection: "personalization-trending-categories",
        hpSlot: 3,
      },
      {
        href: "https://www.vibemusic.in/c625--Guitar_Combo_Amps",
        title: "Guitar Combo Amps",
        imageSrc:
          "/images/m/products/image/bfc31b3826CWeDbC6X6IuFyWAjODXQOkmAEnHPW7.jpg",
        imageAlt: "Guitar Combo Amp",
        hpSection: "personalization-trending-categories",
        hpSlot: 4,
      },
    ],
  },
  {
    headline: "NEW at Vibe Music!",
    variant: "single-image",
    items: [
      {
        href: "/c1661--Camera_Drones",
        title: "Camera Drones & Accessories",
        imageSrc:
          "/images/m/promotions/2026/0519-CameraDrone/0519-CameraDrone-HPwidget-1280x1280.jpg?width=400&format=webp",
        imageAlt: "Drone Promo Image",
        hpSection: "personalization-pedal-sale",
        hpSlot: 1,
        single: true,
      },
    ],
    blockCta: {
      href: "/c1661--Camera_Drones",
      label: "Shop Now",
      hpSection: "personalization-pedal-sale",
      hpSlot: "cta",
    },
  },
  {
    headline: "Top New Releases",
    variant: "default",
    items: [
      {
        href: "/store/detail/QCMini--neural-dsp-quad-cortex-mini-modeling-and-effects-processor-vibemusic-exclusive",
        title:
          "Neural DSP Quad Cortex Mini Modeling and Effects Processor, Vibe Music Exclusive",
        imageSrc:
          "/images/m/products/image/2cdf4bf761DZWztWMTXvRjefZynBO9RTcVrcDe0F.jpg?quality=82&width=400&format=webp",
        imageAlt: "QCMini product image",
        hpSection: "personalization-top-new-releases",
        hpSlot: 1,
      },
      {
        href: "/store/detail/MPCXL--akai-professional-mpc-xl-standalone-music-production-center",
        title: "MPC XL Standalone Music Production Center",
        imageSrc:
          "/images/m/products/image/c8a3b6d854ZVtrixT3WQK6sIeTk8tsybrVBTGmtr.jpg?quality=82&width=750&format=webp",
        imageAlt: "MPCXL product image",
        hpSection: "personalization-top-new-releases",
        hpSlot: 2,
      },
      {
        href: "/store/detail/MPCSample--akai-professional-mpc-sample-portable-groovebox",
        title: "MPC Sample Portable Groovebox",
        imageSrc:
          "/images/m/products/image/ce349f6ddbpWnBa7UdRlNlAUJ0fhyGkXuQUKCv6V.png?quality=82&width=400&format=webp",
        imageAlt: "MPCSample product image",
        hpSection: "personalization-top-new-releases",
        hpSlot: 3,
      },
      {
        href: "/store/detail/EIEX8CWNH--epiphone-explorer-80s-emg-electric-guitar-classic-white",
        title: "Epiphone Explorer '80s EMG Electric Guitar - Classic White",
        imageSrc:
          "/images/m/products/image/99d56d67a8OBzUAvGEO4hr1kGUeiRvAb4ni9AlYs.png?quality=82&height=400&format=webp",
        imageAlt: "EIEX8CWNH product image",
        hpSection: "personalization-top-new-releases",
        hpSlot: 4,
      },
    ],
    blockCta: {
      href: "/whats-new/",
      label: "Shop Now",
      hpSection: "personalization-top-new-releases",
      hpSlot: "cta",
    },
  },
  {
    headline: "Top Deals",
    variant: "default",
    headerCta: {
      href: "/dealzone",
      hpSection: "personalization-top-deals",
      hpSlot: "cta",
    },
    items: [
      {
        href: "/store/detail/K12.2--qsc-k12.2-2000w-12-inch-powered-speaker",
        title: "QSC K12.2 2,000-watt 12-inch Powered Speaker",
        imageSrc:
          "/images/m/products/image/6c9d9ecdf8KxbYZ66Y2FbzDnGWRM90iaN4Xlc84X.jpg?quality=82&height=400",
        imageAlt: "K12.2 product image",
        hpSection: "personalization-top-deals",
        hpSlot: 1,
      },
      {
        href: "/store/detail/ToneXPedal--ik-multimedia-tonex-pedal-amplifier-cabinet-pedal-modeler",
        title: "IK Multimedia TONEX Pedal Amplifier/Cabinet/Pedal Modeler",
        imageSrc:
          "/images/m/products/image/2f51071997sqxE3R3gW9W0nTbFJsJVxfRgVdqWBU.jpg?quality=82&width=400&format=webp",
        imageAlt: "ToneXPedal product image",
        hpSection: "personalization-top-deals",
        hpSlot: 2,
      },
      {
        href: "/store/detail/Qu16Chrome--allen-and-heath-qu-16-chrome-edition-digital-mixer?cond=Qu16ChromeB",
        title: "Allen & Heath Qu-16 16-channel Digital Mixer - Chrome Edition B-stock",
        imageSrc:
          "/images/m/products/image/052250cf73nOL3KRtEQEEmF9AByd84tPzCw64Ycd.jpg?quality=82&height=400",
        imageAlt: "Qu16ChromeB product image",
        hpSection: "personalization-top-deals",
        hpSlot: 3,
      },
      {
        href: "ApolloTXG2D",
        title:
          "Universal Audio Apollo Twin X DUO Gen 2 Thunderbolt Audio Interface with UAD DSP - Essentials+",
        imageSrc:
          "/images/m/products/image/b26fe96b93ir7YHzi8IW3B2sVDCy1V9ynJFdMPr2.jpg?quality=82&width=750&format=webp",
        imageAlt: "DG335PB product image",
        hpSection: "personalization-top-deals",
        hpSlot: 4,
      },
    ],
  },
  {
    headline: "Every Moment, Amplified",
    variant: "default",
    items: [
      {
        href: "https://www.vibemusic.in/c1003--Cameras",
        title: "Video & Cameras",
        imageSrc:
          "/images/m/promotions/2025/1201_CyberMonday/HPTakeover/Adjacency4Up/1201-CyberMonday-Adjacency-Canon-HPFeatured-1600x1600.jpg",
        imageAlt: "Person taking a picture with a camera",
        hpSection: "personalization-every-moment-amplified",
        hpSlot: 1,
      },
      {
        href: "/shop/home-audio-and-electronics/home-theater-audio-and-video/",
        title: "Home Audio",
        imageSrc:
          "/images/m/promotions/2025/1202_CyberWeek/Homepage-Takeover/Adjacency4Up/1202-CyberWeek-Adjacency-HA-HPFeatured-1600x1600.jpg",
        imageAlt: "Turntable image",
        hpSection: "personalization-every-moment-amplified",
        hpSlot: 2,
      },
      {
        href: "/c412--Headphones",
        title: "Headphones",
        imageSrc:
          "/images/m/promotions/2025/1202_CyberWeek/Homepage-Takeover/Adjacency4Up/1202-CyberWeek-Adjacency-Headphones-HPFeatured-1600x1600.jpg",
        imageAlt: "Man wearing studio headphones",
        hpSection: "personalization-every-moment-amplified",
        hpSlot: 3,
      },
      {
        href: "/c1088--Bluetooth_Portable__and__Party_Speakers",
        title: "Party Box & Bluetooth",
        imageSrc:
          "/images/m/promotions/2025/1202_CyberWeek/Homepage-Takeover/Adjacency4Up/1202-CyberWeek-Adjacency-Bluetooth-HPFeatured-1600x1600.jpg",
        imageAlt: "Bluetooth speaker",
        hpSection: "personalization-every-moment-amplified",
        hpSlot: 4,
      },
    ],
  },
];
