import Image from "next/image";
import "./aplus-story-banners.css";

export interface AplusStoryBanner {
  id: string;
  imageSrc: string;
  imageAlt: string;
}

interface AplusStoryBannersProps {
  banners: AplusStoryBanner[];
}

export default function AplusStoryBanners({ banners }: AplusStoryBannersProps) {
  if (!banners.length) return null;

  return (
    <div className="aplus-story">
      {banners.map((banner) => (
        <section
          key={banner.id}
          className="aplus-story__banner"
          aria-label={banner.imageAlt}
        >
          <Image
            src={banner.imageSrc}
            alt={banner.imageAlt}
            width={1920}
            height={640}
            className="aplus-story__image"
            sizes="100vw"
          />
        </section>
      ))}
    </div>
  );
}
