import Link from "next/link";
import { categoryPath, ROUTES } from "@/lib/routes";
import { getCategoryHeroImage } from "@/lib/categoryImages";
import Reveal from "@/components/layout/Reveal";

const BENTO_CATEGORIES = [
  {
    slug: "guitars",
    title: "Guitars",
    desc: "Acoustic, electric & bass",
    size: "large" as const,
  },
  {
    slug: "studio-recording",
    title: "Studio",
    desc: "Interfaces & monitors",
    size: "small" as const,
  },
  {
    slug: "drums-percussion",
    title: "Drums",
    desc: "Kits & percussion",
    size: "small" as const,
  },
  {
    slug: "keyboards-synthesizers",
    title: "Keys",
    desc: "Synths & pianos",
    size: "small" as const,
  },
  {
    slug: "live-sound-lighting",
    title: "Live Sound",
    desc: "PA & lighting",
    size: "small" as const,
  },
  {
    slug: "software-plug-ins",
    title: "Software",
    desc: "DAWs & plug-ins",
    size: "small" as const,
  },
] as const;

export default function CategoryBento() {
  return (
    <Reveal as="section" className="category-bento">
      <div className="category-bento__header">
        <p className="category-bento__eyebrow premium-section-eyebrow">Shop by category</p>
        <h2 className="category-bento__title">Find your sound</h2>
        <p className="category-bento__subtitle">
          Curated departments for every stage — from bedroom studio to main stage.
        </p>
      </div>

      <div className="category-bento__grid">
        {BENTO_CATEGORIES.map((cat, index) => (
          <Reveal
            key={cat.slug}
            className={`category-bento__tile category-bento__tile--${cat.size}`}
            delay={index * 60}
          >
            <Link href={categoryPath(cat.slug)} className="category-bento__link">
              <img
                src={getCategoryHeroImage(cat.slug)}
                alt=""
                className="category-bento__image"
                loading="lazy"
              />
              <div className="category-bento__overlay" />
              <div className="category-bento__content">
                <h3 className="category-bento__name">{cat.title}</h3>
                <p className="category-bento__desc">{cat.desc}</p>
                <span className="category-bento__shop">
                  Shop now
                  <span aria-hidden>→</span>
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>

      <div className="category-bento__cta-wrap">
        <Link href={ROUTES.search} className="premium-btn premium-btn--outline">
          Browse all categories
        </Link>
      </div>
    </Reveal>
  );
}
