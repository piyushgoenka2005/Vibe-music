const AUTH_ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Invalid email or password.",
  totp_required: "Enter the 6-digit code from your authenticator app.",
  OAuthSignin: "Google sign-in failed. Please try again or use email and password.",
  OAuthCallback: "Google sign-in failed. Please try again or use email and password.",
  OAuthAccountNotLinked:
    "This email already has a password account. Sign in with your email and password — Google will link automatically on the next Google sign-in when linking is enabled.",
  EmailCreateAccount: "Could not create account. Please try again.",
  CallbackRouteError:
    "Google sign-in could not finish. Please try again or use email and password.",
  AccessDenied:
    "We could not finish Google sign-in for this account. Sign in with email and password first, then try Google again to link.",
  Configuration: "Google sign-in is temporarily unavailable. Please use email and password.",
  Verification: "The verification link is invalid or has expired.",
  Default: "Something went wrong. Please try again.",
};

function resolveOAuthCallbackHint(): string {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "").trim() ||
    (process.env.NODE_ENV === "production" ? "https://vibemusic.in" : "http://localhost:3000");
  return `${siteUrl}/api/auth/callback/google`;
}

function withDevCallbackHint(base: string): string {
  if (process.env.NODE_ENV === "production") return base;
  return `${base} Dev hint — expected redirect URI: ${resolveOAuthCallbackHint()}.`;
}

export function getAuthErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (!error) return fallback;

  if (typeof error === "string") {
    if (error === "OAuthCallback" || error === "CallbackRouteError") {
      return withDevCallbackHint(AUTH_ERROR_MESSAGES[error] ?? AUTH_ERROR_MESSAGES.Default);
    }
    return AUTH_ERROR_MESSAGES[error] ?? error;
  }

  if (error instanceof Error) {
    const code = error.message.trim();
    if (code === "OAuthCallback" || code === "CallbackRouteError") {
      return withDevCallbackHint(AUTH_ERROR_MESSAGES[code] ?? AUTH_ERROR_MESSAGES.Default);
    }
    if (AUTH_ERROR_MESSAGES[code]) {
      return AUTH_ERROR_MESSAGES[code];
    }
    if (code.length > 0 && code.length < 200) {
      return code;
    }
  }

  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String((error as { code: unknown }).code);
    if (code === "OAuthCallback" || code === "CallbackRouteError") {
      return withDevCallbackHint(AUTH_ERROR_MESSAGES[code] ?? AUTH_ERROR_MESSAGES.Default);
    }
    if (AUTH_ERROR_MESSAGES[code]) {
      return AUTH_ERROR_MESSAGES[code];
    }
  }

  return fallback;
}
