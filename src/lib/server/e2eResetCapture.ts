import "server-only";

export interface E2EResetCapture {
  email: string;
  resetUrl: string;
  token: string;
}

let lastCapture: E2EResetCapture | null = null;

export function isE2ETestMode(): boolean {
  return process.env.E2E_TEST_MODE === "true";
}

export function captureResetLinkForE2E(email: string, resetUrl: string): void {
  if (!isE2ETestMode()) return;
  try {
    const url = new URL(resetUrl);
    lastCapture = {
      email,
      resetUrl,
      token: url.searchParams.get("token") ?? "",
    };
  } catch {
    lastCapture = { email, resetUrl, token: "" };
  }
}

export function getLastE2EResetCapture(): E2EResetCapture | null {
  return lastCapture;
}

export function clearE2EResetCapture(): void {
  lastCapture = null;
}
