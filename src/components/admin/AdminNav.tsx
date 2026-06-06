import Link from "next/link";
import { ROUTES } from "@/lib/routes";

const LINKS = [
  { href: ROUTES.admin, label: "Dashboard" },
  { href: ROUTES.adminProducts, label: "Products" },
  { href: ROUTES.adminOrders, label: "Orders" },
  { href: ROUTES.adminCustomers, label: "Customers" },
  { href: ROUTES.adminReviews, label: "Reviews" },
  { href: ROUTES.adminBlog, label: "Blog" },
] as const;

export default function AdminNav({ active }: { active: string }) {
  return (
    <nav
      aria-label="Admin"
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
