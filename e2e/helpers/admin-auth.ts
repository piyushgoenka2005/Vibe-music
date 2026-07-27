import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import {
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_PASSWORD,
} from "./e2e-credentials";

export const E2E_ADMIN_STORAGE_PATH = "e2e/.auth/admin.json";

async function fillReactInput(locator: Locator, value: string): Promise<void> {
  await locator.waitFor({ state: "visible" });
  await locator.click({ clickCount: 3 });
  await locator.fill("");
  await locator.pressSequentially(value, { delay: 15 });

  if ((await locator.inputValue()) !== value) {
    await locator.evaluate((node, next) => {
      const input = node as HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      )?.set;
      setter?.call(input, next);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      input.dispatchEvent(new Event("blur", { bubbles: true }));
    }, value);
  }

  await expect(locator).toHaveValue(value, { timeout: 10_000 });
}

/**
 * Establish an authenticated admin browser session via Auth.js credentials
 * callback (CSRF + cookie) using page.request so cookies land in the browser context.
 */
export async function createE2EAdminStorageState(
  page: Page,
  storagePath: string
): Promise<void> {
  const csrfRes = await page.request.get("/api/auth/csrf");
  expect(csrfRes.ok(), `csrf endpoint failed: ${csrfRes.status()}`).toBeTruthy();
  const { csrfToken } = (await csrfRes.json()) as { csrfToken?: string };
  expect(csrfToken, "missing csrfToken").toBeTruthy();

  const signInRes = await page.request.post("/api/auth/callback/credentials", {
    form: {
      csrfToken: csrfToken!,
      email: E2E_ADMIN_EMAIL,
      password: E2E_ADMIN_PASSWORD,
      remember: "false",
      redirect: "false",
      json: "true",
      callbackUrl: "/admin",
    },
  });

  const signInBody = await signInRes.text();
  expect(
    signInRes.ok() || signInRes.status() === 302,
    `credentials sign-in failed: ${signInRes.status()} ${signInBody}`
  ).toBeTruthy();

  const sessionRes = await page.request.get("/api/auth/session");
  const session = (await sessionRes.json()) as { user?: { email?: string } };
  expect(
    session.user?.email,
    `session missing after credentials login: ${JSON.stringify(session)} body=${signInBody}`
  ).toBeTruthy();

  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/admin(?:\/)?$/, { timeout: 30_000 });

  const me = await page.request.get("/api/admin/me");
  expect(me.ok(), `admin/me after login: ${me.status()}`).toBeTruthy();

  await page.context().storageState({ path: storagePath });
}

/** UI login path — used for explicit Admin Login E2E coverage. */
export async function loginAsE2EAdmin(page: Page): Promise<void> {
  await page.goto("/admin/login", { waitUntil: "load" });
  await expect(page.getByRole("heading", { name: /Admin Login/i })).toBeVisible();

  const emailInput = page.locator('input[name="email"]');
  const passwordInput = page.locator('input[name="password"]');

  await fillReactInput(emailInput, E2E_ADMIN_EMAIL);
  await fillReactInput(passwordInput, E2E_ADMIN_PASSWORD);

  await page.getByRole("button", { name: /Admin Login/i }).click();

  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    if (/\/admin(?:\/)?$/.test(new URL(page.url()).pathname) && !page.url().includes("/login")) {
      return;
    }
    const err = page
      .locator('[role="alert"]')
      .filter({ hasText: /sign in|admin access|failed|invalid/i });
    if (await err.isVisible().catch(() => false)) {
      throw new Error(`Admin UI login failed: ${await err.innerText()}`);
    }
    await page.waitForTimeout(250);
  }

  throw new Error(`Admin UI login did not reach /admin (stuck at ${page.url()})`);
}
