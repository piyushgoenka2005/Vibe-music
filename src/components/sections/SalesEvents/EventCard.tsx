interface EventCardProps {
  title: string;
  subtitle: string;
}

export default function EventCard({
  title,
  subtitle,
}: EventCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 hover:shadow-lg transition">

      <div className="h-52 bg-gradient-to-br from-blue-200 to-blue-400" />

      <div className="p-6">

        <h3 className="font-normal text-xl mb-2">
          {title}
        </h3>

        <p className="text-gray-600 text-sm mb-4">
          {subtitle}
        </p>

        <button className="text-[var(--brand-primary)] font-medium">
          Shop Event →
        </button>

      </div>

    </div>
  );
}