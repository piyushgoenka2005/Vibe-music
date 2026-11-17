import { describe, expect, it } from "vitest";
import {
  hasAdminSessionCookie,
  hasAuthSessionCookie,
  isSessionCookiePlausible,
} from "./session-cookie";

describe("session-cookie", () => {
  it("rejects missing or short session cookies", () => {
    expect(isSessionCookiePlausible(undefined)).toBe(false);
    expect(isSessionCookiePlausible("")).toBe(false);
    expect(isSessionCookiePlausible("short-cookie")).toBe(false);
    expect(isSessionCookiePlausible("a".repeat(15))).toBe(false);
    expect(isSessionCookiePlausible("a".repeat(16))).toBe(true);
  });

  it("recognizes valid primary secure session cookie", () => {
    const valid = "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIn0";
    const cookies = {
      get: (name: string) => {
        if (name === "__Secure-authjs.session-token") return { value: valid };
        return undefined;
      },
    };
    expect(hasAuthSessionCookie(cookies, true)).toBe(true);
    expect(hasAdminSessionCookie(cookies, true)).toBe(true);
  });

  it("falls back to alternate cookie when primary cookie is empty string (deletion cookie)", () => {
    const valid = "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIn0";
    const cookies = {
      get: (name: string) => {
        if (name === "authjs.session-token") return { value: "" };
        if (name === "__Secure-authjs.session-token") return { value: valid };
        return undefined;
      },
    };
    // secure=false means primary is authjs.session-token (""), fallback is __Secure-... (valid)
    expect(hasAuthSessionCookie(cookies, false)).toBe(true);
  });

  it("falls back to dev cookie when secure cookie is empty string", () => {
    const valid = "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIn0";
    const cookies = {
      get: (name: string) => {
        if (name === "__Secure-authjs.session-token") return { value: "" };
        if (name === "authjs.session-token") return { value: valid };
        return undefined;
      },
    };
    // secure=true means primary is __Secure-... (""), fallback is dev token (valid)
    expect(hasAuthSessionCookie(cookies, true)).toBe(true);
  });

  it("returns false if both primary and fallback are missing or empty", () => {
    const cookies = {
      get: () => ({ value: "" }),
    };
    expect(hasAuthSessionCookie(cookies, true)).toBe(false);
    expect(hasAuthSessionCookie(cookies, false)).toBe(false);
  });
});
