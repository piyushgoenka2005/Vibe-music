import { describe, expect, it } from "vitest";
import {
  buildTotpUri,
  generateTotpSecret,
  verifyTotpToken,
  totpFingerprint,
} from "@/lib/auth/totp";

describe("totp", () => {
  it("round-trips a generated code", async () => {
    const secret = generateTotpSecret();
    // Generate via the same helper used in tests of the real flow.
    const { TOTP, NobleCryptoPlugin, ScureBase32Plugin } = (await import(
      "otplib"
    )) as typeof import("otplib");
    const t = new TOTP({
      secret,
      crypto: new NobleCryptoPlugin(),
      base32: new ScureBase32Plugin(),
    });
    const code = await t.generate();

    expect((await verifyTotpToken(secret, code)).valid).toBe(true);
  });

  it("rejects malformed and wrong codes", async () => {
    const secret = generateTotpSecret();
    expect((await verifyTotpToken(secret, "abc123")).valid).toBe(false);
    expect((await verifyTotpToken(secret, "12345")).valid).toBe(false);
    expect((await verifyTotpToken(secret, "000000")).valid).toBe(false);
    expect((await verifyTotpToken("", "123456")).valid).toBe(false);
  });

  it("accepts codes with stray spaces (manual entry UX)", async () => {
    const secret = generateTotpSecret();
    const { TOTP, NobleCryptoPlugin, ScureBase32Plugin } = (await import(
      "otplib"
    )) as typeof import("otplib");
    const t = new TOTP({
      secret,
      crypto: new NobleCryptoPlugin(),
      base32: new ScureBase32Plugin(),
    });
    const code = await t.generate();
    const spaced = `${code.slice(0, 3)} ${code.slice(3)}`;
    const result = await verifyTotpToken(secret, spaced);
    expect(result.valid).toBe(true);
  });

  it("builds an otpauth uri with the issuer and label", () => {
    const uri = buildTotpUri({ secret: "JBSWY3DPEHPK3PXP", accountLabel: "a@b.c" });
    expect(uri).toContain("otpauth://totp/");
    expect(uri).toContain("issuer=Vibe%20Music");
    expect(uri).toContain("a%40b.c");
  });

  it("fingerprints are stable and non-reversible-looking", () => {
    expect(totpFingerprint("AAA")).toBe(totpFingerprint("AAA"));
    expect(totpFingerprint("AAA")).not.toBe(totpFingerprint("BBB"));
  });
});
