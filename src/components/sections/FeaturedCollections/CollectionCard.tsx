interface CollectionCardProps {
  title: string;
}

export default function CollectionCard({
  title,
}: CollectionCardProps) {
  return (
    <div className="relative rounded-2xl overflow-hidden">

      <div className="h-[320px] bg-gradient-to-br from-gray-300 to-gray-500" />

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">

        <h3 className="text-white text-2xl font-normal">
          {title}
        </h3>

      </div>

    </div>
  );
}