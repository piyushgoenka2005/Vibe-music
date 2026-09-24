export type GoogleAuthUnavailableReason = "oauth" | "database";

interface GoogleAuthUnavailableNoteProps {
  reason?: GoogleAuthUnavailableReason;
}

/** Shopper-facing note when Google OAuth cannot run (missing env or database). */
export default function GoogleAuthUnavailableNote({
  reason = "oauth",
}: GoogleAuthUnavailableNoteProps) {
  const message =
    reason === "database"
      ? "Google sign-in needs the database online. On local dev run npm run db:start, confirm DATABASE_URL (port 5432), then restart the dev server."
      : "Google sign-in is unavailable on this store right now. Continue with your email and password below.";

  return (
    <p className="auth-google-unavailable" role="note">
      {message}
    </p>
  );
}
