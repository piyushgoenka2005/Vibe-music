import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearStorefrontBackIntent,
  markStorefrontBackIntent,
  peekStorefrontBackIntent,
  recordStorefrontNavigation,
  getPreviousStorefrontPath,
  getStorefrontNavStackPaths,
  rewindStorefrontStackTo,
} from "@/lib/navigation/storefrontHistory";

function mockSessionStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  });
  return store;
}

describe("storefrontHistory back intent", () => {
  beforeEach(() => {
    mockSessionStorage();
    vi.stubGlobal("window", {
      ...globalThis,
      location: { pathname: "/product/a", search: "" },
      dispatchEvent: vi.fn(),
    });
    vi.stubGlobal("document", {
      referrer: "",
    });
  });

  it("peek survives without consuming; clear removes intent", () => {
    markStorefrontBackIntent("/");
    expect(peekStorefrontBackIntent("/")).toBe(true);
    expect(peekStorefrontBackIntent("/")).toBe(true);
    clearStorefrontBackIntent();
    expect(peekStorefrontBackIntent("/")).toBe(false);
  });

  it("records and rewinds the nav stack", () => {
    recordStorefrontNavigation("/");
    recordStorefrontNavigation("/product/a");
    expect(getStorefrontNavStackPaths()).toEqual(["/", "/product/a"]);
    expect(getPreviousStorefrontPath()).toBe("/");
    rewindStorefrontStackTo("/");
    expect(getStorefrontNavStackPaths()).toEqual(["/"]);
  });
});
