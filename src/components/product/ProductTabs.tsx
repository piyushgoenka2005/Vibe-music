"use client";

import type { ReactNode } from "react";
import type { ProductDetail } from "@/types/product";
import ProductDescription from "./ProductDescription";
import ProductReviewsSection from "./reviews/ProductReviewsSection";
import ProductQASection from "./qa/ProductQASection";
import "@/styles/product-reviews.css";

const SECTIONS = [
  { id: "description", label: "Description" },
  { id: "specs", label: "Specs" },
  { id: "in-the-box", label: "In The Box" },
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
        {count != null ? (
          <span className="pdp-sections__heading-count">({count})</span>
        ) : null}
      </h2>
      <span className="pdp-sections__heading-line" aria-hidden="true" />
    </div>
  );
}

export default function ProductTabs({
  product,
  productSlug,
  reviewCount,
}: ProductTabsProps) {
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
    <section className="pdp-sections" aria-label="Product details">
      <div className="pdp-sections__list">
        {SECTIONS.map((section) => {
          const heading = sectionHeading(section.id, section.label);

          return (
          <article
            key={section.id}
            className="pdp-sections__block"
            aria-labelledby={`section-${section.id}`}
          >
            <ProductSectionHeading id={section.id} count={heading.count}>
              {heading.label}
            </ProductSectionHeading>

            <div className="pdp-sections__body">
              {section.id === "description" ? (
                <ProductDescription description={product.description} />
              ) : null}

              {section.id === "specs" ? (
                <div className="pdp-sections__panel pdp-specs-wrap">
                  {product.specs.length === 0 ? (
                    <p className="pdp-sections__empty">
                      No specifications listed for this product.
                    </p>
                  ) : (
                    <table className="pdp-specs">
                      <tbody>
                        {product.specs.map((spec) => (
                          <tr key={spec.label}>
                            <th scope="row">{spec.label}</th>
                            <td>{spec.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ) : null}

              {section.id === "in-the-box" ? (
                product.inTheBox.length === 0 ? (
                  <p className="pdp-sections__empty">Package contents not listed.</p>
                ) : (
                  <ul className="pdp-sections__panel pdp-in-the-box">
                    {product.inTheBox.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )
              ) : null}

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
