import { parseProductDescription } from "@/lib/product/formatProductDescription";

interface ProductDescriptionProps {
  description: string;
}

export default function ProductDescription({ description }: ProductDescriptionProps) {
  const blocks = parseProductDescription(description);

  if (blocks.length === 0) {
    return <p className="pdp-description__empty">No description available.</p>;
  }

  const introBlocks = blocks.filter((block) => block.type === "intro");
  const featureBlocks = blocks.filter((block) => block.type === "feature");

  return (
    <article className="pdp-description">
      {featureBlocks.length > 0 ? (
        <section className="pdp-description__about" aria-label="About this item">
          <h3 className="pdp-description__section-heading">About this item</h3>
          <ul className="pdp-description__about-list">
            {featureBlocks.map((block, index) => (
              <li key={`feature-${index}`} className="pdp-description__about-item">
                <strong className="pdp-description__about-title">{block.title}</strong>
                {block.body ? (
                  <>
                    {" "}
                    <span className="pdp-description__about-body">{block.body}</span>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {introBlocks.length > 0 ? (
        <section className="pdp-description__product-copy" aria-label="Product description">
          <h3 className="pdp-description__section-heading">Product description</h3>
          <div className="pdp-description__intro">
            {introBlocks.map((block, index) => (
              <p key={`intro-${index}`} className="pdp-description__lead">
                {block.text}
              </p>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
