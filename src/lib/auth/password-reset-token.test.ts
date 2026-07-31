import { describe, expect, it } from "vitest";
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
} from "@/lib/auth/password-reset-token";

describe("password-reset-token", () => {
  it("hashes deterministically and never equals the raw token", () => {
    const token = generatePasswordResetToken();
    const hash = hashPasswordResetToken(token);
    expect(hash).toHaveLength(64);
    expect(hash).not.toEqual(token);
    expect(hashPasswordResetToken(token)).toBe(hash);
  });

  it("produces different hashes for different tokens", () => {
    const a = generatePasswordResetToken();
    const b = generatePasswordResetToken();
    expect(a).not.toEqual(b);
    expect(hashPasswordResetToken(a)).not.toEqual(hashPasswordResetToken(b));
  });
});
