"use client";

import { useEffect, useState } from "react";
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
import { getAuthErrorMessage } from "@/lib/auth/auth-errors";
import { ROUTES } from "@/lib/routes";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import { useAuthStore } from "@/store/authStore";

interface LoginFormProps {
  googleAuthEnabled?: boolean;
}

export default function LoginForm({ googleAuthEnabled = false }: LoginFormProps) {
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
  const authErrorParam = searchParams.get("error");
  const [formError, setFormError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [seenErrorParam, setSeenErrorParam] = useState<string | null>(null);

  if (authErrorParam && authErrorParam !== seenErrorParam) {
    setSeenErrorParam(authErrorParam);
    setUrlError(getAuthErrorMessage(authErrorParam, "Sign in failed."));
  }

  const error = formError ?? urlError;

  useEffect(() => {
    if (!authErrorParam) return;

    // Drop ?error= from the URL so a refresh doesn't re-show the banner.
    const params = new URLSearchParams(searchParams.toString());
    params.delete("error");
    const query = params.toString();
    router.replace(query ? `${ROUTES.login}?${query}` : ROUTES.login, {
      scroll: false,
    });
  }, [authErrorParam, searchParams, router]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    try {
      await signIn(values);
      router.push(redirectTo);
    } catch (err) {
      setFormError(getAuthErrorMessage(err, "Sign in failed."));
    }
  }

  async function handleGoogleSignIn() {
    if (!googleAuthEnabled) {
      setFormError(
        "Google sign-in is not configured. Add AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET to .env.local."
      );
      return;
    }
    setFormError(null);
    try {
      await signInWithGoogle(redirectTo);
    } catch (err) {
      setFormError(getAuthErrorMessage(err, "Google sign in failed."));
    }
  }

  return (
    <>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {googleAuthEnabled ? (
        <>
          <GoogleSignInButton onClick={handleGoogleSignIn} disabled={isLoading} />
          <AuthDivider />
        </>
      ) : null}

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

          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="auth-shell__field">
                <label className="auth-shell__field-row">
                  <input
                    type="checkbox"
                    checked={Boolean(field.value)}
                    onChange={(event) => field.onChange(event.target.checked)}
                    disabled={isLoading}
                  />
                  <span>Remember me</span>
                </label>
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
