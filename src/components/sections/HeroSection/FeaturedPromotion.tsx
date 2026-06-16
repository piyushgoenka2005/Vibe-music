interface FeaturedPromotionProps {
  title: string;
  subtitle: string;
  color: string;
}

export default function FeaturedPromotion({
  title,
  subtitle,
  color,
}: FeaturedPromotionProps) {
  return (
    <div
      className={`rounded-2xl p-6 text-white min-h-[215px] ${color}`}
    >
      <p className="text-sm uppercase tracking-wide mb-2">
        Limited Offer
      </p>

      <h3 className="text-2xl font-normal mb-3">
        {title}
      </h3>

      <p className="text-sm opacity-90">
        {subtitle}
      </p>

      <button className="mt-5 bg-white text-black px-4 py-2 rounded-lg text-sm font-medium">
        View Deal
      </button>
    </div>
  );
}