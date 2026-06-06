interface CategoryCardProps {
  title: string;
}

export default function CategoryCard({
  title,
}: CategoryCardProps) {
  return (
    <div className="group cursor-pointer">

      <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">

        <div className="w-16 h-16 rounded-xl bg-gray-100 mx-auto mb-4" />

        <h3 className="text-center text-sm font-medium text-gray-800 leading-snug">
          {title}
        </h3>

      </div>

    </div>
  );
}