"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { useWishlistStore } from "@/store/wishlistStore";
import { useAuthStore } from "@/store/authStore";
import "./wishlist.css";

export default function AccountWishlist() {
  const items = useWishlistStore((s) => s.items);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <section className="wl-account-section" aria-label="Wishlist">
      <h2 style={{ margin: "0 0 12px", fontSize: 20 }}>My Wishlist</h2>

      {isAuthenticated && user ? (
        <p style={{ margin: "0 0 12px", fontSize: 14, color: "#807f7e" }}>
          Signed in as {user.name} ({user.email}) — wishlist synced to your account.
        </p>
      ) : (
        <p style={{ margin: "0 0 12px", fontSize: 14, color: "#807f7e" }}>
          Sign in to sync your wishlist across devices.
        </p>
      )}

      <p style={{ margin: "0 0 16px", fontSize: 15 }}>
        <strong>{items.length}</strong> saved item
        {items.length === 1 ? "" : "s"}
      </p>

      {items.length > 0 ? (
        <ul style={{ margin: "0 0 16px", padding: 0, listStyle: "none" }}>
          {items.slice(0, 3).map((item) => (
            <li
              key={item.productId}
              style={{
                padding: "8px 0",
                borderBottom: "1px solid #e5e4e3",
                fontSize: 14,
              }}
            >
              <Link
                href={`/product/${item.slug}`}
                style={{ color: "var(--brand-primary)", textDecoration: "none" }}
              >
                {item.brand} — {item.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href={ROUTES.accountWishlist} className="wl-btn-primary" style={{ padding: "0 20px" }}>
          View Wishlist
        </Link>
        {isAuthenticated ? (
          <button type="button" className="wl-btn-secondary" onClick={() => void logout()}>
            Sign Out
          </button>
        ) : (
          <Link href={ROUTES.login} className="wl-btn-secondary" style={{ padding: "0 20px" }}>
            Sign In
          </Link>
        )}
      </div>
    </section>
  );
}
