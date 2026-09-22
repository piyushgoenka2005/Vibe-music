"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import type { ProductDetail } from "@/types/product";
import { buildProductDetailsViewModel } from "@/lib/product/buildProductDetailsViewModel";
import type { ProductSpecGroup } from "@/lib/product/groupProductSpecs";

interface ProductDetailsPanelProps {
  product: ProductDetail;
}

function SpecKeyValueRow({
  spec,
  empty = false,
}: {
  spec?: { label: string; value: string };
  empty?: boolean;
}) {
  if (empty || !spec) {
    return (
      <>
        <th className="pdp-product-details__kv-table__spacer" aria-hidden="true" />
        <td className="pdp-product-details__kv-table__spacer" aria-hidden="true" />
      </>
    );
  }

  return (
    <>
      <th scope="row">{spec.label}</th>
      <td>{spec.value}</td>
    </>
  );
}

function SpecKeyValueTable({
  specs,
  dense = false,
  paired = false,
}: {
  specs: Array<{ label: string; value: string }>;
  dense?: boolean;
  paired?: boolean;
}) {
  const tableClassName = [
    "pdp-product-details__kv-table",
    dense ? "pdp-product-details__kv-table--dense" : "",
    paired ? "pdp-product-details__kv-table--paired" : "",
    dense && !paired ? "pdp-product-details__kv-table--compact" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (paired) {
    const rows: Array<
      [{ label: string; value: string }, { label: string; value: string } | undefined]
    > = [];

    for (let index = 0; index < specs.length; index += 2) {
      rows.push([specs[index]!, specs[index + 1]]);
    }

    return (
      <table className={tableClassName}>
        <tbody>
          {rows.map(([left, right], index) => (
            <tr key={`pair-${index}`}>
              <SpecKeyValueRow spec={left} />
              <SpecKeyValueRow spec={right} empty={!right} />
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <table className={tableClassName}>
      <tbody>
        {specs.map((spec, index) => (
          <tr key={`${spec.label}-${index}`}>
            <th scope="row">{spec.label}</th>
            <td>{spec.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SpecGrid({ specs }: { specs: Array<{ label: string; value: string }> }) {
  return (
    <dl className="pdp-product-details__spec-grid">
      {specs.map((spec, index) => (
        <div key={`${spec.label}-${index}`} className="pdp-product-details__spec-cell">
          <dt>{spec.label}</dt>
          <dd>{spec.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function DetailSubsection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="pdp-product-details__subsection">
      <h3 className="pdp-product-details__subsection-title">{title}</h3>
      <div className="pdp-product-details__subsection-body">{children}</div>
    </section>
  );
}

function SpecAccordionCard({
  title,
  panelId,
  triggerId,
  defaultOpen,
  children,
}: {
  title: string;
  panelId: string;
  triggerId: string;
  defaultOpen: boolean;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <article
      className={`pdp-product-details__accordion${
        isOpen ? " pdp-product-details__accordion--open" : ""
      }`}
    >
      <h4 className="pdp-product-details__accordion-heading">
        <button
          type="button"
          id={triggerId}
          className="pdp-product-details__accordion-trigger"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span>{title}</span>
          <span className="pdp-product-details__accordion-caret" aria-hidden="true" />
        </button>
      </h4>
      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        className="pdp-product-details__accordion-panel"
        hidden={!isOpen}
      >
        {children}
      </div>
    </article>
  );
}

function GroupedSpecAccordion({ group, baseId }: { group: ProductSpecGroup; baseId: string }) {
  const triggerId = `${baseId}-${group.id}-trigger`;
  const panelId = `${baseId}-${group.id}-panel`;

  return (
    <SpecAccordionCard
      title={group.title}
      triggerId={triggerId}
      panelId={panelId}
      defaultOpen={false}
    >
      <SpecKeyValueTable specs={group.specs} dense />
    </SpecAccordionCard>
  );
}

function InTheBoxAccordion({ items, baseId }: { items: string[]; baseId: string }) {
  const triggerId = `${baseId}-in-the-box-trigger`;
  const panelId = `${baseId}-in-the-box-panel`;

  return (
    <SpecAccordionCard
      title="In the box"
      triggerId={triggerId}
      panelId={panelId}
      defaultOpen={false}
    >
      <ul className="pdp-product-details__box-list">
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
    </SpecAccordionCard>
  );
}

export default function ProductDetailsPanel({ product }: ProductDetailsPanelProps) {
  const baseId = useId().replace(/:/g, "");

  const viewModel = useMemo(() => buildProductDetailsViewModel(product), [product]);

  if (!viewModel.hasAnyContent) {
    return <p className="pdp-sections__empty">No product details available.</p>;
  }

  const hasAccordionSections = viewModel.expandedGroups.length > 0 || viewModel.inTheBox.length > 0;

  return (
    <article className="pdp-product-details" aria-labelledby="section-details">
      <header className="pdp-product-details__header">
        <h2 className="pdp-product-details__title" id="section-details">
          Product details
        </h2>
        <span className="pdp-product-details__header-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M7 4h10a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
      </header>

      {viewModel.introBlocks.length > 0 ? (
        <div className="pdp-product-details__lead">
          {viewModel.introBlocks.map((block, index) => (
            <p key={`intro-${index}`}>{block.text}</p>
          ))}
        </div>
      ) : null}

      {viewModel.sizeAndFitSpecs.length > 0 ? (
        <DetailSubsection title="Size & Fit">
          <SpecGrid specs={viewModel.sizeAndFitSpecs} />
        </DetailSubsection>
      ) : null}

      {viewModel.materialAndCareSpecs.length > 0 ? (
        <DetailSubsection title="Material & Care">
          <SpecGrid specs={viewModel.materialAndCareSpecs} />
        </DetailSubsection>
      ) : null}

      {viewModel.styleSpec ? (
        <p className="pdp-product-details__style">
          Style Name: <strong>{viewModel.styleSpec.value}</strong>
        </p>
      ) : null}

      {viewModel.quickSpecs.length > 0 ? (
        <section className="pdp-product-details__quick-specs" aria-label="Key specifications">
          <dl className="pdp-product-details__quick-grid">
            {viewModel.quickSpecs.map((spec, index) => (
              <div key={`${spec.label}-${index}`} className="pdp-product-details__quick-row">
                <dt>{spec.label}</dt>
                <dd>{spec.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {viewModel.aboutItems.length > 0 ? (
        <section className="pdp-product-details__about" aria-label="About this item">
          <h3 className="pdp-product-details__about-title">About this item</h3>
          <ul className="pdp-product-details__about-list">
            {viewModel.aboutItems.map((item, index) => (
              <li key={`about-${index}`} className="pdp-product-details__about-item">
                {item.title ? (
                  <span className="pdp-product-details__about-item-title">{item.title}</span>
                ) : null}
                {item.body ? (
                  <span className="pdp-product-details__about-item-body">{item.body}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {viewModel.completeSpecs.length > 0 ? (
        <section
          className="pdp-product-details__complete-specs"
          aria-label="Complete specifications"
        >
          <h3 className="pdp-product-details__complete-specs-title">Complete specifications</h3>
          <div className="pdp-product-details__complete-specs-body">
            <SpecKeyValueTable specs={viewModel.completeSpecs} dense paired />
          </div>
        </section>
      ) : null}

      {hasAccordionSections ? (
        <div className="pdp-product-details__accordion-grid">
          {viewModel.expandedGroups.map((group) => (
            <GroupedSpecAccordion key={group.id} group={group} baseId={baseId} />
          ))}

          {viewModel.inTheBox.length > 0 ? (
            <InTheBoxAccordion items={viewModel.inTheBox} baseId={baseId} />
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
