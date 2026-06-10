import Link from "next/link";
import type { NewAndNotableItem } from "@/data/newAndNotable";
import { resolveLinkHref } from "@/lib/routes";

interface NewAndNotableCardProps {
  item: NewAndNotableItem;
}

export default function NewAndNotableCard({ item }: NewAndNotableCardProps) {
  return (
    <Link
      href={resolveLinkHref(item.href)}
      className="tile--link"
      data-hp-section="sale events"
    >
      <div className="tile multi full radius-lg bg-white">
        <div className="label bg-black text-white">{item.label}</div>
        <div className="tile--body">
          <picture className="tile--image opacity-100 blend-normal">
            <source
              media="(max-width: 768px)"
              srcSet={item.imageSrc}
              data-width="800"
              data-height="800"
            />
            <source
              media="(min-width: 769px) and (max-width: 1024px)"
              srcSet={item.imageSrc}
              data-width="800"
              data-height="800"
            />
            <source
              media="(min-width: 1025px)"
              srcSet={item.imageSrc}
              data-width="800"
              data-height="800"
            />
            <img
              src={item.imageSrc}
              alt={item.imageAlt}
              loading="lazy"
              width={800}
              height={800}
              className="responsive-image"
            />
          </picture>
          <div className="content">
            <div className="type-base text-black weight-demi">{item.headline}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
