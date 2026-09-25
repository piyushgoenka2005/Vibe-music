import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export const E2E_USER_A_STORAGE_PATH = "e2e/.auth/user-a.json";
export const E2E_USER_B_STORAGE_PATH = "e2e/.auth/user-b.json";

export async function createCustomerStorageState(
  page: Page,
  email: string,
  password: string,
  storagePath: string,
): Promise<void> {
  const csrfRes = await page.request.get("/api/auth/csrf");
  expect(csrfRes.ok(), `csrf endpoint failed: ${csrfRes.status()}`).toBeTruthy();
  const { csrfToken } = (await csrfRes.json()) as { csrfToken?: string };
  expect(csrfToken, "missing csrfToken").toBeTruthy();

  const signInRes = await page.request.post("/api/auth/callback/credentials", {
    form: {
      csrfToken: csrfToken!,
      email,
      password,
      remember: "false",
      redirect: "false",
      json: "true",
      callbackUrl: "/account",
    },
  });

  const signInBody = await signInRes.text();
  expect(
    signInRes.ok() || signInRes.status() === 302,
    `customer credentials sign-in failed: ${signInRes.status()} ${signInBody}`,
  ).toBeTruthy();

  const sessionRes = await page.request.get("/api/auth/session");
  const session = (await sessionRes.json()) as { user?: { email?: string } };
  expect(session.user?.email?.toLowerCase(), "session email mismatch").toBe(
    email.trim().toLowerCase(),
  );

  await page.context().storageState({ path: storagePath });
}
