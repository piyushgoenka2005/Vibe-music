"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { CATEGORY_BENTO_ITEMS, type CategoryBentoItem } from "@/data/categoryBento";
import { useHydrationSafeReducedMotion } from "@/hooks/useHydrationSafeReducedMotion";
import { categoryPath, ROUTES } from "@/lib/routes";
import CategoryBentoImage from "@/components/home/CategoryBentoImage";

function bentoIndexStyle(index: number): CSSProperties {
  return { "--bento-index": String(index) } as CSSProperties;
}

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const headerVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: EASE_OUT },
  },
};

const gridVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09, delayChildren: 0.12 },
  },
};

const tileVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.72, ease: EASE_OUT },
  },
};

function tileClassName(cat: CategoryBentoItem): string {
  const classes = [
    "category-bento__tile",
    `category-bento__tile--${cat.size}`,
    cat.variant === "hero-light" ? "category-bento__tile--hero-light" : "",
    cat.wide ? "category-bento__tile--wide" : "",
  ];
  return classes.filter(Boolean).join(" ");
}

function ExploreButton({ dark = false }: { dark?: boolean }) {
  return (
    <span
      className={`category-bento__explore${dark ? " category-bento__explore--hero" : ""}`}
    >
      <span className="category-bento__explore-text">Explore Category</span>
      <span className="category-bento__explore-icon" aria-hidden>
        <ArrowRight size={16} strokeWidth={2.25} />
      </span>
    </span>
  );
}

function CategoryMeta({
  cat,
  dark = false,
  compact = false,
}: {
  cat: CategoryBentoItem;
  dark?: boolean;
  compact?: boolean;
}) {
  return (
    <>
      {cat.badge ? (
        <span className={`category-bento__badge category-bento__badge--${cat.badge.toLowerCase()}`}>
          {cat.badge}
        </span>
      ) : null}
      <h3 className={`category-bento__name${dark ? " category-bento__name--hero" : ""}`}>
        {cat.title}
      </h3>
      <p className={`category-bento__desc${dark ? " category-bento__desc--hero" : ""}`}>
        {cat.desc}
      </p>
      {cat.productCount ? (
        <p className={`category-bento__count${dark ? " category-bento__count--hero" : ""}`}>
          {cat.productCount}
        </p>
      ) : null}
      {cat.brands && !compact ? (
        <p className={`category-bento__brands${dark ? " category-bento__brands--hero" : ""}`}>
          {cat.brands}
        </p>
      ) : null}
    </>
  );
}

function CategoryBentoHeroTile({
  cat,
  index,
  reduceMotion,
}: {
  cat: CategoryBentoItem;
  index: number;
  reduceMotion: boolean;
}) {
  return (
    <motion.article
      className={tileClassName(cat)}
      role="listitem"
      style={bentoIndexStyle(index)}
      variants={reduceMotion ? undefined : tileVariants}
    >
      <Link
        href={categoryPath(cat.slug)}
        className="category-bento__link category-bento__link--hero"
        aria-label={`Explore ${cat.title}: ${cat.desc}`}
      >
        <span className="category-bento__sweep" aria-hidden />
        <span className="category-bento__glow category-bento__glow--hero" aria-hidden />
        <div className="category-bento__hero-stage">
          <span className="category-bento__hero-spotlight" aria-hidden />
          <span className="category-bento__hero-floor" aria-hidden />
          <span className="category-bento__hero-reflection" aria-hidden />
          <div className="category-bento__hero-media">
            <CategoryBentoImage
              alt={cat.imageAlt}
              className="category-bento__image category-bento__image--hero"
              objectPosition={cat.imagePosition}
              priority
              sizes={cat.imageSizes}
              src={cat.image}
              srcSet={cat.imageSrcSet}
              variant="hero"
            />
          </div>
        </div>
        <div className="category-bento__hero-copy">
          <CategoryMeta cat={cat} dark />
          <ExploreButton dark />
        </div>
      </Link>
    </motion.article>
  );
}

function CategoryBentoCard({
  cat,
  index,
  reduceMotion,
}: {
  cat: CategoryBentoItem;
  index: number;
  reduceMotion: boolean;
}) {
  const wide = Boolean(cat.wide);

  return (
    <motion.article
      className={tileClassName(cat)}
      role="listitem"
      style={bentoIndexStyle(index)}
      variants={reduceMotion ? undefined : tileVariants}
    >
      <Link
        href={categoryPath(cat.slug)}
        className={`category-bento__link category-bento__link--card${wide ? " category-bento__link--wide" : ""}`}
        aria-label={`Explore ${cat.title}: ${cat.desc}`}
      >
        <span className="category-bento__sweep" aria-hidden />
        <span className="category-bento__glow" aria-hidden />
        <div className="category-bento__card-visual">
          <div className="category-bento__media">
            <CategoryBentoImage
              alt={cat.imageAlt}
              className="category-bento__image"
              loading="lazy"
              objectPosition={cat.imagePosition}
              sizes={cat.imageSizes}
              src={cat.image}
              srcSet={cat.imageSrcSet}
              variant="card"
            />
          </div>
        </div>
        <div className="category-bento__card-body">
          <CategoryMeta cat={cat} compact={!wide} />
          <ExploreButton />
        </div>
      </Link>
    </motion.article>
  );
}

export default function CategoryBentoShowcase() {
  const reduceMotion = useHydrationSafeReducedMotion();

  return (
    <section className="category-bento" aria-labelledby="category-bento-title">
      <div className="category-bento__atmosphere" aria-hidden>
        <span className="category-bento__grid-texture" />
        <span className="category-bento__noise" />
      </div>

      <div className="category-bento__inner">
        <motion.header
          className="category-bento__header"
          initial={reduceMotion ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={reduceMotion ? undefined : headerVariants}
        >
          <p className="category-bento__eyebrow">
            <span className="category-bento__eyebrow-line" aria-hidden />
            Shop by category
            <span className="category-bento__eyebrow-line" aria-hidden />
          </p>
          <h2 id="category-bento-title" className="category-bento__title">
            Find Your Sound
          </h2>
          <p className="category-bento__subtitle">
            Curated departments for every stage — from bedroom studio to main stage.
          </p>
        </motion.header>

        <div className="category-bento__showcase-scroll">
          <motion.div
            className="category-bento__grid"
            initial={reduceMotion ? false : "hidden"}
            role="list"
            variants={reduceMotion ? undefined : gridVariants}
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
          >
            {CATEGORY_BENTO_ITEMS.map((cat, index) =>
              cat.size === "large" ? (
                <CategoryBentoHeroTile
                  key={cat.slug}
                  cat={cat}
                  index={index}
                  reduceMotion={reduceMotion}
                />
              ) : (
                <CategoryBentoCard
                  key={cat.slug}
                  cat={cat}
                  index={index}
                  reduceMotion={reduceMotion}
                />
              )
            )}
          </motion.div>
        </div>

        <motion.div
          className="category-bento__cta-wrap"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.35 }}
          viewport={{ once: true }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        >
          <Link
            href={ROUTES.search}
            className="category-bento__browse-btn"
          >
            Browse all categories
            <ArrowRight aria-hidden size={18} strokeWidth={2.25} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
