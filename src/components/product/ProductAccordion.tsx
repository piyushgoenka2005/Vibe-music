"use client";

import { useId, useState } from "react";
import type { ProductDetail } from "@/types/product";
import { buildProductAccordionSections } from "@/lib/product/buildProductAccordionSections";

interface ProductAccordionProps {
  product: ProductDetail;
}

export default function ProductAccordion({ product }: ProductAccordionProps) {
  const baseId = useId();
  const sections = buildProductAccordionSections(product);
  const [openId, setOpenId] = useState<string | null>(sections[0]?.id ?? null);

  function toggleSection(id: string) {
    setOpenId((current) => (current === id ? null : id));
  }

  return (
    <section className="pdp-accordion" aria-label="Product information">
      <div className="pdp-accordion__card">
        {sections.map((section, index) => {
          const isOpen = openId === section.id;
          const triggerId = `${baseId}-${section.id}-trigger`;
          const panelId = `${baseId}-${section.id}-panel`;

          return (
            <div
              key={section.id}
              className={`pdp-accordion__item${
                isOpen ? " pdp-accordion__item--open" : ""
              }${index === sections.length - 1 ? " pdp-accordion__item--last" : ""}`}
            >
              <h3 className="pdp-accordion__heading">
                <button
                  type="button"
                  id={triggerId}
                  className="pdp-accordion__trigger"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggleSection(section.id)}
                >
                  <span className="pdp-accordion__title">{section.title}</span>
                  <span className="pdp-accordion__icon" aria-hidden="true">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                aria-hidden={!isOpen}
                className={`pdp-accordion__panel${
                  isOpen ? " pdp-accordion__panel--open" : ""
                }`}
              >
                <div className="pdp-accordion__content">
                  {section.id === "description" ? (
                    section.content.map((line, lineIndex) => (
                      <p
                        key={`${section.id}-${lineIndex}`}
                        className="pdp-accordion__paragraph"
                      >
                        {line}
                      </p>
                    ))
                  ) : (
                    <ul className="pdp-accordion__list">
                      {section.content.map((line, lineIndex) => (
                        <li key={`${section.id}-${lineIndex}`}>{line}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
