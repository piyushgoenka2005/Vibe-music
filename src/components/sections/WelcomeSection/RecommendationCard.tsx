interface RecommendationCardProps {
  title: string;
  subtitle: string;
}

export default function RecommendationCard({
  title,
  subtitle,
}: RecommendationCardProps) {
  return (
    <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
      <div className="w-16 h-16 rounded-lg bg-gray-100" />

      <div>
        <h4 className="font-medium text-gray-900">
          {title}
        </h4>

        <p className="text-sm text-gray-500">
          {subtitle}
        </p>
      </div>
    </div>
  );
}