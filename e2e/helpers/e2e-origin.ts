/** Origin for CSRF-safe Playwright API mutations (matches PLAYWRIGHT_BASE_URL). */
export const E2E_ORIGIN =
  process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export function e2eMutationHeaders(): Record<string, string> {
  return {
    Origin: E2E_ORIGIN,
    Referer: `${E2E_ORIGIN}/`,
    "Content-Type": "application/json",
  };
}
