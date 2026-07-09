interface ProductShareIconProps {
  className?: string;
  size?: number;
}

/** Export/share glyph with inset padding so it stays centered in circular buttons. */
export default function ProductShareIcon({
  className,
  size = 16,
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
      strokeWidth="2"
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 6.25v7.5" />
      <path d="M8.75 9.5 12 6.25 15.25 9.5" />
      <path d="M7.25 13.75v4a1.75 1.75 0 0 0 1.75 1.75h6a1.75 1.75 0 0 0 1.75-1.75v-4" />
    </svg>
  );
}
