import Link from "next/link";
import { ArrowUpRight, Signpost } from "lucide-react";

interface FooterWaistButtonProps {
  href: string;
  label: string;
}

export default function FooterWaistButton({ href, label }: FooterWaistButtonProps) {
  return (
    <Link href={href} className="footer-waist-btn">
      <span className="footer-waist-btn__icon" aria-hidden>
        <Signpost size={22} strokeWidth={2} />
      </span>
      <span className="footer-waist-btn__text">
        <span className="footer-waist-btn__label">{label}</span>
        <ArrowUpRight size={14} strokeWidth={2.5} aria-hidden />
      </span>
    </Link>
  );
}
