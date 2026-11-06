/**
 * E2E Test Suite Setup & Browser Environment Simulation
 * Provides browser environment primitives (localStorage, sessionStorage, matchMedia, observers)
 * in Node.js test environment for deterministic, high-speed execution.
 */
import { vi } from "vitest";

// In-memory Storage Implementation
class MemoryStorage implements Storage {
  private map = new Map<string, string>();

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }

  get length(): number {
    return this.map.size;
  }
}

// Global browser window mocks
const memoryLocalStorage = new MemoryStorage();
const memorySessionStorage = new MemoryStorage();

Object.defineProperty(globalThis, "localStorage", {
  value: memoryLocalStorage,
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, "sessionStorage", {
  value: memorySessionStorage,
  writable: true,
  configurable: true,
});

// Mock matchMedia for mobile viewport checks
const mockMatchMedia = (query: string): MediaQueryList => {
  // Parse max-width or min-width queries
  const maxWidthMatch = query.match(/max-width:\s*(\d+)px/);
  const minWidthMatch = query.match(/min-width:\s*(\d+)px/);
  const currentWidth =
    (globalThis as unknown as { __TEST_VIEWPORT_WIDTH__?: number }).__TEST_VIEWPORT_WIDTH__ ?? 1280;

  let matches = false;
  if (maxWidthMatch) {
    const maxWidth = parseInt(maxWidthMatch[1], 10);
    matches = currentWidth <= maxWidth;
  } else if (minWidthMatch) {
    const minWidth = parseInt(minWidthMatch[1], 10);
    matches = currentWidth >= minWidth;
  }

  return {
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
};

if (typeof window !== "undefined") {
  window.localStorage = memoryLocalStorage;
  window.sessionStorage = memorySessionStorage;
  window.matchMedia = mockMatchMedia;
  window.scrollTo = vi.fn();
} else {
  (globalThis as unknown as Record<string, unknown>).window = {
    localStorage: memoryLocalStorage,
    sessionStorage: memorySessionStorage,
    matchMedia: mockMatchMedia,
    scrollTo: vi.fn(),
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    setInterval: globalThis.setInterval,
    clearInterval: globalThis.clearInterval,
  };
}

// Mock IntersectionObserver
if (typeof globalThis.IntersectionObserver === "undefined") {
  class MockIntersectionObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn().mockReturnValue([]);
  }
  (globalThis as unknown as Record<string, unknown>).IntersectionObserver =
    MockIntersectionObserver;
}

// Mock ResizeObserver
if (typeof globalThis.ResizeObserver === "undefined") {
  class MockResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  (globalThis as unknown as Record<string, unknown>).ResizeObserver = MockResizeObserver;
}
