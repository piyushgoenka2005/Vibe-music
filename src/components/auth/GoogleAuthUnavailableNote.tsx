/** Shopper-facing note when Google OAuth env is not configured. */
export default function GoogleAuthUnavailableNote() {
  return (
    <p className="auth-google-unavailable" role="note">
      Google sign-in is unavailable on this store right now. Continue with your
      email and password below.
    </p>
  );
}
