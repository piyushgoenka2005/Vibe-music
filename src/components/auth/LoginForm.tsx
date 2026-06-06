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

export default function LoginForm() {
  const isClient = useIsClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || ROUTES.account;
  const redirectQuery = searchParams.get("redirect");
  const registerHref = redirectQuery
    ? `${ROUTES.register}?redirect=${encodeURIComponent(redirectQuery)}`
    : ROUTES.register;

  const signIn = useAuthStore((s) => s.signIn);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const isLoading = useAuthStore((s) => s.isLoading);
  const clearError = useAuthStore((s) => s.clearError);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  useRedirectIfAuthenticated(redirectTo);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setResetSent(false);

    try {
      await signIn({ email: email.trim(), password });
      router.push(redirectTo);
    } catch (err) {
      setError(getFirebaseErrorMessage(err, "Sign in failed."));
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setResetSent(false);

    try {
      await signInWithGoogle();
      router.push(redirectTo);
    } catch (err) {
      setError(getFirebaseErrorMessage(err, "Google sign in failed."));
    }
  }

  async function handleForgotPassword(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setResetSent(false);

    if (!email.trim()) {
      setError("Enter your email address to reset your password.");
      return;
    }

    try {
      await resetPassword(email.trim());
      setResetSent(true);
      setShowForgot(false);
    } catch (err) {
      setError(getFirebaseErrorMessage(err, "Password reset failed."));
    }
  }

  if (!isClient) {
    return <AuthFormSkeleton />;
  }

  return (
    <>
      {error ? <div className="auth-error">{error}</div> : null}
      {resetSent ? (
        <div className="auth-success">
          Password reset email sent. Check your inbox for {email.trim()}.
        </div>
      ) : null}

      <GoogleSignInButton onClick={handleGoogleSignIn} disabled={isLoading} />

      <div className="auth-divider">or</div>

      {showForgot ? (
        <form className="auth-forgot" onSubmit={handleForgotPassword}>
          <h2 className="auth-forgot__title">Reset your password</h2>
          <p className="auth-forgot__text">
            Enter the email for your account and we&apos;ll send a reset link.
          </p>
          <div className="auth-form">
            <div className="auth-field">
              <label htmlFor="login-email-forgot">Email</label>
              <AuthInput
                id="login-email-forgot"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              className="auth-btn auth-btn--primary"
              disabled={isLoading}
            >
              {isLoading ? "Sending…" : "Send Reset Link"}
            </button>
            <button
              type="button"
              className="auth-link"
              onClick={() => setShowForgot(false)}
              disabled={isLoading}
            >
              Back to sign in
            </button>
          </div>
        </form>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="login-email">Email</label>
            <AuthInput
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <AuthInput
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="auth-row">
            <span />
            <button
              type="button"
              className="auth-link"
              onClick={() => {
                setShowForgot(true);
                setError(null);
              }}
              disabled={isLoading}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="auth-btn auth-btn--primary"
            disabled={isLoading}
          >
            {isLoading ? "Signing in…" : "Log In"}
          </button>
        </form>
      )}

      <p className="auth-footer">
        Need an account? <Link href={registerHref}>Create one</Link>
      </p>
    </>
  );
}
