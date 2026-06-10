import Link from "next/link";
import { resolveLinkHref } from "@/lib/routes";
import type { WelcomeWidgetItem as WelcomeWidgetItemData } from "@/data/welcomeWidgets";

interface WelcomeWidgetItemProps {
  item: WelcomeWidgetItemData;
}

export default function WelcomeWidgetItem({ item }: WelcomeWidgetItemProps) {
  const className = item.single
    ? "personalization-widget__item personalization-widget__item--single"
    : "personalization-widget__item";

  return (
    <Link
      href={resolveLinkHref(item.href)}
      className={className}
      data-hp-section={item.hpSection}
      data-hp-slot={item.hpSlot}
    >
      <div className="personalization-widget__item--image">
        <img src={item.imageSrc} alt={item.imageAlt} className="item-image" />
      </div>
      <p className="personalization-widget__item--title">{item.title}</p>
    </Link>
  );
}
