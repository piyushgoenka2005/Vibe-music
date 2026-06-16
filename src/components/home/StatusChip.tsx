import type { StatusTone } from "@/data/landingStatus";

interface StatusChipProps {
  label: string;
  tone?: StatusTone;
  showDot?: boolean;
  className?: string;
}

export default function StatusChip({
  label,
  tone = "neutral",
  showDot = false,
  className = "",
}: StatusChipProps) {
  return (
    <span
      className={`status-chip status-chip--${tone} ${className}`.trim()}
      data-tone={tone}
    >
      {showDot ? <span className="status-chip__dot" aria-hidden /> : null}
      {label}
    </span>
  );
}
