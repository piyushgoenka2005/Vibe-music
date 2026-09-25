import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { downloadFromApi } from "./downloadFromApi";

describe("downloadFromApi", () => {
  let clickSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clickSpy = vi.fn();
    const anchor = { click: clickSpy, remove: vi.fn(), style: {}, href: "", rel: "" };
    vi.stubGlobal("window", { location: { origin: "http://localhost:3000" } });
    vi.stubGlobal("document", {
      createElement: vi.fn(() => anchor),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates an anchor with same-origin absolute URL and triggers click", () => {
    downloadFromApi("/api/admin/customers?export=csv");
    expect(clickSpy).toHaveBeenCalledOnce();
    expect(document.createElement).toHaveBeenCalledWith("a");
  });
});
