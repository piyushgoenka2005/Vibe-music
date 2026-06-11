export interface SalesEngineerSlide {
  id: string;
  name: string;
  title: string;
  imageSrc: string;
  imageAlt: string;
}

export interface SalesEngineerContent {
  sectionId: string;
  heading: string;
  description: string;
  phoneDisplay: string;
  phoneHref: string;
  chatLabel: string;
  learnMoreHref: string;
  learnMoreLabel: string;
  slides: SalesEngineerSlide[];
}

function img(path: string): string {
  return `https://media.vibemusic.in/${path}`;
}

/** Homepage Sales Engineer block (`#sales-engineer`, generic anonymous layout). */
export const SALES_ENGINEER: SalesEngineerContent = {
  sectionId: "sales-engineer",
  heading: "Contact Your Sales Engineer",
  description:
    "When you call Vibe Music, you won't get an automated menu — you'll get a Sales Engineer who can help you find the right gear.",
  phoneDisplay: "+91-9876543210",
  phoneHref: "tel:+919876543210",
  chatLabel: "Chat",
  learnMoreHref: "/about/sales-engineers/",
  learnMoreLabel: "What is a Sales Engineer?",
  slides: [
    {
      id: "se-1",
      name: "Alex R.",
      title: "Sales Engineer",
      imageSrc: img(
        "m/careers/homepage_2025/hc-careers__se.jpg?format=webp&optimize=medium"
      ),
      imageAlt: "Vibe Music Sales Engineer",
    },
    {
      id: "se-2",
      name: "Jordan K.",
      title: "Sales Engineer",
      imageSrc: img(
        "m/careers/homepage_2025/hc-careers__guitar-repair.jpg?format=webp&optimize=medium"
      ),
      imageAlt: "Vibe Music Sales Engineer helping a customer",
    },
    {
      id: "se-3",
      name: "Morgan T.",
      title: "Sales Engineer",
      imageSrc: img(
        "m/careers/homepage_2025/hc-careers__tech-support.jpg?format=webp&optimize=medium"
      ),
      imageAlt: "Vibe Music Sales Engineer in tech support",
    },
    {
      id: "se-4",
      name: "Casey L.",
      title: "Sales Engineer",
      imageSrc: img(
        "m/include/footer/images/new-gear-day/15.jpg?format=webp"
      ),
      imageAlt: "Vibe Music Sales Engineer",
    },
  ],
};
