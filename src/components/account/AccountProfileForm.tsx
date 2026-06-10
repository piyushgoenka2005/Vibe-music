"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useAccountProfileStore } from "@/store/accountProfileStore";

export default function AccountProfileForm() {
  const user = useAuthStore((s) => s.user);
  const updateDisplayName = useAuthStore((s) => s.updateDisplayName);
  const phone = useAccountProfileStore((s) => s.phone);
  const dateOfBirth = useAccountProfileStore((s) => s.dateOfBirth);
  const setPhone = useAccountProfileStore((s) => s.setPhone);
  const setDateOfBirth = useAccountProfileStore((s) => s.setDateOfBirth);

  const [name, setName] = useState(user?.name ?? "");
  const [phoneValue, setPhoneValue] = useState(phone);
  const [dob, setDob] = useState(dateOfBirth);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  useEffect(() => {
    setPhoneValue(phone);
    setDob(dateOfBirth);
  }, [phone, dateOfBirth]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      if (name.trim() && name.trim() !== user?.name) {
        await updateDisplayName(name.trim());
      }
      setPhone(phoneValue.trim());
      setDateOfBirth(dob);
      setMessage({ type: "success", text: "Profile saved successfully." });
    } catch {
      setMessage({
        type: "error",
        text: "Could not save profile. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div>
      <h2 className="acct__section-title">Profile</h2>
      <p className="acct__section-sub">
        Update your personal information and contact details.
      </p>

      <div className="acct__card">
        <div className="acct__card-body">
          {message ? (
            <div
              className={`acct__toast acct__toast--${message.type}`}
              role="status"
            >
              {message.text}
            </div>
          ) : null}

          <form onSubmit={(e) => void handleSubmit(e)}>
            <div className="acct__form-grid">
              <div className="acct__field">
                <label className="acct__label" htmlFor="profile-name">
                  Full Name
                </label>
                <input
                  id="profile-name"
                  className="acct__input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="acct__field">
                <label className="acct__label" htmlFor="profile-email">
                  Email
                </label>
                <input
                  id="profile-email"
                  className="acct__input"
                  type="email"
                  value={user.email}
                  disabled
                  autoComplete="email"
                />
              </div>

              <div className="acct__field">
                <label className="acct__label" htmlFor="profile-phone">
                  Phone
                </label>
                <input
                  id="profile-phone"
                  className="acct__input"
                  type="tel"
                  value={phoneValue}
                  onChange={(e) => setPhoneValue(e.target.value)}
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                />
              </div>

              <div className="acct__field">
                <label className="acct__label" htmlFor="profile-dob">
                  Date of Birth
                </label>
                <input
                  id="profile-dob"
                  className="acct__input"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <button
                type="submit"
                className="acct__btn acct__btn--primary"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
