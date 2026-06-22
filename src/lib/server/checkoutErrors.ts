import { isFirestoreUnavailableError, isFirestoreFastFailError } from "@/lib/server/firestoreErrors";

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const record = error as {
      message?: string;
      error?: { description?: string; reason?: string };
      description?: string;
    };
    return (
      record.error?.description ??
      record.error?.reason ??
      record.description ??
      record.message ??
      JSON.stringify(error)
    );
  }
  return String(error);
}

export function formatCheckoutError(error: unknown): string {
  const message = extractErrorMessage(error);

  if (/Missing Firebase Admin env vars|FIREBASE_PROJECT_ID|FIREBASE_PRIVATE_KEY/i.test(message)) {
    return "Checkout is not configured on the server. Please contact support.";
  }

  if (/Missing Razorpay env vars|RAZORPAY_KEY/i.test(message)) {
    return "Online payments are not configured yet. Please contact support or choose Cash on Delivery.";
  }

  if (
    /authentication failed|invalid key|bad auth/i.test(message) &&
    /razorpay/i.test(message)
  ) {
    return "Payment gateway authentication failed. Check Razorpay keys on the server.";
  }

  if (isFirestoreFastFailError(error)) {
    return "Checkout timed out while saving your order. Please try again.";
  }

  if (isFirestoreUnavailableError(error) || /RESOURCE_EXHAUSTED|Quota exceeded/i.test(message)) {
    return "Checkout is temporarily unavailable due to high traffic. Please try again in a few minutes.";
  }

  if (/UNAUTHENTICATED|invalid_grant|DECODER routines/i.test(message)) {
    return "Server database authentication failed. Please contact support.";
  }

  if (/Insufficient stock/i.test(message)) {
    return message;
  }

  if (/Invalid payment signature/i.test(message)) {
    return "Payment verification failed. If you were charged, contact support with your payment ID.";
  }

  if (/Product .* unavailable|variant unavailable/i.test(message)) {
    return message;
  }

  return message || "Unable to complete checkout. Please try again.";
}
