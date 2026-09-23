"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { PasswordInput } from "@/components/ui/password-input";
import { getAuthErrorMessage } from "@/lib/auth/auth-errors";
import { ROUTES } from "@/lib/routes";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import { useAuthStore } from "@/store/authStore";
import type { AdminSession } from "@/types/admin";

type AdminLoginResponse =
  { ok: true; admin: AdminSession } | { ok?: false; error?: string; code?: string };

export default function AdminLoginForm() {
  const queryClient = useQueryClient();
  const setSessionUser = useAuthStore((s) => s.setSessionUser);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsTotp, setNeedsTotp] = useState(false);
  const [totpCode, setTotpCode] = useState("");

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          totp: totpCode.trim() || undefined,
        }),
      });

      const payload = (await res.json().catch(() => ({}))) as AdminLoginResponse;

      if (!res.ok || !("ok" in payload && payload.ok === true)) {
        if ("code" in payload && payload.code === "totp_required") {
          setNeedsTotp(true);
          setError(null);
          setIsLoading(false);
          return;
        }

        throw new Error(("error" in payload && payload.error) || "Admin sign in failed.");
      }

      // Seed client caches so /admin paints without waiting for /api/admin/me.
      queryClient.setQueryData(["admin-session"], payload.admin);
      setSessionUser({
        id: payload.admin.uid,
        email: payload.admin.email,
        name: payload.admin.displayName,
        photoURL: null,
      });

      // Hard navigate so the next document request carries the new cookie
      // and the server layout bootstraps immediately.
      window.location.assign(ROUTES.admin);
    } catch (err) {
      setError(getAuthErrorMessage(err, "Admin sign in failed."));
      setIsLoading(false);
    }
  }

  return (
    <>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="auth-shell__form">
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
                    placeholder="admin@vibemusic.in"
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
                  <PasswordInput autoComplete="current-password" disabled={isLoading} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {needsTotp ? (
            <div className="auth-shell__field">
              <label className="text-sm font-medium" htmlFor="admin-totp">
                Two-factor code
              </label>
              <Input
                id="admin-totp"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6-digit code"
                maxLength={7}
                value={totpCode}
                onChange={(event) => setTotpCode(event.target.value.replace(/[^\d\s]/g, ""))}
                disabled={isLoading}
              />
            </div>
          ) : null}

          <button type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading ? "Signing in…" : needsTotp ? "Verify & Sign in" : "Admin Login"}
          </button>
        </form>
      </Form>

      <p className="auth-inline-footer">
        <Link href={ROUTES.home} className="auth-link">
          ← Back to store
        </Link>
      </p>
    </>
  );
}
