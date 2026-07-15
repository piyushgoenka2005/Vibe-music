interface ProductShareIconProps {
  className?: string;
  size?: number;
}

export default function ProductShareIcon({
  className,
  size = 20,
}: ProductShareIconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.2"
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 3v10" />
      <path d="m8 7 4-4 4 4" />
      <path d="M6 14v3a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}
