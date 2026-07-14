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

  if (/DATABASE_URL|Can't reach database|connection refused/i.test(message)) {
    return "Checkout is temporarily unavailable. Please try again in a few minutes.";
  }

  if (/Missing Razorpay env vars|RAZORPAY_KEY/i.test(message)) {
    return "Online payments are not configured yet. Please contact support.";
  }

  if (
    /authentication failed|invalid key|bad auth/i.test(message) &&
    /razorpay/i.test(message)
  ) {
    return "Payment gateway authentication failed. Check Razorpay keys on the server.";
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
