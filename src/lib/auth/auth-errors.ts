const AUTH_ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Invalid email or password.",
  OAuthSignin: "Google sign-in failed. Please try again.",
  OAuthCallback:
    "Google sign-in failed. Confirm the Google Cloud OAuth redirect URI matches this site.",
  OAuthAccountNotLinked:
    "This email is already registered. Try Google again to link, or use your password.",
  EmailCreateAccount: "Could not create account. Please try again.",
  CallbackRouteError:
    "Google sign-in could not finish. Check the Google redirect URI, then try again.",
  AccessDenied: "Access denied.",
  Configuration:
    "Google sign-in hit a configuration error. Try again, or use email and password.",
  Verification: "The verification link is invalid or has expired.",
  Default: "Something went wrong. Please try again.",
};

function resolveOAuthCallbackHint(): string {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "").trim() ||
    (process.env.NODE_ENV === "production"
      ? "https://vibemusic.in"
      : "http://localhost:3000");
  return `${siteUrl}/api/auth/callback/google`;
}

export function getAuthErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (!error) return fallback;

  const withCallbackHint = (base: string) =>
    `${base} Expected redirect URI: ${resolveOAuthCallbackHint()}.`;

  if (typeof error === "string") {
    if (error === "OAuthCallback" || error === "CallbackRouteError") {
      return withCallbackHint(AUTH_ERROR_MESSAGES[error] ?? AUTH_ERROR_MESSAGES.Default);
    }
    return AUTH_ERROR_MESSAGES[error] ?? error;
  }

  if (error instanceof Error) {
    const code = error.message.trim();
    if (code === "OAuthCallback" || code === "CallbackRouteError") {
      return withCallbackHint(AUTH_ERROR_MESSAGES[code] ?? AUTH_ERROR_MESSAGES.Default);
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
      return withCallbackHint(AUTH_ERROR_MESSAGES[code] ?? AUTH_ERROR_MESSAGES.Default);
    }
    if (AUTH_ERROR_MESSAGES[code]) {
      return AUTH_ERROR_MESSAGES[code];
    }
  }

  return fallback;
}
