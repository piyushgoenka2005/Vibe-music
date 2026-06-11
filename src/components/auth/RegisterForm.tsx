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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { getFirebaseErrorMessage } from "@/lib/auth/firebase-errors";
import { ROUTES } from "@/lib/routes";
import { registerSchema, type RegisterFormValues } from "@/lib/validations/auth";
import { useAuthStore } from "@/store/authStore";

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || ROUTES.account;
  const loginHref = searchParams.get("redirect")
    ? `${ROUTES.login}?redirect=${encodeURIComponent(searchParams.get("redirect")!)}`
    : ROUTES.login;

  const signUp = useAuthStore((s) => s.signUp);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setError(null);
    try {
      await signUp({
        email: values.email,
        password: values.password,
        displayName: values.name,
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

  return (
    <>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <GoogleSignInButton
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        label="Sign up with Google"
      />

      <AuthDivider />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="auth-shell__form"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="auth-shell__field">
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="name"
                    placeholder="Your name"
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
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormDescription className="auth-shell__hint">
                  At least 8 characters with a letter and a number.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="auth-shell__field">
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <button type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading ? "Creating account…" : "Create Account"}
          </button>
        </form>
      </Form>

      <p className="auth-inline-footer">
        Already have an account?{" "}
        <Link href={loginHref} className="auth-link">
          Log in
        </Link>
      </p>
    </>
  );
}
