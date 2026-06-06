"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import AuthFormSkeleton from "@/components/auth/AuthFormSkeleton";
import AuthInput from "@/components/auth/AuthInput";
import { getFirebaseErrorMessage } from "@/lib/auth/firebase-errors";
import { ROUTES } from "@/lib/routes";
import { useIsClient } from "@/hooks/useIsClient";
import { useRedirectIfAuthenticated } from "@/hooks/useRedirectIfAuthenticated";
import { useAuthStore } from "@/store/authStore";

export default function RegisterForm() {
  const isClient = useIsClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || ROUTES.account;
  const redirectQuery = searchParams.get("redirect");
  const loginHref = redirectQuery
    ? `${ROUTES.login}?redirect=${encodeURIComponent(redirectQuery)}`
    : ROUTES.login;

  const signUp = useAuthStore((s) => s.signUp);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const isLoading = useAuthStore((s) => s.isLoading);
  const clearError = useAuthStore((s) => s.clearError);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  useRedirectIfAuthenticated(redirectTo);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      await signUp({
        email: email.trim(),
        password,
        displayName: name.trim() || undefined,
      });
      router.push(redirectTo);
    } catch (err) {
      setError(getFirebaseErrorMessage(err, "Sign up failed."));
    }
  }

  async function handleGoogleSignIn() {
    setError(null);

    try {
      await signInWithGoogle();
      router.push(redirectTo);
    } catch (err) {
      setError(getFirebaseErrorMessage(err, "Google sign up failed."));
    }
  }

  if (!isClient) {
    return <AuthFormSkeleton />;
  }

  return (
    <>
      {error ? <div className="auth-error">{error}</div> : null}

      <GoogleSignInButton
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        label="Sign up with Google"
      />

      <div className="auth-divider">or</div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="register-name">Full name</label>
          <AuthInput
            id="register-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isLoading}
            placeholder="Your name"
          />
        </div>

        <div className="auth-field">
          <label htmlFor="register-email">Email</label>
          <AuthInput
            id="register-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isLoading}
            placeholder="you@example.com"
          />
        </div>

        <div className="auth-field">
          <label htmlFor="register-password">Password</label>
          <AuthInput
            id="register-password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isLoading}
            placeholder="At least 6 characters"
          />
          <span className="auth-field__hint">Must be at least 6 characters.</span>
        </div>

        <button
          type="submit"
          className="auth-btn auth-btn--primary"
          disabled={isLoading}
        >
          {isLoading ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <p className="auth-footer">
        Already have an account? <Link href={loginHref}>Log in</Link>
      </p>
    </>
  );
}
