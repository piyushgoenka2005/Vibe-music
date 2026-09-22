"use client";

import type { ReactNode } from "react";
import type { ProductDetail } from "@/types/product";
import ProductDetailsPanel from "./ProductDetailsPanel";
import ProductReviewsSection from "./reviews/ProductReviewsSection";
import ProductQASection from "./qa/ProductQASection";
import "@/styles/product-reviews.css";

const SECTIONS = [
  { id: "details", label: "Product Details" },
  { id: "reviews", label: "Reviews" },
  { id: "qa", label: "Q&A" },
  { id: "videos", label: "Videos" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

interface ProductTabsProps {
  product: ProductDetail;
  productSlug: string;
  reviewCount?: number;
}

function ProductSectionHeading({
  id,
  children,
  count,
}: {
  id: SectionId;
  children: ReactNode;
  count?: number;
}) {
  return (
    <div className="pdp-sections__heading" id={`section-${id}`}>
      <span className="pdp-sections__heading-line" aria-hidden="true" />
      <h2 className="pdp-sections__heading-text">
        {children}
        {count != null ? <span className="pdp-sections__heading-count">({count})</span> : null}
      </h2>
      <span className="pdp-sections__heading-line" aria-hidden="true" />
    </div>
  );
}

export default function ProductTabs({ product, productSlug, reviewCount }: ProductTabsProps) {
  const displayedReviewCount = reviewCount ?? product.reviewCount;

  function sectionHeading(sectionId: SectionId, label: string) {
    if (sectionId === "reviews") {
      return { label, count: displayedReviewCount };
    }
    if (sectionId === "qa") {
      return { label, count: product.qa.length };
    }
    return { label, count: undefined };
  }

  return (
    <section className="pdp-sections" aria-label="Product information">
      <div className="pdp-sections__list">
        {SECTIONS.map((section) => {
          if (section.id === "videos" && product.videos.length === 0) {
            return null;
          }

          const heading = sectionHeading(section.id, section.label);

          return (
            <article
              key={section.id}
              className={`pdp-sections__block${
                section.id === "details" ? " pdp-sections__block--details" : ""
              }`}
              aria-labelledby={
                section.id === "details" ? "section-details" : `section-${section.id}`
              }
            >
              {section.id !== "details" ? (
                <ProductSectionHeading id={section.id} count={heading.count}>
                  {heading.label}
                </ProductSectionHeading>
              ) : null}

              <div className="pdp-sections__body">
                {section.id === "details" ? <ProductDetailsPanel product={product} /> : null}

                {section.id === "reviews" ? (
                  <ProductReviewsSection productSlug={productSlug} productId={product.id} />
                ) : null}

                {section.id === "qa" ? (
                  <ProductQASection productSlug={productSlug} staticQa={product.qa} />
                ) : null}

                {section.id === "videos" ? (
                  product.videos.length === 0 ? (
                    <p className="pdp-sections__empty">No product videos available.</p>
                  ) : (
                    <div className="pdp-videos">
                      {product.videos.map((video) => (
                        <div key={video.id} className="pdp-videos__item">
                          <h3 className="pdp-sections__subheading pdp-videos__title">
                            {video.title}
                          </h3>
                          <div className="pdp-video-embed">
                            <iframe
                              src={video.embedUrl}
                              title={video.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export type { SectionId as TabId };
