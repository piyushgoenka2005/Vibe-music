import { isFirestoreUnavailableError } from "@/lib/server/firestoreErrors";

export function formatCheckoutError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (isFirestoreUnavailableError(error) || /RESOURCE_EXHAUSTED|Quota exceeded/i.test(message)) {
    return "Checkout is temporarily unavailable due to high traffic. Please try again in a few minutes.";
  }

  if (/Missing Razorpay env vars|RAZORPAY_KEY/i.test(message)) {
    return "Online payments are not configured yet. Please contact support or choose Cash on Delivery.";
  }

  if (/Insufficient stock/i.test(message)) {
    return message;
  }

  if (/Invalid payment signature/i.test(message)) {
    return "Payment verification failed. If you were charged, contact support with your payment ID.";
  }

  return message || "Unable to complete checkout. Please try again.";
}
