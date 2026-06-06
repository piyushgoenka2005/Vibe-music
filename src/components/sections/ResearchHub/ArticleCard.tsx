interface ArticleCardProps {
  title: string;
  category: string;
}

export default function ArticleCard({
  title,
  category,
}: ArticleCardProps) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">

      <div className="h-56 bg-gradient-to-br from-gray-300 to-gray-500" />

      <div className="p-6">

        <span className="text-[#0072ba] text-sm font-semibold">
          {category}
        </span>

        <h3 className="text-xl font-bold mt-3">
          {title}
        </h3>

      </div>

    </div>
  );
}