const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/user-not-found": "No account found with this email.",
  "auth/wrong-password": "Incorrect password. Try again.",
  "auth/invalid-credential": "Invalid email or password.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/popup-closed-by-user": "Sign-in was cancelled.",
  "auth/popup-blocked": "Pop-up was blocked. Allow pop-ups and try again.",
  "auth/account-exists-with-different-credential":
    "An account already exists with this email using a different sign-in method.",
  "auth/operation-not-allowed":
    "This sign-in method is not enabled. Check Firebase Authentication settings.",
  "auth/internal-error":
    "Sign-in could not complete. Check Firebase env vars, enable Email/Google in Firebase Console, and add localhost to Authorized domains.",
  "auth/network-request-failed":
    "Network error while signing in. Check your connection and try again.",
  "auth/invalid-api-key":
    "Firebase API key is invalid. Check NEXT_PUBLIC_FIREBASE_* values in .env.local.",
  "permission-denied":
    "Firestore access denied. Deploy firestore.rules in Firebase Console → Firestore → Rules.",
};

export function getFirebaseErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = String((error as { code: string }).code);
    if (FIREBASE_ERROR_MESSAGES[code]) {
      return FIREBASE_ERROR_MESSAGES[code];
    }
  }

  if (error instanceof Error && error.message) {
    const codeMatch = error.message.match(/auth\/[\w-]+/);
    if (codeMatch && FIREBASE_ERROR_MESSAGES[codeMatch[0]]) {
      return FIREBASE_ERROR_MESSAGES[codeMatch[0]];
    }

    if (/insufficient permissions/i.test(error.message)) {
      return FIREBASE_ERROR_MESSAGES["permission-denied"];
    }

    if (/Missing Firebase client env vars/i.test(error.message)) {
      return error.message;
    }

    return error.message;
  }

  return fallback;
}
