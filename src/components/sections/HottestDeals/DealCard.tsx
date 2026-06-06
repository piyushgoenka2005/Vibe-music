interface DealCardProps {
  title: string;
  discount: string;
}

export default function DealCard({
  title,
  discount,
}: DealCardProps) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl transition">

      <div className="h-60 bg-gradient-to-br from-red-400 to-orange-500" />

      <div className="p-6">

        <span className="text-red-500 font-bold">
          {discount}
        </span>

        <h3 className="text-xl font-bold mt-2">
          {title}
        </h3>

      </div>

    </div>
  );
}