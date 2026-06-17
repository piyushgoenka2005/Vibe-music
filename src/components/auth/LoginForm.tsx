"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import AuthDivider from "@/components/auth/AuthDivider";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { getFirebaseErrorMessage } from "@/lib/auth/firebase-errors";
import { ROUTES } from "@/lib/routes";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import { useAuthStore } from "@/store/authStore";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || ROUTES.account;
  const registerHref = searchParams.get("redirect")
    ? `${ROUTES.register}?redirect=${encodeURIComponent(searchParams.get("redirect")!)}`
    : ROUTES.register;
  const adminLoginHref = searchParams.get("redirect")
    ? `${ROUTES.adminLogin}?redirect=${encodeURIComponent(searchParams.get("redirect")!)}`
    : ROUTES.adminLogin;

  const signIn = useAuthStore((s) => s.signIn);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setError(null);
    try {
      await signIn(values);
      router.push(redirectTo);
    } catch (err) {
      setError(getFirebaseErrorMessage(err, "Sign in failed."));
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    try {
      await signInWithGoogle();
      router.push(redirectTo);
    } catch (err) {
      setError(getFirebaseErrorMessage(err, "Google sign in failed."));
    }
  }

  return (
    <>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <GoogleSignInButton onClick={handleGoogleSignIn} disabled={isLoading} />

      <AuthDivider />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="auth-shell__form"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="auth-shell__field">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="auth-shell__field">
                <div className="auth-shell__field-row">
                  <FormLabel>Password</FormLabel>
                  <Link href={ROUTES.forgotPassword} className="auth-link">
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <button type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading ? "Signing in…" : "Log In"}
          </button>

          <Link href={adminLoginHref} className="auth-secondary-btn">
            Admin Login
          </Link>
        </form>
      </Form>

      <p className="auth-inline-footer">
        Need an account?{" "}
        <Link href={registerHref} className="auth-link">
          Create one
        </Link>
      </p>
    </>
  );
}
