"use client";

import { User } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function AccountWelcomeHeader() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const photoURL = user?.photoURL ?? null;

  return (
    <header className="acct__hero">
      <div className="acct__hero-content">
        <div className="acct__hero-copy">
          <p className="acct__hero-eyebrow">Account Overview</p>
          <h1 className="acct__hero-title">Hello, {firstName}</h1>
          <p className="acct__hero-sub">
            Manage your orders, wishlist, profile, and preferences — all in one place.
          </p>
        </div>

        <div
          className="acct__hero-avatar"
          aria-label={photoURL ? `${user?.name ?? "User"} profile photo` : undefined}
        >
          {photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element -- OAuth avatar requires referrerPolicy
            <img
              src={photoURL}
              alt=""
              className="acct__hero-avatar-img"
              width={96}
              height={96}
              referrerPolicy="no-referrer"
            />
          ) : user?.name ? (
            <span className="acct__hero-avatar-initials">{getInitials(user.name)}</span>
          ) : (
            <User size={40} aria-hidden />
          )}
        </div>
      </div>
    </header>
  );
}
