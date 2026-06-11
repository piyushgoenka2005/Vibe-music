import Link from "next/link";
import { resolveLinkHref } from "@/lib/routes";
import type { ResearchArticleItem } from "@/data/researchArticles";

const PHOTO_PLACEHOLDER = (
  <svg xmlns="http://www.w3.org/2000/svg" width="334" height="175">
    <path fill="#ebebeb" d="M0 0h334v175H0z" />
  </svg>
);

interface ResearchArticleCardProps {
  item: ResearchArticleItem;
  variant: "featured" | "article";
}

function ArticlePicture({
  image,
  pictureClassName,
}: {
  image: ResearchArticleItem["image"];
  pictureClassName: string;
}) {
  return (
    <picture className={pictureClassName}>
      <source
        type="image/webp"
        srcSet={image.srcSet}
        sizes={image.sizes}
      />
      <img
        src={image.src}
        alt={image.alt}
        loading="lazy"
        width={image.width}
        height={image.height}
      />
    </picture>
  );
}

/** Featured or secondary inSync article card in the homepage research grid. */
export default function ResearchArticleCard({
  item,
  variant,
}: ResearchArticleCardProps) {
  if (variant === "featured") {
    return (
      <Link
        href={resolveLinkHref(item.href)}
        className="insync-grid--article-large"
        data-hp-section="insync"
        data-hp-slot={item.hpSlot}
      >
        <ArticlePicture
          image={item.image}
          pictureClassName="insync-grid--lead-photo"
        />
        <div className="insync-grid--title">
          <h3>{item.title}</h3>
          <div className="insync-grid--author">{item.authorDate}</div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={resolveLinkHref(item.href)}
      className="insync-grid--article"
      data-hp-section="insync"
      data-hp-slot={item.hpSlot}
    >
      <div className="insync-grid--photo-group">
        {PHOTO_PLACEHOLDER}
        <ArticlePicture
          image={item.image}
          pictureClassName="insync-grid--photo"
        />
      </div>
      <div className="insync-grid--title">
        <div>
          <h3>{item.title}</h3>
        </div>
        <div className="insync-grid--author">{item.authorDate}</div>
      </div>
    </Link>
  );
}
