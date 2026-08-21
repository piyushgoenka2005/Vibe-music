"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function AdminLoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const signIn = useAuthStore((s) => s.signIn);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [error, setError] = useState<string | null>(null);

  // Two-factor: revealed after a pre-check when the account requires a code.
  const [needsTotp, setNeedsTotp] = useState(false);
  const [totpCode, setTotpCode] = useState("");

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setError(null);
    try {
      if (!needsTotp) {
        // Pre-check so the code field appears BEFORE the first failed attempt.
        const statusRes = await fetch(
          `/api/auth/2fa/status?email=${encodeURIComponent(values.email)}`
        );
        if (statusRes.ok) {
          const status = (await statusRes.json()) as { totpRequired?: boolean };
          if (status.totpRequired && !totpCode.trim()) {
            setNeedsTotp(true);
            return;
          }
        }
      }

      await signIn({ ...values, totp: totpCode.trim() || undefined });

      const adminRes = await fetch("/api/admin/me");
      if (!adminRes.ok) {
        await useAuthStore.getState().logout();
        throw new Error("This account does not have admin access.");
      }

      await fetch("/api/admin/me", { method: "POST" });
      await queryClient.invalidateQueries({ queryKey: ["admin-session"] });
      router.replace(ROUTES.admin);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error && err.message.includes("admin access")
          ? err.message
          : getAuthErrorMessage(err, "Admin sign in failed.")
      );
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
                  <PasswordInput
                    autoComplete="current-password"
                    disabled={isLoading}
                    {...field}
                  />
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
                onChange={(event) =>
                  setTotpCode(event.target.value.replace(/[^\d\s]/g, ""))
                }
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
