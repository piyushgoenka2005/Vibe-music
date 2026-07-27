import { describe, expect, it } from "vitest";
import { sanitizeHtml, escapeHtml } from "@/lib/security/sanitize";

describe("sanitizeHtml", () => {
  it("strips script tags and event handlers", () => {
    const dirty =
      '<p onclick="alert(1)">Hi</p><script>alert(2)</script><a href="javascript:alert(3)">x</a>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toMatch(/script/i);
    expect(clean).not.toMatch(/onclick/i);
    expect(clean).not.toMatch(/javascript:/i);
    expect(clean).toContain("Hi");
  });

  it("strips iframe and comments", () => {
    const dirty = '<!--xss--><iframe src="evil"></iframe><p>ok</p>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toMatch(/iframe/i);
    expect(clean).not.toMatch(/<!--/);
    expect(clean).toContain("ok");
  });
});

describe("escapeHtml", () => {
  it("escapes markup characters", () => {
    expect(escapeHtml(`<a href="x">'&`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&#39;&amp;"
    );
  });
});
