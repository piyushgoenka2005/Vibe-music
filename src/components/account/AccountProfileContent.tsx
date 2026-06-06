"use client";

import { useAuthStore } from "@/store/authStore";

export default function AccountProfileContent() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  if (!user) {
    return (
      <p style={{ color: "#807f7e" }}>
        Sign in to manage your profile and payment preferences.
      </p>
    );
  }

  return (
    <>
      <p style={{ margin: "0 0 8px" }}>
        <strong>Name:</strong> {user.name}
      </p>
      <p style={{ margin: "0 0 16px" }}>
        <strong>Email:</strong> {user.email}
      </p>
      <button
        type="button"
        onClick={() => {
          void logout();
        }}
        style={{
          border: "1px solid #d1d0cf",
          background: "#fff",
          borderRadius: 3,
          padding: "8px 16px",
          cursor: "pointer",
        }}
      >
        Sign Out
      </button>
    </>
  );
}
