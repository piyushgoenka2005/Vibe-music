export interface HeroSlideSlot {
  src: string;
  alt: string;
}

interface HeroSlideProps {
  className: string;
  slots: [HeroSlideSlot, HeroSlideSlot];
  activeSlot: 0 | 1;
  onImageLoad?: (slotIndex: 0 | 1) => void;
}

/** Double-buffered image pair for a hero triptych carousel column. */
export default function HeroSlide({
  className,
  slots,
  activeSlot,
  onImageLoad,
}: HeroSlideProps) {
  return (
    <div className={className}>
      {slots.map((slot, index) => (
        <img
          key={index}
          src={slot.src || undefined}
          alt={slot.alt}
          className={index === activeSlot ? "active" : undefined}
          onLoad={() => {
            if (slot.src) {
              onImageLoad?.(index as 0 | 1);
            }
          }}
        />
      ))}
    </div>
  );
}
