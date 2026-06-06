interface WelcomeCardProps {
  title: string;
  description: string;
}

export default function WelcomeCard({
  title,
  description,
}: WelcomeCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition">
      <h3 className="font-semibold text-lg text-gray-900 mb-2">
        {title}
      </h3>

      <p className="text-sm text-gray-600">
        {description}
      </p>
    </div>
  );
}