import type { SVGProps } from "react";

/** Compact UPI mark for checkout channel cards (BHIM/UPI-style shorthand). */
export function UpiIcon({ size = 18, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <rect
        x="2.25"
        y="2.25"
        width="19.5"
        height="19.5"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <path d="M7.2 16.75 10.55 7.1h2.15L9.35 16.75H7.2Z" fill="currentColor" />
      <path d="M12.35 16.75 15.7 7.1h2.1l-3.35 9.65h-2.1Z" fill="currentColor" fillOpacity="0.45" />
      <circle cx="18.15" cy="15.35" r="1.55" fill="#F97316" />
    </svg>
  );
}
