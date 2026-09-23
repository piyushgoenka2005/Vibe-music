import type { APIRequestContext } from "@playwright/test";

/** True when the app was started with E2E_TEST_MODE (Playwright webServer or test:e2e:prep). */
export async function isE2EServerMode(request: APIRequestContext): Promise<boolean> {
  const res = await request.delete("/api/e2e/password-reset");
  return res.status() !== 404;
}

/** Remove Next.js dev overlay so it does not intercept pointer events in local runs. */
export async function dismissNextDevOverlay(page: import("@playwright/test").Page): Promise<void> {
  await page.evaluate(() => {
    document.querySelectorAll("nextjs-portal").forEach((node) => node.remove());
    document.getElementById("__next-build-watcher")?.remove();
  });
}
