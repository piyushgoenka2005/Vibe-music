interface BenefitCardProps {
  title: string;
  description: string;
}

export default function BenefitCard({
  title,
  description,
}: BenefitCardProps) {
  return (
    <div className="text-center bg-white border border-gray-200 rounded-2xl p-8">

      <div className="w-16 h-16 rounded-full bg-blue-100 mx-auto mb-5" />

      <h3 className="font-normal text-xl mb-3">
        {title}
      </h3>

      <p className="text-gray-600">
        {description}
      </p>

    </div>
  );
}