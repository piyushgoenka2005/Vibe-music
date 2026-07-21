"use client";

import { useEffect, useRef, useState } from "react";
import type { ProductDetail } from "@/types/product";
import { attachHorizontalWheelScroll } from "@/lib/horizontalWheelScroll";
import ProductDescription from "./ProductDescription";
import ProductReviewsSection from "./reviews/ProductReviewsSection";
import ProductQASection from "./qa/ProductQASection";
import "@/styles/product-reviews.css";

const TABS = [
  { id: "description", label: "Description" },
  { id: "specs", label: "Specs" },
  { id: "in-the-box", label: "In The Box" },
  { id: "reviews", label: "Reviews" },
  { id: "qa", label: "Q&A" },
  { id: "videos", label: "Videos" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface ProductTabsProps {
  product: ProductDetail;
  productSlug: string;
  reviewCount?: number;
  initialTab?: TabId;
}

export default function ProductTabs({
  product,
  productSlug,
  reviewCount,
  initialTab = "description",
}: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const navRef = useRef<HTMLDivElement>(null);
  const displayedReviewCount = reviewCount ?? product.reviewCount;

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    return attachHorizontalWheelScroll(nav);
  }, []);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const active = nav.querySelector<HTMLElement>('[aria-selected="true"]');
    active?.scrollIntoView({
      behavior: "smooth",
      inline: "nearest",
      block: "nearest",
    });
  }, [activeTab]);

  return (
    <section className="pdp-tabs" aria-label="Product details">
      <div className="pdp-tabs__shell">
        <div
          ref={navRef}
          className="pdp-tabs__nav"
          role="tablist"
          aria-label="Product information"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              className={`pdp-tabs__btn${activeTab === tab.id ? " pdp-tabs__btn--active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="pdp-tabs__btn-label">
                {tab.label}
                {tab.id === "reviews" ? ` (${displayedReviewCount})` : ""}
                {tab.id === "qa" ? ` (${product.qa.length})` : ""}
              </span>
            </button>
          ))}
        </div>

        <div className="pdp-tabs__content">
          <div
            id="panel-description"
            role="tabpanel"
            aria-labelledby="tab-description"
            hidden={activeTab !== "description"}
            className="pdp-tabs__panel"
          >
            <ProductDescription description={product.description} />
          </div>

          <div
            id="panel-specs"
            role="tabpanel"
            aria-labelledby="tab-specs"
            hidden={activeTab !== "specs"}
            className="pdp-tabs__panel"
          >
            <div className="pdp-specs-wrap">
              {product.specs.length === 0 ? (
                <p className="pdp-tabs__empty">No specifications listed for this product.</p>
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
          </div>

          <div
            id="panel-in-the-box"
            role="tabpanel"
            aria-labelledby="tab-in-the-box"
            hidden={activeTab !== "in-the-box"}
            className="pdp-tabs__panel"
          >
            {product.inTheBox.length === 0 ? (
              <p className="pdp-tabs__empty">Package contents not listed.</p>
            ) : (
              <ul className="pdp-in-the-box">
                {product.inTheBox.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </div>

          <div
            id="panel-reviews"
            role="tabpanel"
            aria-labelledby="tab-reviews"
            hidden={activeTab !== "reviews"}
            className="pdp-tabs__panel"
          >
            {activeTab === "reviews" ? (
              <ProductReviewsSection productSlug={productSlug} productId={product.id} />
            ) : null}
          </div>

          <div
            id="panel-qa"
            role="tabpanel"
            aria-labelledby="tab-qa"
            hidden={activeTab !== "qa"}
            className="pdp-tabs__panel"
          >
            {activeTab === "qa" ? (
              <ProductQASection productSlug={productSlug} staticQa={product.qa} />
            ) : null}
          </div>

          <div
            id="panel-videos"
            role="tabpanel"
            aria-labelledby="tab-videos"
            hidden={activeTab !== "videos"}
            className="pdp-tabs__panel"
          >
            {product.videos.length === 0 ? (
              <p className="pdp-tabs__empty">No product videos available.</p>
            ) : (
              <div className="pdp-videos">
                {product.videos.map((video) => (
                  <div key={video.id} className="pdp-videos__item">
                    <h4 className="pdp-videos__title">{video.title}</h4>
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
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export type { TabId };
