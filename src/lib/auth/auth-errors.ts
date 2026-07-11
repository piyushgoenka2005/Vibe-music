const AUTH_ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Invalid email or password.",
  OAuthSignin: "Google sign-in failed. Please try again.",
  OAuthCallback: "Google sign-in failed. Please try again.",
  OAuthAccountNotLinked:
    "An account with this email already exists. Sign in with email and password first.",
  EmailCreateAccount: "Could not create account. Please try again.",
  CallbackRouteError: "Authentication failed. Please try again.",
  AccessDenied: "Access denied.",
  Configuration:
    "Google sign-in is not configured. Set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET in .env.local.",
  Verification: "The verification link is invalid or has expired.",
  Default: "Something went wrong. Please try again.",
};

export function getAuthErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (!error) return fallback;

  if (typeof error === "string") {
    return AUTH_ERROR_MESSAGES[error] ?? error;
  }

  if (error instanceof Error) {
    const code = error.message.trim();
    if (AUTH_ERROR_MESSAGES[code]) {
      return AUTH_ERROR_MESSAGES[code];
    }
    if (code.length > 0 && code.length < 200) {
      return code;
    }
  }

  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String((error as { code: unknown }).code);
    if (AUTH_ERROR_MESSAGES[code]) {
      return AUTH_ERROR_MESSAGES[code];
    }
  }

  return fallback;
}
