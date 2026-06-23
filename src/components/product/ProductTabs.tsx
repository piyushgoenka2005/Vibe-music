"use client";

import { useState } from "react";
import type { ProductDetail } from "@/types/product";
import ProductReviewsSection from "./reviews/ProductReviewsSection";
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
  const displayedReviewCount = reviewCount ?? product.reviewCount;

  return (
    <div className="pdp-tabs">
      <div className="pdp-tabs__nav" role="tablist" aria-label="Product information">
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
            {tab.label}
            {tab.id === "reviews" ? ` (${displayedReviewCount})` : ""}
            {tab.id === "qa" ? ` (${product.qa.length})` : ""}
          </button>
        ))}
      </div>

      <div
        id="panel-description"
        role="tabpanel"
        aria-labelledby="tab-description"
        hidden={activeTab !== "description"}
        className="pdp-tabs__panel"
      >
        <p>{product.description}</p>
      </div>

      <div
        id="panel-specs"
        role="tabpanel"
        aria-labelledby="tab-specs"
        hidden={activeTab !== "specs"}
        className="pdp-tabs__panel"
      >
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
      </div>

      <div
        id="panel-in-the-box"
        role="tabpanel"
        aria-labelledby="tab-in-the-box"
        hidden={activeTab !== "in-the-box"}
        className="pdp-tabs__panel"
      >
        <ul>
          {product.inTheBox.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
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
        {product.qa.map((item) => (
          <article key={item.id} className="pdp-qa">
            <p className="pdp-qa__q">Q: {item.question}</p>
            <p className="pdp-qa__a">
              A: {item.answer} — <em>{item.author}</em>
            </p>
          </article>
        ))}
      </div>

      <div
        id="panel-videos"
        role="tabpanel"
        aria-labelledby="tab-videos"
        hidden={activeTab !== "videos"}
        className="pdp-tabs__panel"
      >
        {product.videos.length === 0 ? (
          <p>No product videos available.</p>
        ) : (
          product.videos.map((video) => (
            <div key={video.id}>
              <h4 style={{ margin: "0 0 12px" }}>{video.title}</h4>
              <div className="pdp-video-embed">
                <iframe
                  src={video.embedUrl}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export type { TabId };
