import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface AccountEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}

export default function AccountEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: AccountEmptyStateProps) {
  return (
    <div className="acct__empty">
      <div className="acct__empty-icon">
        <Icon size={36} strokeWidth={1.5} />
      </div>
      <h3 className="acct__empty-title">{title}</h3>
      <p className="acct__empty-text">{description}</p>
      <Link href={actionHref} className="acct__btn acct__btn--primary">
        {actionLabel}
      </Link>
    </div>
  );
}
