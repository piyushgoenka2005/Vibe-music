"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/lib/routes";

export default function RegisterForm() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    login(email.trim(), name.trim() || undefined);
    router.push(ROUTES.account);
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 420 }}>
      <label htmlFor="register-name" style={{ display: "block", marginBottom: 8 }}>
        Name
      </label>
      <input
        id="register-name"
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        style={{
          width: "100%",
          padding: "10px 12px",
          border: "1px solid #d1d0cf",
          borderRadius: 3,
          marginBottom: 16,
        }}
      />
      <label htmlFor="register-email" style={{ display: "block", marginBottom: 8 }}>
        Email
      </label>
      <input
        id="register-email"
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        style={{
          width: "100%",
          padding: "10px 12px",
          border: "1px solid #d1d0cf",
          borderRadius: 3,
          marginBottom: 16,
        }}
      />
      <button
        type="submit"
        style={{
          background: "#0072ba",
          color: "#fff",
          border: 0,
          borderRadius: 3,
          padding: "10px 20px",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Create Account
      </button>
      <p style={{ marginTop: 16, fontSize: 14, color: "#807f7e" }}>
        Already have an account?{" "}
        <Link href={ROUTES.login} style={{ color: "#0072ba" }}>
          Log in
        </Link>
      </p>
    </form>
  );
}
