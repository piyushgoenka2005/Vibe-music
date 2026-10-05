import type { GoogleAuthUnavailableReason } from "@/lib/auth/google-config";

export type { GoogleAuthUnavailableReason };

interface GoogleAuthUnavailableNoteProps {
  reason?: GoogleAuthUnavailableReason;
}

/** Shopper-facing note when Google OAuth cannot run (missing env or database). */
export default function GoogleAuthUnavailableNote({
  reason = "oauth",
}: GoogleAuthUnavailableNoteProps) {
  const message =
    reason === "database"
      ? "Google sign-in needs the database online. On local dev run npm run db:start (or restart npm run dev — it starts Postgres automatically on Windows), confirm DATABASE_URL in .env.local, then refresh this page."
      : reason === "oauth_deleted"
        ? process.env.NODE_ENV === "production"
          ? "Google sign-in is temporarily unavailable while we update our login settings. Please use your email and password below."
          : "Google sign-in is off because the OAuth client in .env.local was deleted in Google Cloud. Create a new Web client (project vibemusic2026), then run npm run setup:google-oauth and restart npm run dev."
        : reason === "oauth_invalid"
          ? process.env.NODE_ENV === "production"
            ? "Google sign-in is being reconfigured. Please use your email and password below for now."
            : "Google OAuth credentials in .env.local are invalid. Run npm run setup:google-oauth with a new client id/secret from Google Cloud Console, then restart npm run dev."
          : "Google sign-in is unavailable on this store right now. Continue with your email and password below.";

  return (
    <p className="auth-google-unavailable" role="note">
      {message}
    </p>
  );
}
