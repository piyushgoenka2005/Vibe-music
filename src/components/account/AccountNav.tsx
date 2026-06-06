import Link from "next/link";
import { ROUTES } from "@/lib/routes";

const LINKS = [
  { href: ROUTES.account, label: "Overview" },
  { href: ROUTES.accountOrders, label: "Orders" },
  { href: ROUTES.accountProfile, label: "Profile" },
  { href: ROUTES.accountWishlist, label: "Wishlist" },
] as const;

export default function AccountNav({ active }: { active: string }) {
  return (
    <nav
      aria-label="Account"
      style={{
        display: "flex",
        gap: 16,
        flexWrap: "wrap",
        marginBottom: 24,
        borderBottom: "1px solid #e5e4e3",
        paddingBottom: 12,
      }}
    >
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          style={{
            color: active === link.href ? "#0072ba" : "#2e2e2d",
            fontWeight: active === link.href ? 700 : 500,
            textDecoration: "none",
          }}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
