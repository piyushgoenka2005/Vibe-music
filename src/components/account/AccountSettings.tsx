"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Bell, Lock, KeyRound } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { useAuthStore } from "@/store/authStore";
import { useAccountProfileStore } from "@/store/accountProfileStore";

export default function AccountSettings() {
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const user = useAuthStore((s) => s.user);
  const notifications = useAccountProfileStore((s) => s.notifications);
  const updateNotifications = useAccountProfileStore((s) => s.updateNotifications);

  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  async function handlePasswordReset() {
    if (!user?.email) return;
    setResetError(null);
    try {
      await resetPassword(user.email);
      setResetSent(true);
    } catch {
      setResetError("Could not send reset email. Please try again.");
    }
  }

  return (
    <div>
      <h2 className="acct__section-title">Settings</h2>
      <p className="acct__section-sub">
        Manage notifications, privacy, and account security.
      </p>

      <div className="acct__settings-grid">
        <section className="acct__card">
          <div className="acct__card-header">
            <h3 className="acct__card-title">
              <Bell size={18} style={{ display: "inline", marginRight: 8, verticalAlign: "middle" }} />
              Notification Preferences
            </h3>
          </div>
          <div className="acct__card-body">
            {(
              [
                {
                  key: "orderUpdates" as const,
                  title: "Order Updates",
                  desc: "Shipping confirmations and delivery alerts",
                },
                {
                  key: "promotions" as const,
                  title: "Deals & Promotions",
                  desc: "Sales, coupons, and special offers",
                },
                {
                  key: "productAlerts" as const,
                  title: "Product Alerts",
                  desc: "Back-in-stock and price drop notifications",
                },
                {
                  key: "newsletter" as const,
                  title: "Newsletter",
                  desc: "Weekly gear picks and music industry news",
                },
              ] as const
            ).map((item) => (
              <div key={item.key} className="acct__setting-row">
                <div className="acct__setting-info">
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
                <label className="acct__toggle">
                  <input
                    type="checkbox"
                    checked={notifications[item.key]}
                    onChange={(e) =>
                      updateNotifications({ [item.key]: e.target.checked })
                    }
                  />
                  <span className="acct__toggle-slider" />
                </label>
              </div>
            ))}
          </div>
        </section>

        <section className="acct__card">
          <div className="acct__card-header">
            <h3 className="acct__card-title">
              <Shield size={18} style={{ display: "inline", marginRight: 8, verticalAlign: "middle" }} />
              Privacy & Security
            </h3>
          </div>
          <div className="acct__card-body">
            <div className="acct__setting-row">
              <div className="acct__setting-info">
                <h4>Account Settings</h4>
                <p>Update your name, email visibility, and profile details.</p>
              </div>
              <Link href={ROUTES.accountProfile} className="acct__btn acct__btn--secondary acct__btn--sm">
                Edit Profile
              </Link>
            </div>

            <div className="acct__setting-row">
              <div className="acct__setting-info">
                <h4>
                  <Lock size={14} style={{ display: "inline", marginRight: 4 }} />
                  Change Password
                </h4>
                <p>We&apos;ll send a secure reset link to your email.</p>
              </div>
              <button
                type="button"
                className="acct__btn acct__btn--secondary acct__btn--sm"
                onClick={() => void handlePasswordReset()}
              >
                <KeyRound size={14} />
                Send Reset Link
              </button>
            </div>

            {resetSent ? (
              <div className="acct__toast acct__toast--success" role="status">
                Password reset email sent to {user?.email}.
              </div>
            ) : null}
            {resetError ? (
              <div className="acct__toast acct__toast--error" role="alert">
                {resetError}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
