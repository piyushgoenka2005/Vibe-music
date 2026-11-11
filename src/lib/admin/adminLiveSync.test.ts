import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isAdminMutationRequest,
  LOCAL_UNAUTHORIZED_EVENT,
  notifyAdminUnauthorized,
  STORAGE_UNAUTHORIZED_KEY,
  subscribeAdminDataChanged,
} from "./adminLiveSync";

describe("isAdminMutationRequest", () => {
  it.each([
    ["/api/admin/products/p1", "PUT"],
    ["/api/admin/categories", "POST"],
    ["/api/admin/coupons/c1", "PATCH"],
    ["/api/admin/banners/b1", "DELETE"],
    ["http://localhost:3000/api/admin/settings", "put"],
  ])("treats %s %s as an admin write", (url, method) => {
    expect(isAdminMutationRequest(url, { method })).toBe(true);
  });

  it("reads the method from a Request object", () => {
    const request = new Request("http://localhost/api/admin/brands", { method: "POST" });
    expect(isAdminMutationRequest(request)).toBe(true);
  });

  it.each([
    ["/api/admin/products", undefined],
    ["/api/admin/login", "POST"],
    ["/api/admin/logout", "POST"],
    ["/api/cart", "POST"],
    ["/api/administrator/x", "POST"],
  ])("ignores %s %s", (url, method) => {
    expect(isAdminMutationRequest(url, method ? { method } : undefined)).toBe(false);
  });
});

describe("notifyAdminUnauthorized & subscribeAdminDataChanged", () => {
  const listeners = new Map<string, Array<(event: unknown) => void>>();
  const storageMap = new Map<string, string>();

  beforeEach(() => {
    listeners.clear();
    storageMap.clear();

    const fakeWindow = {
      dispatchEvent: vi.fn((event: { type: string }) => {
        listeners.get(event.type)?.forEach((fn) => fn(event));
        return true;
      }),
      addEventListener: vi.fn((type: string, fn: (event: unknown) => void) => {
        const list = listeners.get(type) ?? [];
        list.push(fn);
        listeners.set(type, list);
      }),
      removeEventListener: vi.fn((type: string, fn: (event: unknown) => void) => {
        const list = listeners.get(type) ?? [];
        listeners.set(
          type,
          list.filter((f) => f !== fn),
        );
      }),
    };

    const fakeStorage = {
      getItem: vi.fn((k: string) => storageMap.get(k) ?? null),
      setItem: vi.fn((k: string, v: string) => storageMap.set(k, v)),
      removeItem: vi.fn((k: string) => storageMap.delete(k)),
      clear: vi.fn(() => storageMap.clear()),
    };

    vi.stubGlobal("window", fakeWindow);
    vi.stubGlobal("localStorage", fakeStorage);
    vi.stubGlobal("sessionStorage", fakeStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("dispatches local unauthorized event and updates localStorage timestamp", () => {
    const listener = vi.fn();
    window.addEventListener(LOCAL_UNAUTHORIZED_EVENT, listener);
    try {
      notifyAdminUnauthorized();
      expect(listener).toHaveBeenCalled();
      expect(localStorage.getItem(STORAGE_UNAUTHORIZED_KEY)).toBeTruthy();
    } finally {
      window.removeEventListener(LOCAL_UNAUTHORIZED_EVENT, listener);
    }
  });

  it("triggers unauthorized event when storage event fires with unauthorized key", () => {
    const listener = vi.fn();
    window.addEventListener(LOCAL_UNAUTHORIZED_EVENT, listener);
    const unsubscribe = subscribeAdminDataChanged(vi.fn());
    try {
      window.dispatchEvent({
        type: "storage",
        key: STORAGE_UNAUTHORIZED_KEY,
        newValue: String(Date.now()),
      } as unknown as Event);
      expect(listener).toHaveBeenCalled();
    } finally {
      unsubscribe();
      window.removeEventListener(LOCAL_UNAUTHORIZED_EVENT, listener);
    }
  });
});
