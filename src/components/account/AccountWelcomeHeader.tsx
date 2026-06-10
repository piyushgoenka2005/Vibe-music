"use client";

import { useAuthStore } from "@/store/authStore";

export default function AccountWelcomeHeader() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <header className="acct__hero">
      <p className="acct__hero-eyebrow">Account Overview</p>
      <h1 className="acct__hero-title">Hello, {firstName}</h1>
      <p className="acct__hero-sub">
        Manage your orders, wishlist, profile, and preferences — all in one place.
      </p>
    </header>
  );
}
