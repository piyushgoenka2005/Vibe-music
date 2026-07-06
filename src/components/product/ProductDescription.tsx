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
      {introBlocks.map((block, index) => (
        <p key={`intro-${index}`} className="pdp-description__lead">
          {block.text}
        </p>
      ))}

      {featureBlocks.length > 0 ? (
        <div className="pdp-description__highlights">
          {featureBlocks.map((block, index) => (
            <div key={`feature-${index}`} className="pdp-description__highlight">
              <h3 className="pdp-description__highlight-title">{block.title}</h3>
              <p className="pdp-description__highlight-body">{block.body}</p>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}
