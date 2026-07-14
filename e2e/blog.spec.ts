import { test, expect } from "./fixtures";

test.describe("blog production", () => {
  test("blog index loads with h1", async ({ page }) => {
    await page.goto("/blog", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1, name: "Blog" })).toBeVisible();
  });

  test("blog RSS feed responds", async ({ request }) => {
    const response = await request.get("/blog/rss.xml");
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    expect(body).toContain("<rss");
  });

  test("blog posts API responds", async ({ request }) => {
    const response = await request.get("/api/blog/posts?limit=3");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(Array.isArray(body.posts)).toBeTruthy();
  });

  test("blog comment endpoint validates input", async ({ request }) => {
    const response = await request.post("/api/blog/posts/home-studio-essentials-2026/comments", {
      data: { authorName: "A", email: "bad", body: "short" },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});
