import { createJSONStorage, type StateStorage } from "zustand/middleware";

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

/** Storage that no-ops during SSR / Node so persist middleware never touches localStorage. */
export function getSafeLocalStorage(): StateStorage {
  if (typeof window === "undefined") {
    return noopStorage;
  }

  try {
    return window.localStorage;
  } catch {
    return noopStorage;
  }
}

export function createSafeJSONStorage() {
  return createJSONStorage(() => getSafeLocalStorage());
}

/** Storage that no-ops during SSR / Node so persist middleware never touches sessionStorage. */
export function getSafeSessionStorage(): StateStorage {
  if (typeof window === "undefined") {
    return noopStorage;
  }

  try {
    return window.sessionStorage;
  } catch {
    return noopStorage;
  }
}

export function createSafeSessionJSONStorage() {
  return createJSONStorage(() => getSafeSessionStorage());
}
