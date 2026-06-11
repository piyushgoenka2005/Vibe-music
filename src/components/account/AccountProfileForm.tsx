"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useAccountProfileStore } from "@/store/accountProfileStore";

interface ProfileFormFieldsProps {
  userId: string;
  userEmail: string;
  initialName: string;
  initialPhone: string;
  initialDob: string;
  onSave: (values: {
    name: string;
    phone: string;
    dateOfBirth: string;
  }) => Promise<void>;
}

function ProfileFormFields({
  userId,
  userEmail,
  initialName,
  initialPhone,
  initialDob,
  onSave,
}: ProfileFormFieldsProps) {
  const [name, setName] = useState(initialName);
  const [phoneValue, setPhoneValue] = useState(initialPhone);
  const [dob, setDob] = useState(initialDob);
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
      await onSave({
        name: name.trim(),
        phone: phoneValue.trim(),
        dateOfBirth: dob,
      });
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

  return (
    <>
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
            <label className="acct__label" htmlFor={`profile-name-${userId}`}>
              Full Name
            </label>
            <input
              id={`profile-name-${userId}`}
              className="acct__input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>

          <div className="acct__field">
            <label className="acct__label" htmlFor={`profile-email-${userId}`}>
              Email
            </label>
            <input
              id={`profile-email-${userId}`}
              className="acct__input"
              type="email"
              value={userEmail}
              disabled
              autoComplete="email"
            />
          </div>

          <div className="acct__field">
            <label className="acct__label" htmlFor={`profile-phone-${userId}`}>
              Phone
            </label>
            <input
              id={`profile-phone-${userId}`}
              className="acct__input"
              type="tel"
              value={phoneValue}
              onChange={(e) => setPhoneValue(e.target.value)}
              placeholder="+91 98765 43210"
              autoComplete="tel"
            />
          </div>

          <div className="acct__field">
            <label className="acct__label" htmlFor={`profile-dob-${userId}`}>
              Date of Birth
            </label>
            <input
              id={`profile-dob-${userId}`}
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
    </>
  );
}

export default function AccountProfileForm() {
  const user = useAuthStore((s) => s.user);
  const updateDisplayName = useAuthStore((s) => s.updateDisplayName);
  const phone = useAccountProfileStore((s) => s.phone);
  const dateOfBirth = useAccountProfileStore((s) => s.dateOfBirth);
  const setPhone = useAccountProfileStore((s) => s.setPhone);
  const setDateOfBirth = useAccountProfileStore((s) => s.setDateOfBirth);

  if (!user) return null;

  return (
    <div>
      <h2 className="acct__section-title">Profile</h2>
      <p className="acct__section-sub">
        Update your personal information and contact details.
      </p>

      <div className="acct__card">
        <div className="acct__card-body">
          <ProfileFormFields
            key={`${user.id}-${phone}-${dateOfBirth}-${user.name ?? ""}`}
            userId={user.id}
            userEmail={user.email}
            initialName={user.name ?? ""}
            initialPhone={phone}
            initialDob={dateOfBirth}
            onSave={async ({ name, phone: nextPhone, dateOfBirth: nextDob }) => {
              if (name && name !== user.name) {
                await updateDisplayName(name);
              }
              setPhone(nextPhone);
              setDateOfBirth(nextDob);
            }}
          />
        </div>
      </div>
    </div>
  );
}
