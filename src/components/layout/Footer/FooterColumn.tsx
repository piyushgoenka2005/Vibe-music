import { resolveLinkHref } from "@/lib/routes";
import type { FooterColumn as FooterColumnData } from "@/data/footer";

interface FooterColumnProps {
  column: FooterColumnData;
}

export default function FooterColumn({ column }: FooterColumnProps) {
  return (
    <div className="assets-site-footer__help-links__category">
      <a
        href={resolveLinkHref(column.headingHref)}
        className="assets-site-footer__help-links__category-heading"
      >
        {column.heading}
      </a>
      {column.links.map((link) => (
        <a
          key={link.id}
          href={resolveLinkHref(link.href)}
          id={link.id}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
