import Link from "next/link";
import { resolveLinkHref } from "@/lib/routes";
import type { ValueAddItem } from "@/data/valueAdds";
import { ValueAddIcon } from "./valueAddIcons";

interface ValueAddCardProps {
  item: ValueAddItem;
}

export default function ValueAddCard({ item }: ValueAddCardProps) {
  return (
    <Link
      href={resolveLinkHref(item.href)}
      data-log={item.dataLog}
      data-hp-section={item.hpSection}
      data-hp-slot={item.hpSlot}
    >
      <div className="value-ads--icon">
        <ValueAddIcon iconId={item.iconId} />
      </div>
      <div className="value-ads--title">{item.title}</div>
      <div className="value-ads--subtitle">
        {item.subtitle}
        {item.subtitleSpan ? <span>{item.subtitleSpan}</span> : null}
      </div>
      <div className="value-ads--cta">{item.ctaLabel}</div>
    </Link>
  );
}
