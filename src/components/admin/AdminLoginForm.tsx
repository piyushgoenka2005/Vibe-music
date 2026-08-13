"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setError(null);
    try {
      await signIn(values);

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
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      disabled={isLoading}
                      className="pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed"
                      onClick={() => setShowPassword((prev) => !prev)}
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <button type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading ? "Signing in…" : "Admin Login"}
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
