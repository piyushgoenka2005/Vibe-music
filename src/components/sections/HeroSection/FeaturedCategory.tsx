interface FeaturedCategoryProps {
  title: string;
}

export default function FeaturedCategory({
  title,
}: FeaturedCategoryProps) {
  return (
    <div className="group cursor-pointer">

      <div className="aspect-square rounded-2xl bg-gray-100 mb-3 overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 group-hover:scale-105 transition-transform duration-300" />
      </div>

      <h4 className="font-medium text-center text-sm">
        {title}
      </h4>

    </div>
  );
}