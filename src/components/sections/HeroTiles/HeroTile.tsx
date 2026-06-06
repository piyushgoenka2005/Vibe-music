interface HeroTileProps {
  title: string;
  description: string;
}

export default function HeroTile({
  title,
  description,
}: HeroTileProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 hover:shadow-xl transition-all duration-300">

      <div className="h-64 bg-gradient-to-br from-blue-300 to-blue-600" />

      <div className="p-6">

        <h3 className="text-2xl font-bold mb-3">
          {title}
        </h3>

        <p className="text-gray-600 mb-5">
          {description}
        </p>

        <button className="font-semibold text-[#0072ba]">
          Learn More →
        </button>

      </div>

    </div>
  );
}