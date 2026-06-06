"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/lib/routes";

export default function LoginForm() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("demo@sweetwater.com");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    login(email.trim());
    router.push(ROUTES.account);
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 420 }}>
      <label htmlFor="login-email" style={{ display: "block", marginBottom: 8 }}>
        Email
      </label>
      <input
        id="login-email"
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
        Log In
      </button>
      <p style={{ marginTop: 16, fontSize: 14, color: "#807f7e" }}>
        Need an account?{" "}
        <Link href={ROUTES.register} style={{ color: "#0072ba" }}>
          Create one
        </Link>
      </p>
    </form>
  );
}
