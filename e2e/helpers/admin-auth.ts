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
  await locator.pressSequentially(value, { delay: 20 });

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

export async function loginAsE2EAdmin(page: Page): Promise<void> {
  await page.goto("/admin/login", { waitUntil: "load" });
  await expect(page.getByRole("heading", { name: /Admin Login/i })).toBeVisible();

  const emailInput = page.locator('input[name="email"]');
  const passwordInput = page.locator('input[name="password"]');

  await fillReactInput(emailInput, E2E_ADMIN_EMAIL);
  await fillReactInput(passwordInput, E2E_ADMIN_PASSWORD);

  await Promise.all([
    page.waitForURL(/\/admin(?:\/)?$/, { timeout: 45_000 }),
    page.getByRole("button", { name: /Admin Login/i }).click(),
  ]);
}
