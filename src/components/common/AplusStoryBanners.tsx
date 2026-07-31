import Image from "next/image";
import Link from "next/link";
import "./aplus-story-banners.css";

export interface AplusStoryBanner {
  id: string;
  imageSrc: string;
  imageAlt: string;
  href?: string;
}

interface AplusStoryBannersProps {
  banners: AplusStoryBanner[];
}

export default function AplusStoryBanners({ banners }: AplusStoryBannersProps) {
  if (!banners.length) return null;

  return (
    <div className="aplus-story">
      {banners.map((banner) => {
        const image = (
          <Image
            src={banner.imageSrc}
            alt={banner.imageAlt}
            width={1920}
            height={640}
            className="aplus-story__image"
            sizes="100vw"
          />
        );

        return (
          <section
            key={banner.id}
            className="aplus-story__banner"
            aria-label={banner.imageAlt}
          >
            {banner.href ? (
              <Link href={banner.href} className="aplus-story__link">
                {image}
              </Link>
            ) : (
              image
            )}
          </section>
        );
      })}
    </div>
  );
}
